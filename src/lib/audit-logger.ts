/**
 * Audit Logger — persists security events to MongoDB `security_audit_logs`
 * Called from API routes to record forbidden access, CSRF violations, etc.
 */
import crypto from 'crypto';
import { getDb } from './mongodb';
import type { AuditEvent, AuditEventType, Domain } from './rbac';
import { AUDIT_SEVERITY } from './rbac';

export async function writeAuditLog(params: {
  event: AuditEventType;
  userId?: string | null;
  email?: string | null;
  role?: string | null;
  attemptedDomain: Domain;
  attemptedPath: string;
  req: Request;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const auditId = crypto.randomBytes(8).toString('hex').toUpperCase();

  const ip =
    params.req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    params.req.headers.get('x-real-ip') ||
    '127.0.0.1';

  const entry: AuditEvent = {
    event: params.event,
    userId: params.userId ?? null,
    email: params.email ?? null,
    role: params.role ?? null,
    attemptedDomain: params.attemptedDomain,
    attemptedPath: params.attemptedPath,
    ip,
    userAgent: params.req.headers.get('user-agent') || 'Unknown',
    severity: AUDIT_SEVERITY[params.event],
    timestamp: new Date(),
    auditId,
    metadata: params.metadata,
  };

  try {
    const db = await getDb();
    await db.collection('security_audit_logs').insertOne(entry);
  } catch (err) {
    // Never let audit logging break the main flow
    console.error('[AUDIT LOG WRITE FAILED]', err);
  }

  // Always log critical events to server console
  if (entry.severity === 'CRITICAL' || entry.severity === 'HIGH') {
    console.warn(`[SECURITY AUDIT][${entry.severity}][${auditId}]`, {
      event: entry.event,
      role: entry.role,
      ip: entry.ip,
      path: entry.attemptedPath,
    });
  }

  return auditId;
}
