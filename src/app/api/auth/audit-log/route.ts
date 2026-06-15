/**
 * /api/auth/audit-log
 *
 * Dual-purpose security audit log endpoint:
 *
 *   POST — Insert a security event into `security_audit_logs`.
 *          Caller must supply EITHER:
 *            • A valid access token cookie (admin/super_admin role), OR
 *            • The X-Internal-Secret header (for internal SSR→gateway calls).
 *
 *   GET  — Return the last 100 audit log entries, sorted newest-first.
 *          Caller must supply EITHER:
 *            • A valid access token cookie (admin/super_admin role), OR
 *            • The X-Internal-Secret header.
 *
 * The internal secret is compared with constant-time equality to prevent
 * timing attacks against the header value.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { getDb } from '@/lib/mongodb';
import {
  COOKIE_ACCESS_TOKEN,
  INTERNAL_SECRET_HEADER,
  type UserRole,
  type Domain,
  type AuditEventType,
  type AuditSeverity,
} from '@/lib/rbac';
import { verifyToken } from '@/lib/auth-token';
import { writeAuditLog } from '@/lib/audit-logger';

// ─── Constants ────────────────────────────────────────────────────────────────
const DOMAIN: Domain = 'supportdomain';
const AUDIT_COLLECTION = 'security_audit_logs';
const LOG_LIMIT = 100;

/** Roles that may call this endpoint via cookie auth */
const ALLOWED_ROLES: UserRole[] = ['super_admin', 'admin'];

// ─── Internal secret (from env with dev fallback) ─────────────────────────────
function getInternalSecret(): string {
  return process.env.RBAC_INTERNAL_SECRET ?? 'xmarty-internal-secret';
}

/** Constant-time comparison of two strings to prevent timing attacks */
function safeCompare(a: string, b: string): boolean {
  try {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length) {
      // Still do a comparison to prevent timing leakage of length information
      crypto.timingSafeEqual(Buffer.alloc(aBuf.length), Buffer.alloc(aBuf.length));
      return false;
    }
    return crypto.timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

// ─── Auth helper ─────────────────────────────────────────────────────────────
/**
 * Returns an auth context if the request is authorized, or null otherwise.
 * Authorization passes if:
 *   - The X-Internal-Secret header matches the configured secret, OR
 *   - The access token cookie is valid and the role is in ALLOWED_ROLES.
 */
async function authorize(req: NextRequest): Promise<{
  via: 'internal_secret' | 'cookie';
  userId: string | null;
  email: string | null;
  role: string | null;
} | null> {
  // ── Option A: Internal secret header ──
  const suppliedSecret = req.headers.get(INTERNAL_SECRET_HEADER);
  if (suppliedSecret !== null) {
    if (safeCompare(suppliedSecret, getInternalSecret())) {
      return { via: 'internal_secret', userId: null, email: null, role: null };
    }
    // Secret was provided but wrong — fail immediately (don't fall through to cookie)
    return null;
  }

  // ── Option B: Access token cookie ──
  const cookieStore = await cookies();
  const accessRaw = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;
  if (!accessRaw) return null;

  const result = verifyToken(accessRaw, 'access');
  if (!result.valid) return null;

  const { sub: userId, email, role, domain: tokenDomain } = result.payload;

  // Token must be scoped to supportdomain
  if (tokenDomain !== DOMAIN) return null;

  // Role must be elevated enough to view security logs
  if (!ALLOWED_ROLES.includes(role as UserRole)) return null;

  return { via: 'cookie', userId, email, role };
}

// ─── POST — Insert a security event ──────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await authorize(req);

  if (!auth) {
    await writeAuditLog({
      event: 'GATEWAY_UNAUTHORIZED',
      userId: null,
      email: null,
      role: null,
      attemptedDomain: DOMAIN,
      attemptedPath: '/api/auth/audit-log',
      req,
      metadata: { method: 'POST', reason: 'unauthorized_audit_write_attempt' },
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Parse body ──
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // ── Basic shape validation ──
  const { event, userId, email, role, attemptedDomain, attemptedPath, ip, userAgent, severity } =
    body as {
      event?: AuditEventType;
      userId?: string | null;
      email?: string | null;
      role?: string | null;
      attemptedDomain?: Domain;
      attemptedPath?: string;
      ip?: string;
      userAgent?: string;
      severity?: AuditSeverity;
      metadata?: Record<string, unknown>;
    };

  if (!event || !attemptedPath) {
    return NextResponse.json(
      { error: 'Missing required fields: event, attemptedPath' },
      { status: 400 }
    );
  }

  // ── Build and persist the document ──
  try {
    const db = await getDb();
    const auditId = crypto.randomBytes(8).toString('hex').toUpperCase();
    const document = {
      event: event,
      userId: userId ?? null,
      email: email ?? null,
      role: role ?? null,
      attemptedDomain: attemptedDomain ?? DOMAIN,
      attemptedPath,
      ip: ip ?? req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1',
      userAgent: userAgent ?? req.headers.get('user-agent') ?? 'Unknown',
      severity: severity ?? 'INFO',
      timestamp: new Date(),
      auditId,
      metadata: (body.metadata as Record<string, unknown>) ?? {},
      _insertedVia: auth.via,
      _insertedBy: auth.userId ?? 'internal',
    };

    await db.collection(AUDIT_COLLECTION).insertOne(document);

    return NextResponse.json({ success: true, auditId }, { status: 201 });
  } catch (err) {
    console.error('[AUDIT-LOG ROUTE] DB insert failed:', err);
    return NextResponse.json({ error: 'Failed to persist audit event' }, { status: 500 });
  }
}

// ─── GET — Retrieve last 100 audit log entries ────────────────────────────────
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await authorize(req);

  if (!auth) {
    await writeAuditLog({
      event: 'GATEWAY_UNAUTHORIZED',
      userId: null,
      email: null,
      role: null,
      attemptedDomain: DOMAIN,
      attemptedPath: '/api/auth/audit-log',
      req,
      metadata: { method: 'GET', reason: 'unauthorized_audit_read_attempt' },
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = await getDb();
    const logs = await db
      .collection(AUDIT_COLLECTION)
      .find({})
      .sort({ timestamp: -1 })
      .limit(LOG_LIMIT)
      .toArray();

    return NextResponse.json({ logs, total: logs.length }, { status: 200 });
  } catch (err) {
    console.error('[AUDIT-LOG ROUTE] DB read failed:', err);
    return NextResponse.json({ error: 'Failed to retrieve audit logs' }, { status: 500 });
  }
}
