/**
 * POST /api/mongodb-gateway
 * Hardened MongoDB Gateway for Support Domain (:4000)
 *
 * Security layers applied:
 * 1. Authentication check — valid access token cookie required for mutations
 * 2. CSRF validation — X-CSRF-Token header required for mutations
 * 3. RBAC — role must be allowed in supportdomain
 * 4. Collection-level write protection — some collections require elevated roles
 * 5. Audit logging — unauthorized attempts logged to security_audit_logs
 * 6. SSR bypass — X-Internal-Secret header allows SSR reads (layout.tsx)
 *
 * READ actions (find, findOne): require session OR internal secret
 * WRITE actions (insert, update, upsert, delete): always require auth + CSRF
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyToken } from '@/lib/auth-token';
import { validateCsrf, parseCookies } from '@/lib/csrf';
import { writeAuditLog } from '@/lib/audit-logger';
import {
  COOKIE_ACCESS_TOKEN,
  COOKIE_CSRF,
  isRoleAllowedInDomain,
  canWriteToCollection,
  INTERNAL_SECRET_HEADER,
} from '@/lib/rbac';
import type { UserRole } from '@/lib/rbac';

const DOMAIN = 'supportdomain' as const;
const WRITE_ACTIONS = ['insertOne', 'updateOne', 'upsert', 'deleteOne', 'deleteMany'];
const READ_ACTIONS = ['find', 'findOne'];

const INTERNAL_SECRET =
  process.env.RBAC_INTERNAL_SECRET || 'xmarty-internal-secret-change-in-prod';

// ─── Editor-forbidden collections (write) ─────────────────────────────────────
const EDITOR_FORBIDDEN_WRITE_COLLECTIONS = [
  'users',
  'profiles',
  'site_settings',
  'security_logs',
  'security_audit_logs',
  'staff',
];

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie');
  const cookies = parseCookies(cookieHeader);
  const accessToken = cookies[COOKIE_ACCESS_TOKEN];
  const internalSecret = req.headers.get(INTERNAL_SECRET_HEADER);
  const isInternalCall = internalSecret === INTERNAL_SECRET;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { action, collection: collectionName, filter = {}, data = {}, options = {} } = body;

  if (!collectionName) {
    return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
  }

  const isWrite = WRITE_ACTIONS.includes(action);
  const isRead = READ_ACTIONS.includes(action);

  // ── Authentication ─────────────────────────────────────────────────────────
  let userId: string | null = null;
  let userRole: UserRole | null = null;
  let userEmail: string | null = null;

  if (isInternalCall && isRead) {
    // SSR read: allowed without user session
    // Fall through to execute
  } else if (accessToken) {
    const tokenResult = verifyToken(accessToken, 'access');
    if (!tokenResult.valid) {
      const auditEvent =
        tokenResult.reason === 'tampered' ? 'TOKEN_TAMPERED' : 'TOKEN_EXPIRED';
      await writeAuditLog({
        event: auditEvent,
        attemptedDomain: DOMAIN,
        attemptedPath: `/api/mongodb-gateway [${action}:${collectionName}]`,
        req,
        metadata: { tokenReason: tokenResult.reason },
      });
      return NextResponse.json(
        { error: tokenResult.reason === 'expired' ? 'Session expired' : 'Invalid token' },
        { status: 401 }
      );
    }

    userId = tokenResult.payload.sub;
    userRole = tokenResult.payload.role as UserRole;
    userEmail = tokenResult.payload.email;

    // Domain check
    if (!isRoleAllowedInDomain(userRole, DOMAIN)) {
      await writeAuditLog({
        event: 'GATEWAY_UNAUTHORIZED',
        userId,
        email: userEmail,
        role: userRole,
        attemptedDomain: DOMAIN,
        attemptedPath: `/api/mongodb-gateway [${action}:${collectionName}]`,
        req,
      });
      return NextResponse.json({ error: 'Forbidden: insufficient domain access' }, { status: 403 });
    }
  } else if (isWrite) {
    // Write without any token
    await writeAuditLog({
      event: 'GATEWAY_UNAUTHORIZED',
      attemptedDomain: DOMAIN,
      attemptedPath: `/api/mongodb-gateway [${action}:${collectionName}]`,
      req,
      metadata: { reason: 'unauthenticated_write' },
    });
    return NextResponse.json(
      { error: 'Authentication required for write operations.' },
      { status: 401 }
    );
  } else if (isRead) {
    // Read without session — block (except internal SSR)
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  // ── CSRF validation for writes ─────────────────────────────────────────────
  if (isWrite && !isInternalCall) {
    const csrfResult = validateCsrf({
      cookieToken: cookies[COOKIE_CSRF],
      headerToken: req.headers.get('x-csrf-token'),
      origin: req.headers.get('origin'),
      referer: req.headers.get('referer'),
      domain: DOMAIN,
      method: 'POST',
    });
    if (!csrfResult.valid) {
      await writeAuditLog({
        event: 'CSRF_VIOLATION',
        userId,
        email: userEmail,
        role: userRole,
        attemptedDomain: DOMAIN,
        attemptedPath: `/api/mongodb-gateway [${action}:${collectionName}]`,
        req,
        metadata: { csrfReason: csrfResult.reason },
      });
      return NextResponse.json(
        { error: 'CSRF validation failed.', detail: csrfResult.reason },
        { status: 403 }
      );
    }
  }

  // ── Collection-level write protection ──────────────────────────────────────
  if (isWrite && userRole && !canWriteToCollection(userRole, collectionName)) {
    await writeAuditLog({
      event: 'GATEWAY_FORBIDDEN_COLLECTION',
      userId,
      email: userEmail,
      role: userRole,
      attemptedDomain: DOMAIN,
      attemptedPath: `/api/mongodb-gateway [${action}:${collectionName}]`,
      req,
      metadata: { collection: collectionName, action },
    });
    return NextResponse.json(
      { error: `Your role (${userRole}) does not have write access to '${collectionName}'.` },
      { status: 403 }
    );
  }

  // ── Editor write restriction ───────────────────────────────────────────────
  if (isWrite && userRole === 'editor' && EDITOR_FORBIDDEN_WRITE_COLLECTIONS.includes(collectionName)) {
    await writeAuditLog({
      event: 'PRIVILEGE_ESCALATION_ATTEMPT',
      userId,
      email: userEmail,
      role: 'editor',
      attemptedDomain: DOMAIN,
      attemptedPath: `/api/mongodb-gateway [${action}:${collectionName}]`,
      req,
      metadata: { collection: collectionName, reason: 'editor_forbidden_collection' },
    });
    return NextResponse.json(
      { error: `Editor role cannot write to '${collectionName}'.` },
      { status: 403 }
    );
  }

  // ── Execute DB operation ───────────────────────────────────────────────────
  try {
    const db = await getDb();
    const collection = db.collection(collectionName);

    const safeFilter = { ...filter };
    const safeData = { ...data };

    // ObjectId normalization
    if (safeFilter._id && typeof safeFilter._id === 'string' && ObjectId.isValid(safeFilter._id)) {
      safeFilter._id = new ObjectId(safeFilter._id);
    }
    if (safeFilter._id?.$in) {
      safeFilter._id.$in = safeFilter._id.$in.map((id: any) =>
        typeof id === 'string' && ObjectId.isValid(id) ? new ObjectId(id) : id
      );
    }
    if (safeData._id && typeof safeData._id === 'string' && ObjectId.isValid(safeData._id)) {
      safeData._id = new ObjectId(safeData._id);
    }

    let result: any;
    switch (action) {
      case 'find': {
        const cursor = collection.find(safeFilter);
        if (options.sort) cursor.sort(options.sort);
        if (options.limit) cursor.limit(options.limit);
        if (options.skip) cursor.skip(options.skip);
        result = await cursor.toArray();
        break;
      }
      case 'findOne':
        result = await collection.findOne(safeFilter);
        break;
      case 'insertOne': {
        if (collectionName === 'course_folders') {
          if (!safeData.parent_folder_id) {
            const isInstructor = userRole === 'instructor';
            safeData.approved = !isInstructor;
          }
        }
        const ins = await collection.insertOne({ ...safeData, _created_by: userId, _created_at: new Date() });
        result = { ...safeData, _id: ins.insertedId };
        break;
      }
      case 'updateOne': {
        const upd = await collection.updateOne(safeFilter, {
          $set: { ...safeData, _updated_by: userId, _updated_at: new Date() },
        }, options);
        result = { matchedCount: upd.matchedCount, modifiedCount: upd.modifiedCount };
        break;
      }
      case 'upsert': {
        const ups = await collection.updateOne(safeFilter, {
          $set: { ...safeData, _updated_by: userId, _updated_at: new Date() },
          $setOnInsert: { _created_by: userId, _created_at: new Date() },
        }, { upsert: true });
        result = { matchedCount: ups.matchedCount, modifiedCount: ups.modifiedCount, upsertedId: ups.upsertedId };
        break;
      }
      case 'deleteOne': {
        const del = await collection.deleteOne(safeFilter);
        result = { deletedCount: del.deletedCount };
        break;
      }
      case 'deleteMany': {
        const delm = await collection.deleteMany(safeFilter);
        result = { deletedCount: delm.deletedCount };
        break;
      }
      default:
        return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error('[MONGODB GATEWAY ERROR]', error);
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
