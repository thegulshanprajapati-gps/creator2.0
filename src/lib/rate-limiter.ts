/**
 * In-Memory Rate Limiter
 *
 * Provides per-IP brute-force protection for login endpoint.
 * - 5 failed attempts → 15-minute lockout
 * - Sliding window per IP
 *
 * NOTE: This is an in-memory store (Map). Works for single-process dev.
 * For multi-process/production, replace with Redis via ioredis or upstash.
 */

interface RateLimitEntry {
  failCount: number;
  lockedUntil: number | null;  // Unix timestamp ms, null = not locked
  firstFailAt: number;         // Unix timestamp ms of first failure in window
}

// ─── Config ───────────────────────────────────────────────────────────────────
const MAX_FAILURES = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;  // 15 minutes
const FAILURE_WINDOW_MS = 10 * 60 * 1000;     // reset counter after 10 min of no failures

// ─── Store ────────────────────────────────────────────────────────────────────
const loginAttempts = new Map<string, RateLimitEntry>();

// Prune stale entries every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of loginAttempts.entries()) {
      if (
        (!entry.lockedUntil || now > entry.lockedUntil) &&
        now - entry.firstFailAt > FAILURE_WINDOW_MS * 2
      ) {
        loginAttempts.delete(ip);
      }
    }
  }, 60 * 60 * 1000).unref?.();
}

// ─── Public API ───────────────────────────────────────────────────────────────
export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterMs: number; remainingMs: number };

/** Call this before processing a login attempt. */
export function checkLoginRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry) return { allowed: true };

  // Check lockout
  if (entry.lockedUntil && now < entry.lockedUntil) {
    const remainingMs = entry.lockedUntil - now;
    return { allowed: false, retryAfterMs: remainingMs, remainingMs };
  }

  // Reset if window expired
  if (now - entry.firstFailAt > FAILURE_WINDOW_MS) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

/** Call this on a FAILED login attempt. Returns new rate limit state. */
export function recordLoginFailure(ip: string): RateLimitResult {
  const now = Date.now();
  let entry = loginAttempts.get(ip);

  if (!entry || now - entry.firstFailAt > FAILURE_WINDOW_MS) {
    entry = { failCount: 1, lockedUntil: null, firstFailAt: now };
  } else {
    entry.failCount += 1;
  }

  if (entry.failCount >= MAX_FAILURES) {
    entry.lockedUntil = now + LOCKOUT_DURATION_MS;
    loginAttempts.set(ip, entry);
    return { allowed: false, retryAfterMs: LOCKOUT_DURATION_MS, remainingMs: LOCKOUT_DURATION_MS };
  }

  loginAttempts.set(ip, entry);
  return { allowed: true };
}

/** Call this on a SUCCESSFUL login to reset the counter. */
export function resetLoginRateLimit(ip: string): void {
  loginAttempts.delete(ip);
}

/** Returns how many failures remain before lockout (for UI hints). */
export function getFailuresRemaining(ip: string): number {
  const entry = loginAttempts.get(ip);
  if (!entry) return MAX_FAILURES;
  return Math.max(0, MAX_FAILURES - entry.failCount);
}

/** Format remaining lockout time as human-readable string. */
export function formatLockoutTime(remainingMs: number): string {
  const mins = Math.ceil(remainingMs / 60000);
  return mins === 1 ? '1 minute' : `${mins} minutes`;
}
