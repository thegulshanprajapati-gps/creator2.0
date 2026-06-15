/**
 * Auth Token — HMAC-SHA256 JWT signing and verification
 * Uses Node.js native `crypto` — no third-party JWT library needed.
 *
 * Token structure: base64url(header).base64url(payload).base64url(signature)
 * Algorithm: HS256 (HMAC-SHA256)
 */
import crypto from 'crypto';
import { ACCESS_TOKEN_TTL_MS, REFRESH_TOKEN_TTL_MS } from './rbac';

// ─── Secret Key ───────────────────────────────────────────────────────────────
function getSecret(type: 'access' | 'refresh'): string {
  const secret =
    type === 'access'
      ? process.env.RBAC_ACCESS_SECRET
      : process.env.RBAC_REFRESH_SECRET;
  if (!secret) {
    // In dev, use a fallback. In production this MUST be set.
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`RBAC_${type.toUpperCase()}_SECRET environment variable is not set!`);
    }
    return type === 'access'
      ? 'xmarty-dev-access-secret-change-in-prod-32chars!!'
      : 'xmarty-dev-refresh-secret-change-in-prod-32chars!';
  }
  return secret;
}

// ─── Base64URL helpers ────────────────────────────────────────────────────────
function base64urlEncode(data: string): string {
  return Buffer.from(data)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString('utf-8');
}

// ─── Payload Types ────────────────────────────────────────────────────────────
export interface TokenPayload {
  sub: string;       // user ID
  email: string;
  role: string;
  domain: string;    // which domain this token was issued for
  iat: number;       // issued at (Unix seconds)
  exp: number;       // expires at (Unix seconds)
  jti: string;       // JWT ID (unique per token, prevents replay)
  type: 'access' | 'refresh';
}

// ─── Sign ─────────────────────────────────────────────────────────────────────
export function signToken(
  payload: Omit<TokenPayload, 'iat' | 'exp' | 'jti'> & { ttlMs?: number }
): string {
  const { ttlMs, ...rest } = payload;
  const now = Math.floor(Date.now() / 1000);
  const ttlSec = Math.floor((ttlMs ?? ACCESS_TOKEN_TTL_MS) / 1000);

  const header = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const claims: TokenPayload = {
    ...rest,
    iat: now,
    exp: now + ttlSec,
    jti: crypto.randomBytes(16).toString('hex'),
  };
  const encodedPayload = base64urlEncode(JSON.stringify(claims));
  const signingInput = `${header}.${encodedPayload}`;

  const secret = getSecret(payload.type);
  const sig = crypto
    .createHmac('sha256', secret)
    .update(signingInput)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${signingInput}.${sig}`;
}

// ─── Verify ───────────────────────────────────────────────────────────────────
export type VerifyResult =
  | { valid: true; payload: TokenPayload }
  | { valid: false; reason: 'expired' | 'tampered' | 'malformed' | 'wrong_type' };

export function verifyToken(token: string, expectedType: 'access' | 'refresh'): VerifyResult {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false, reason: 'malformed' };

    const [header, encodedPayload, sig] = parts;
    const signingInput = `${header}.${encodedPayload}`;

    // Determine which secret to use based on expected type
    const secret = getSecret(expectedType);
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(signingInput)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Constant-time comparison to prevent timing attacks
    const sigBuffer = Buffer.from(sig);
    const expectedBuffer = Buffer.from(expectedSig);
    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return { valid: false, reason: 'tampered' };
    }

    const payload: TokenPayload = JSON.parse(base64urlDecode(encodedPayload));

    // Validate token type
    if (payload.type !== expectedType) {
      return { valid: false, reason: 'wrong_type' };
    }

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return { valid: false, reason: 'expired' };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, reason: 'malformed' };
  }
}

import { getDb } from './mongodb';

// ─── Issue Token Pair ─────────────────────────────────────────────────────────
export async function issueTokenPair(params: {
  userId: string;
  email: string;
  role: string;
  domain: string;
}): Promise<{ accessToken: string; refreshToken: string; accessExpiresAt: number; refreshExpiresAt: number }> {
  const now = Math.floor(Date.now() / 1000);
  const accessTtlSec = Math.floor(ACCESS_TOKEN_TTL_MS / 1000);
  const refreshTtlSec = Math.floor(REFRESH_TOKEN_TTL_MS / 1000);

  const accessToken = signToken({
    sub: params.userId,
    email: params.email,
    role: params.role,
    domain: params.domain,
    type: 'access',
    ttlMs: ACCESS_TOKEN_TTL_MS,
  });

  const refreshToken = signToken({
    sub: params.userId,
    email: params.email,
    role: params.role,
    domain: params.domain,
    type: 'refresh',
    ttlMs: REFRESH_TOKEN_TTL_MS,
  });

  // Extract jti from generated refreshToken
  const parts = refreshToken.split('.');
  const decodedPayload = JSON.parse(base64urlDecode(parts[1]));
  const jti = decodedPayload.jti;

  // Store refresh token in DB
  try {
    const db = await getDb();
    await db.collection('refresh_tokens').insertOne({
      tokenId: jti,
      userId: params.userId,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      revoked: false,
      lastUsedAt: null,
    });
  } catch (err) {
    console.error('Failed to store refresh token:', err);
  }

  return {
    accessToken,
    refreshToken,
    accessExpiresAt: now + accessTtlSec,
    refreshExpiresAt: now + refreshTtlSec,
  };
}

// ─── Cookie Options ───────────────────────────────────────────────────────────
export function getAccessCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: Math.floor(ACCESS_TOKEN_TTL_MS / 1000),
  };
}

export function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/api/auth/refresh',  // refresh token only usable at refresh endpoint
    maxAge: Math.floor(REFRESH_TOKEN_TTL_MS / 1000),
  };
}
