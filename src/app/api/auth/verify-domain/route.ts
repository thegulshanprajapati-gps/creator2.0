/**
 * GET /api/auth/verify-domain
 *
 * Validates that the caller's access token:
 *   1. Exists and is cryptographically valid.
 *   2. Was issued for the 'supportdomain' domain.
 *   3. Carries a role that is permitted in 'supportdomain'.
 *
 * Used by the Next.js middleware and internal SSR pages to gate access
 * without an additional DB round-trip.
 *
 * Responses:
 *   200 — { allowed: true, user: { id, email, role } }
 *   401 — Token missing or expired.
 *   403 — Wrong domain or role not allowed.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  COOKIE_ACCESS_TOKEN,
  isRoleAllowedInDomain,
  type UserRole,
  type Domain,
} from '@/lib/rbac';
import { verifyToken } from '@/lib/auth-token';
import { writeAuditLog } from '@/lib/audit-logger';

const DOMAIN: Domain = 'supportdomain';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;

  // ── 1. Missing token — unauthenticated ───────────────────────────────────
  if (!accessToken) {
    return NextResponse.json(
      { allowed: false, reason: 'unauthenticated', code: 'NO_TOKEN' },
      { status: 401 }
    );
  }

  // ── 2. Verify token signature & expiry ───────────────────────────────────
  const result = verifyToken(accessToken, 'access');

  if (!result.valid) {
    if (result.reason === 'expired') {
      return NextResponse.json(
        { allowed: false, reason: 'expired', code: 'TOKEN_EXPIRED' },
        { status: 401 }
      );
    }

    // Tampered / malformed / wrong_type — security event
    await writeAuditLog({
      event: 'TOKEN_TAMPERED',
      userId: null,
      email: null,
      role: null,
      attemptedDomain: DOMAIN,
      attemptedPath: '/api/auth/verify-domain',
      req,
      metadata: { reason: result.reason },
    });

    return NextResponse.json(
      { allowed: false, reason: 'tampered', code: 'TOKEN_TAMPERED' },
      { status: 401 }
    );
  }

  const { sub: id, email, role, domain: tokenDomain } = result.payload;

  // ── 3. Domain check — token must be scoped to supportdomain ─────────────
  if (tokenDomain !== DOMAIN) {
    await writeAuditLog({
      event: 'DOMAIN_ACCESS_DENIED',
      userId: id,
      email,
      role,
      attemptedDomain: DOMAIN,
      attemptedPath: '/api/auth/verify-domain',
      req,
      metadata: { tokenDomain, requiredDomain: DOMAIN },
    });

    return NextResponse.json(
      {
        allowed: false,
        reason: 'wrong_domain',
        code: 'DOMAIN_ACCESS_DENIED',
      },
      { status: 403 }
    );
  }

  // ── 4. Role check — role must be permitted in supportdomain ──────────────
  const typedRole = role as UserRole;
  if (!isRoleAllowedInDomain(typedRole, DOMAIN)) {
    await writeAuditLog({
      event: 'INVALID_ROLE',
      userId: id,
      email,
      role,
      attemptedDomain: DOMAIN,
      attemptedPath: '/api/auth/verify-domain',
      req,
      metadata: { role, domain: DOMAIN },
    });

    return NextResponse.json(
      {
        allowed: false,
        reason: 'role_not_allowed',
        code: 'INVALID_ROLE',
      },
      { status: 403 }
    );
  }

  // ── 5. All checks passed ─────────────────────────────────────────────────
  return NextResponse.json(
    {
      allowed: true,
      user: { id, email, role },
    },
    { status: 200 }
  );
}
