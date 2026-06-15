/**
 * Next.js Middleware — Support Domain (:4000) Route Guard
 *
 * Runs on EVERY request before it reaches the page/API handler.
 * Validates access token cookie and enforces domain-role rules.
 *
 * Allowed roles: super_admin, admin, editor
 * All others → redirect to /login or /access-denied
 *
 * IMPORTANT: This runs in the Edge Runtime (no Node.js APIs).
 * Token verification here uses only Web Crypto API (built into Next.js middleware).
 */
import { NextRequest, NextResponse } from 'next/server';

// ─── Constants (duplicated from rbac.ts to avoid edge-runtime import issues) ──
const COOKIE_ACCESS_TOKEN = 'xmarty_access_token';
const ALLOWED_ROLES = ['super_admin', 'admin', 'editor'];
const INSTRUCTOR_URL = process.env.NEXT_PUBLIC_INSTRUCTOR_URL || 'http://localhost:5000';
const MAIN_SITE_URL = process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'http://localhost:3000';

// ─── Public paths that don't require auth ─────────────────────────────────────
const PUBLIC_PATHS = [
  '/login',
  '/access-denied',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/refresh',
  '/api/auth/csrf',
  '/favicon.ico',
  '/site.webmanifest',
  '/apple-touch-icon.png',
];

const PUBLIC_PREFIXES = ['/_next/', '/fonts/', '/public/', '/icons/'];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

// ─── Edge-compatible token payload extraction (no crypto, just parse) ─────────
// NOTE: We decode-without-verify here for a fast path check.
// The REAL signature verification happens server-side in /api/auth/verify-domain.
// Middleware is a defense-in-depth first gate, not the sole security layer.
function decodeTokenPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const method = req.method;
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  if (isMutation) {
    const origin = req.headers.get('origin') || req.headers.get('referer') || '';
    const allowedOrigins = [
      'http://localhost:4000',
      'https://support.xmartycreator.com',
    ];
    if (origin) {
      const isAllowed = allowedOrigins.some((o) => origin === o || origin.startsWith(o + '/'));
      if (!isAllowed) {
        return new NextResponse(
          JSON.stringify({ error: 'CSRF violation: invalid origin' }),
          { status: 403, headers: { 'content-type': 'application/json' } }
        );
      }
    }

    const csrfCookie = req.cookies.get('xmarty_csrf')?.value;
    const csrfHeader = req.headers.get('x-csrf-token');
    
    const internalSecret = req.headers.get('X-Internal-Secret');
    const isInternalCall = internalSecret === (process.env.RBAC_INTERNAL_SECRET || 'xmarty-internal-secret-change-in-prod');

    if (!isInternalCall) {
      if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
        return new NextResponse(
          JSON.stringify({ error: 'CSRF violation: token mismatch or missing' }),
          { status: 403, headers: { 'content-type': 'application/json' } }
        );
      }
    }
  }

  const { pathname } = req.nextUrl;

  // Allow public paths through
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_ACCESS_TOKEN)?.value;

  // ── No token ──
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized: missing token' }), { status: 401, headers: { 'content-type': 'application/json' } });
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = decodeTokenPayload(token);

  // ── Malformed token ──
  if (!payload) {
    if (pathname.startsWith('/api/')) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized: invalid token' }), { status: 401, headers: { 'content-type': 'application/json' } });
    }
    const res = NextResponse.redirect(new URL('/login', req.url));
    res.cookies.delete(COOKIE_ACCESS_TOKEN);
    return res;
  }

  // ── Expired token ──
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    if (pathname.startsWith('/api/')) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized: token expired' }), { status: 401, headers: { 'content-type': 'application/json' } });
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('reason', 'session_expired');
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(COOKIE_ACCESS_TOKEN);
    return res;
  }

  const role: string = payload.role || '';

  // ── CRITICAL: Instructor attempting supportdomain ──
  if (role === 'instructor') {
    if (pathname.startsWith('/api/')) {
      return new NextResponse(JSON.stringify({ error: 'Forbidden: domain restricted' }), { status: 403, headers: { 'content-type': 'application/json' } });
    }
    const denied = new URL('/access-denied', req.url);
    denied.searchParams.set('reason', 'instructor_blocked');
    denied.searchParams.set('redirect', INSTRUCTOR_URL);
    const res = NextResponse.redirect(denied);
    res.cookies.delete(COOKIE_ACCESS_TOKEN);
    return res;
  }

  // ── Student attempting supportdomain ──
  if (role === 'student' || role === 'guest') {
    if (pathname.startsWith('/api/')) {
      return new NextResponse(JSON.stringify({ error: 'Forbidden: insufficient permissions' }), { status: 403, headers: { 'content-type': 'application/json' } });
    }
    const denied = new URL('/access-denied', req.url);
    denied.searchParams.set('reason', 'insufficient_role');
    denied.searchParams.set('redirect', MAIN_SITE_URL);
    const res = NextResponse.redirect(denied);
    res.cookies.delete(COOKIE_ACCESS_TOKEN);
    return res;
  }

  // ── Role not in allowed list ──
  if (!ALLOWED_ROLES.includes(role)) {
    if (pathname.startsWith('/api/')) {
      return new NextResponse(JSON.stringify({ error: 'Forbidden: invalid role' }), { status: 403, headers: { 'content-type': 'application/json' } });
    }
    const denied = new URL('/access-denied', req.url);
    denied.searchParams.set('reason', 'invalid_role');
    return NextResponse.redirect(denied);
  }

  // ── Domain mismatch ──
  if (payload.domain && payload.domain !== 'supportdomain') {
    if (pathname.startsWith('/api/')) {
      return new NextResponse(JSON.stringify({ error: 'Forbidden: domain mismatch' }), { status: 403, headers: { 'content-type': 'application/json' } });
    }
    const denied = new URL('/access-denied', req.url);
    denied.searchParams.set('reason', 'domain_mismatch');
    const res = NextResponse.redirect(denied);
    res.cookies.delete(COOKIE_ACCESS_TOKEN);
    return res;
  }

  // ── Pass through — signature verified server-side in verify-domain ──
  // Attach user info to headers for downstream use
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', payload.sub || '');
  requestHeaders.set('x-user-role', role);
  requestHeaders.set('x-user-email', payload.email || '');

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
