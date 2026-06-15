/**
 * POST /api/auth/refresh
 *
 * Issues a fresh access token when the client presents a valid refresh token.
 * The refresh token is stored in an httpOnly cookie scoped to this path.
 *
 * Possible outcomes:
 *   200 — New access token issued, cookie updated.
 *   401 — Missing, expired, or tampered refresh token.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_ACCESS_TOKEN, COOKIE_REFRESH_TOKEN } from '@/lib/rbac';
import {
  verifyToken,
  issueTokenPair,
  getAccessCookieOptions,
  getRefreshCookieOptions,
} from '@/lib/auth-token';
import { writeAuditLog } from '@/lib/audit-logger';
import { getDb } from '@/lib/mongodb';

const DOMAIN = 'supportdomain' as const;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(COOKIE_REFRESH_TOKEN)?.value;

  // ── 1. Missing refresh token ──────────────────────────────────────────────
  if (!refreshToken) {
    return NextResponse.json(
      { error: 'No refresh token', code: 'NO_REFRESH_TOKEN' },
      { status: 401 }
    );
  }

  // ── 2. Verify the refresh token ───────────────────────────────────────────
  const result = verifyToken(refreshToken, 'refresh');

  if (!result.valid) {
    // Expired — legitimate expiry, prompt re-login
    if (result.reason === 'expired') {
      return NextResponse.json(
        { error: 'Session expired', code: 'REFRESH_EXPIRED' },
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
      attemptedPath: '/api/auth/refresh',
      req,
      metadata: { reason: result.reason, tokenPrefix: refreshToken.slice(0, 20) },
    });

    return NextResponse.json(
      { error: 'Invalid refresh token', code: 'TOKEN_TAMPERED' },
      { status: 401 }
    );
  }

  // ── 3. Token is valid — extract claims and verify with DB for rotation ────
  const { sub: userId, email, role, jti } = result.payload;

  try {
    const db = await getDb();
    const storedToken = await db.collection('refresh_tokens').findOne({ tokenId: jti });

    if (!storedToken) {
      return NextResponse.json(
        { error: 'Revoked refresh token', code: 'REFRESH_REVOKED' },
        { status: 401 }
      );
    }

    if (storedToken.revoked) {
      // Replay / Theft detected! Revoke all tokens for this user to invalidate session
      await db.collection('refresh_tokens').updateMany({ userId: storedToken.userId }, { $set: { revoked: true } });

      await writeAuditLog({
        event: 'TOKEN_TAMPERED',
        userId: storedToken.userId,
        email,
        role,
        attemptedDomain: DOMAIN,
        attemptedPath: '/api/auth/refresh',
        req,
        metadata: { reason: 'refresh_token_reuse_theft_detected', tokenId: jti },
      });

      const response = NextResponse.json(
        { error: 'Token theft detected. Session revoked.', code: 'SESSION_REVOKED' },
        { status: 401 }
      );
      response.cookies.delete(COOKIE_ACCESS_TOKEN);
      response.cookies.delete(COOKIE_REFRESH_TOKEN);
      return response;
    }

    // Invalidate the current refresh token
    await db.collection('refresh_tokens').updateOne({ tokenId: jti }, { $set: { revoked: true, lastUsedAt: new Date() } });

    // Issue brand new token pair (rotates refresh token)
    const tokens = await issueTokenPair({
      userId,
      email,
      role,
      domain: DOMAIN,
    });

    const response = NextResponse.json(
      { success: true, accessExpiresAt: tokens.accessExpiresAt },
      { status: 200 }
    );

    response.cookies.set(COOKIE_ACCESS_TOKEN, tokens.accessToken, getAccessCookieOptions());
    response.cookies.set(COOKIE_REFRESH_TOKEN, tokens.refreshToken, getRefreshCookieOptions());

    return response;
  } catch (err: any) {
    console.error('Refresh token error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
