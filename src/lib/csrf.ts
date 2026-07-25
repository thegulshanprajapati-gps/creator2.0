/**
 * CSRF Protection — Double-submit cookie pattern
 *
 * Flow:
 *  1. GET /api/auth/csrf  → server generates CSRF token, sets it in a non-httpOnly cookie,
 *     also returns it in the JSON response body.
 *  2. Client stores the token and sends it as `X-CSRF-Token` header on every mutation.
 *  3. Server validates: cookie value === header value (double-submit).
 *
 * Also validates: Origin/Referer header is from an allowed domain.
 */
import crypto from 'crypto';
import { COOKIE_CSRF } from './rbac';

// ─── Allowed origins per domain ───────────────────────────────────────────────
const SUPPORT_ALLOWED_ORIGINS = [
  'http://localhost:4000',
  'https://support.xmartycreator.com',
];

const INSTRUCTOR_ALLOWED_ORIGINS = [
  'http://localhost:5000',
  'https://instructor.xmartycreator.com',
];

// ─── Generate CSRF token ──────────────────────────────────────────────────────
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ─── Set CSRF cookie (non-httpOnly so JS can read it) ────────────────────────
export function csrfCookieValue(token: string): string {
  return token;
}

export const CSRF_COOKIE_OPTIONS = {
  httpOnly: false,          // must be readable by JS (double-submit pattern)
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 60 * 60,          // 1 hour
};

// ─── Validate CSRF ────────────────────────────────────────────────────────────
export type CsrfValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

export function validateCsrf(params: {
  cookieToken: string | undefined;
  headerToken: string | null | undefined;
  origin: string | null;
  referer: string | null;
  domain: 'supportdomain' | 'instructordomain';
  method: string;
}): CsrfValidationResult {
  const { cookieToken, headerToken, origin, referer, domain, method } = params;

  // Safe methods don't need CSRF protection
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(method.toUpperCase())) {
    return { valid: true };
  }

  const allowedOrigins =
    domain === 'supportdomain' ? SUPPORT_ALLOWED_ORIGINS : INSTRUCTOR_ALLOWED_ORIGINS;

  // ── Origin validation ──
  const requestOrigin = origin || referer;
  if (requestOrigin) {
    const isAllowed = allowedOrigins.some(
      (o) => requestOrigin === o || requestOrigin.startsWith(o + '/')
    );
    if (!isAllowed) {
      return {
        valid: false,
        reason: `Origin '${requestOrigin}' is not allowed for domain '${domain}'`,
      };
    }
  }

  // ── Double-submit cookie check ──
  if (!cookieToken) {
    return { valid: false, reason: 'CSRF cookie missing' };
  }
  if (!headerToken) {
    return { valid: false, reason: 'X-CSRF-Token header missing' };
  }

  // Constant-time comparison
  const cookieBuf = Buffer.from(cookieToken);
  const headerBuf = Buffer.from(headerToken);
  if (
    cookieBuf.length !== headerBuf.length ||
    !crypto.timingSafeEqual(cookieBuf, headerBuf)
  ) {
    return { valid: false, reason: 'CSRF token mismatch' };
  }

  return { valid: true };
}

// ─── Parse cookies from header ────────────────────────────────────────────────
export function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const idx = c.indexOf('=');
      const key = c.slice(0, idx).trim();
      const val = c.slice(idx + 1).trim();
      return [key, val];
    })
  );
}

export { COOKIE_CSRF };
