/**
 * POST /api/auth/login
 * Server-side login for Support Domain (:4000)
 *
 * Allowed roles: super_admin, admin, editor
 * Blocked roles: instructor (hard deny + audit log), student, guest
 *
 * On success: issues httpOnly access + refresh token cookies
 * On deny: returns 403 + writes audit log
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { issueTokenPair, getAccessCookieOptions, getRefreshCookieOptions } from '@/lib/auth-token';
import { checkLoginRateLimit, recordLoginFailure, resetLoginRateLimit, formatLockoutTime } from '@/lib/rate-limiter';
import { writeAuditLog } from '@/lib/audit-logger';
import { isRoleAllowedInDomain, COOKIE_ACCESS_TOKEN, COOKIE_REFRESH_TOKEN, COOKIE_CSRF } from '@/lib/rbac';
import { validateCsrf, parseCookies } from '@/lib/csrf';
import type { UserRole } from '@/lib/rbac';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const DOMAIN = 'supportdomain' as const;
const SUPERADMIN_EMAIL = 'admin@xmartycreator.com';
const SUPERADMIN_PASS = process.env.SUPERADMIN_PASSWORD || 'XmartyAdmin2024!';

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  // ── CSRF Check ──
  const cookieHeader = req.headers.get('cookie');
  const cookiesMap = parseCookies(cookieHeader);
  const csrfResult = validateCsrf({
    cookieToken: cookiesMap[COOKIE_CSRF],
    headerToken: req.headers.get('x-csrf-token'),
    origin: req.headers.get('origin'),
    referer: req.headers.get('referer'),
    domain: DOMAIN,
    method: 'POST',
  });
  if (!csrfResult.valid) {
    await writeAuditLog({
      event: 'CSRF_VIOLATION',
      attemptedDomain: DOMAIN,
      attemptedPath: '/api/auth/login',
      req,
      metadata: { csrfReason: csrfResult.reason },
    });
    return NextResponse.json(
      { error: 'CSRF validation failed.', detail: csrfResult.reason },
      { status: 403 }
    );
  }

  // ── Rate limit check ──
  const rlCheck = checkLoginRateLimit(ip);
  if (!rlCheck.allowed) {
    await writeAuditLog({
      event: 'RATE_LIMIT_EXCEEDED',
      attemptedDomain: DOMAIN,
      attemptedPath: '/api/auth/login',
      req,
    });
    return NextResponse.json(
      {
        error: 'Too many failed login attempts.',
        detail: `Account temporarily locked. Try again in ${formatLockoutTime((rlCheck as any).remainingMs)}.`,
        retryAfterMs: (rlCheck as any).remainingMs,
      },
      { status: 429 }
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  // ── Super admin hardcoded check ──
  if (email === SUPERADMIN_EMAIL) {
    if (password !== SUPERADMIN_PASS) {
      recordLoginFailure(ip);
      await writeAuditLog({
        event: 'LOGIN_FAILED',
        email,
        role: 'super_admin',
        attemptedDomain: DOMAIN,
        attemptedPath: '/api/auth/login',
        req,
        metadata: { reason: 'invalid_password' },
      });
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    resetLoginRateLimit(ip);
    const tokens = await issueTokenPair({ userId: 'superadmin', email, role: 'super_admin', domain: DOMAIN });

    await writeAuditLog({
      event: 'LOGIN_SUCCESS',
      userId: 'superadmin',
      email,
      role: 'super_admin',
      attemptedDomain: DOMAIN,
      attemptedPath: '/api/auth/login',
      req,
    });

    return buildSuccessResponse(tokens, { id: 'superadmin', email, role: 'super_admin' });
  }

  // ── DB lookup ──
  let userRecord: any;
  try {
    const db = await getDb();
    userRecord = await db.collection('users').findOne({ email: email.toLowerCase() });
  } catch (err) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  if (!userRecord) {
    recordLoginFailure(ip);
    await writeAuditLog({
      event: 'LOGIN_FAILED',
      email,
      attemptedDomain: DOMAIN,
      attemptedPath: '/api/auth/login',
      req,
      metadata: { reason: 'account_not_found' },
    });
    return NextResponse.json({ error: 'Account not found.' }, { status: 401 });
  }

  // ── Password check ──
  const storedPassword = userRecord.password || '';
  const storedHash = userRecord.password_hash || '';

  let passwordMatch = false;
  if (storedPassword && storedPassword === password) {
    passwordMatch = true;
  } else if (storedHash) {
    passwordMatch = await bcrypt.compare(password, storedHash);
  }

  if (!passwordMatch) {
    recordLoginFailure(ip);
    await writeAuditLog({
      event: 'LOGIN_FAILED',
      userId: userRecord._id?.toString(),
      email,
      role: userRecord.role,
      attemptedDomain: DOMAIN,
      attemptedPath: '/api/auth/login',
      req,
      metadata: { reason: 'invalid_password' },
    });
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
  }

  const role = (userRecord.role || 'student') as UserRole;

  // ── Domain-role check ─────────────────────────────────────────────────────
  // CRITICAL: instructor MUST NEVER access supportdomain
  if (role === 'instructor') {
    await writeAuditLog({
      event: 'INSTRUCTOR_BLOCKED_SUPPORT',
      userId: userRecord._id?.toString(),
      email,
      role,
      attemptedDomain: DOMAIN,
      attemptedPath: '/api/auth/login',
      req,
      metadata: { reason: 'instructor_blocked_from_supportdomain', correctDomain: 'instructordomain' },
    });
    return NextResponse.json(
      {
        error: 'Access denied.',
        detail: 'Instructor accounts are not permitted to access the Support Portal. Please use the Instructor Portal at port 5000.',
        redirect: process.env.NEXT_PUBLIC_INSTRUCTOR_URL || 'http://localhost:5000/login',
      },
      { status: 403 }
    );
  }

  if (role === 'student') {
    await writeAuditLog({
      event: 'STUDENT_BLOCKED',
      userId: userRecord._id?.toString(),
      email,
      role,
      attemptedDomain: DOMAIN,
      attemptedPath: '/api/auth/login',
      req,
    });
    return NextResponse.json(
      {
        error: 'Access denied.',
        detail: 'Student accounts cannot access the Admin Portal. Please visit the main platform.',
        redirect: process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'http://localhost:3000',
      },
      { status: 403 }
    );
  }

  if (!isRoleAllowedInDomain(role, DOMAIN)) {
    await writeAuditLog({
      event: 'INVALID_ROLE',
      userId: userRecord._id?.toString(),
      email,
      role,
      attemptedDomain: DOMAIN,
      attemptedPath: '/api/auth/login',
      req,
    });
    return NextResponse.json({ error: `Role '${role}' is not permitted in the Support Domain.` }, { status: 403 });
  }

  // ── Success ──
  resetLoginRateLimit(ip);
  const userId = userRecord._id?.toString() || userRecord.id || crypto.randomUUID();
  const tokens = await issueTokenPair({ userId, email, role, domain: DOMAIN });

  await writeAuditLog({
    event: 'LOGIN_SUCCESS',
    userId,
    email,
    role,
    attemptedDomain: DOMAIN,
    attemptedPath: '/api/auth/login',
    req,
  });

  return buildSuccessResponse(tokens, { id: userId, email, role });
}

function buildSuccessResponse(
  tokens: Awaited<ReturnType<typeof issueTokenPair>>,
  user: { id: string; email: string; role: string }
) {
  const res = NextResponse.json({
    success: true,
    user: { id: user.id, email: user.email, role: user.role },
    accessExpiresAt: tokens.accessExpiresAt,
  });

  res.cookies.set(COOKIE_ACCESS_TOKEN, tokens.accessToken, getAccessCookieOptions());
  res.cookies.set(COOKIE_REFRESH_TOKEN, tokens.refreshToken, getRefreshCookieOptions());

  return res;
}
