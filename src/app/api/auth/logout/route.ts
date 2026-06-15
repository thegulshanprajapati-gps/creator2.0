/**
 * POST /api/auth/logout
 *
 * Clears the access and refresh token cookies and records a LOGOUT
 * audit event. Does NOT require a valid token so that even partially
 * authenticated sessions (e.g. expired access token) can be fully
 * cleared from the client.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_ACCESS_TOKEN, COOKIE_REFRESH_TOKEN } from '@/lib/rbac';
import { verifyToken } from '@/lib/auth-token';
import { writeAuditLog } from '@/lib/audit-logger';

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Best-effort read of the existing access token for audit attribution ──
  const cookieStore = await cookies();
  const accessRaw = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;

  let userId: string | null = null;
  let email: string | null = null;
  let role: string | null = null;

  if (accessRaw) {
    const result = verifyToken(accessRaw, 'access');
    if (result.valid) {
      userId = result.payload.sub;
      email  = result.payload.email;
      role   = result.payload.role;
    }
  }

  // ── Write LOGOUT audit log (fire-and-forget — never blocks response) ──
  writeAuditLog({
    event: 'LOGOUT',
    userId,
    email,
    role,
    attemptedDomain: 'supportdomain',
    attemptedPath: '/api/auth/logout',
    req,
  }).catch(() => {/* audit write failures must never surface to the client */});

  // ── Build response and clear cookies ──
  const response = NextResponse.json({ success: true }, { status: 200 });

  // Clear access token cookie
  response.cookies.set(COOKIE_ACCESS_TOKEN, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });

  // Clear refresh token cookie (scoped to the refresh endpoint path)
  response.cookies.set(COOKIE_REFRESH_TOKEN, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth/refresh',
    maxAge: 0,
  });

  return response;
}
