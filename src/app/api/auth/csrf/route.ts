/**
 * GET /api/auth/csrf
 *
 * Issues a fresh CSRF token via the double-submit cookie pattern.
 *
 * Flow:
 *   1. Server generates a cryptographically random 64-hex-char token.
 *   2. Token is set as a NON-httpOnly cookie (COOKIE_CSRF) so that
 *      JavaScript can read it.
 *   3. Token is also returned in the JSON response body so the client
 *      can store it and attach it as `X-CSRF-Token` on every mutation.
 *   4. On mutations, the server compares cookie value === header value.
 *      Forged cross-site requests cannot read the cookie from another origin,
 *      so they cannot replicate the double-submit.
 *
 * No authentication is required — the security comes from the same-origin
 * constraint on reading cookies, not from who calls this endpoint.
 */
import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfToken, CSRF_COOKIE_OPTIONS } from '@/lib/csrf';
import { COOKIE_CSRF } from '@/lib/rbac';

export async function GET(_req: NextRequest): Promise<NextResponse> {
  // ── Generate a fresh, random CSRF token ──────────────────────────────────
  const csrfToken = generateCsrfToken();

  // ── Build response — token goes both in the cookie AND the body ──────────
  const response = NextResponse.json(
    { csrfToken },
    { status: 200 }
  );

  // Non-httpOnly so JS can read it (required for the double-submit pattern)
  response.cookies.set(COOKIE_CSRF, csrfToken, CSRF_COOKIE_OPTIONS);

  return response;
}
