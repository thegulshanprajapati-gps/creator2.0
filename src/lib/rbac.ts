/**
 * RBAC — Role-Based Access Control Constants & Permission Matrix
 * Single source of truth for all role/domain/permission decisions.
 * NEVER trust client-supplied role values. Always validate from DB + cookie.
 */

// ─── Role Hierarchy ───────────────────────────────────────────────────────────
export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'editor'
  | 'instructor'
  | 'student'
  | 'guest';

export type Domain = 'supportdomain' | 'instructordomain' | 'maindomain';

// Higher number = more privilege
export const ROLE_WEIGHT: Record<UserRole, number> = {
  super_admin: 100,
  admin: 80,
  editor: 60,
  instructor: 40,
  student: 20,
  guest: 0,
};

// ─── Domain Access Rules ──────────────────────────────────────────────────────
// Which roles may access which domain at ALL
export const DOMAIN_ALLOWED_ROLES: Record<Domain, UserRole[]> = {
  supportdomain: ['super_admin', 'admin', 'editor'],
  instructordomain: ['super_admin', 'admin', 'instructor'],
  maindomain: ['student', 'guest', 'super_admin', 'admin', 'editor', 'instructor'],
};

/** Check if a role is allowed into a domain */
export function isRoleAllowedInDomain(role: UserRole, domain: Domain): boolean {
  return DOMAIN_ALLOWED_ROLES[domain].includes(role);
}

// ─── Editor Permission Matrix ─────────────────────────────────────────────────
// Editors have limited, content-focused permissions.
// Backend enforces this — frontend must NEVER be trusted.
export const EDITOR_PERMISSIONS = {
  // Allowed
  contentModeration: true,
  supportTickets: true,
  limitedAnalytics: true,
  blogManagement: true,
  pagesCMS: true,
  assetLibrary: true,
  viewUsers: true,

  // FORBIDDEN
  deleteUsers: false,
  roleManagement: false,
  platformSettings: false,
  instructorOwnershipOverride: false,
  securityLogModification: false,
  superAdminActions: false,
  adminActions: false,
  staffManagement: false,
  securityCenterWrite: false,
} as const;

export type EditorPermission = keyof typeof EDITOR_PERMISSIONS;

/** Returns true if the editor is permitted to perform the action */
export function editorCanDo(action: EditorPermission): boolean {
  return EDITOR_PERMISSIONS[action] === true;
}

// ─── Full Permission Matrix ───────────────────────────────────────────────────
type PermissionSet = {
  deleteUsers: boolean;
  roleManagement: boolean;
  platformSettings: boolean;
  securityLogs: boolean;
  staffManagement: boolean;
  viewAnalytics: boolean;
  fullAnalytics: boolean;
  courseManagement: boolean;
  contentModeration: boolean;
  blogManagement: boolean;
  pagesCMS: boolean;
  assetLibrary: boolean;
  userManagement: boolean;
  instructorManagement: boolean;
};

export const ROLE_PERMISSIONS: Record<UserRole, PermissionSet> = {
  super_admin: {
    deleteUsers: true,
    roleManagement: true,
    platformSettings: true,
    securityLogs: true,
    staffManagement: true,
    viewAnalytics: true,
    fullAnalytics: true,
    courseManagement: true,
    contentModeration: true,
    blogManagement: true,
    pagesCMS: true,
    assetLibrary: true,
    userManagement: true,
    instructorManagement: true,
  },
  admin: {
    deleteUsers: true,
    roleManagement: false,
    platformSettings: true,
    securityLogs: true,
    staffManagement: false,
    viewAnalytics: true,
    fullAnalytics: true,
    courseManagement: true,
    contentModeration: true,
    blogManagement: true,
    pagesCMS: true,
    assetLibrary: true,
    userManagement: true,
    instructorManagement: true,
  },
  editor: {
    deleteUsers: false,
    roleManagement: false,
    platformSettings: false,
    securityLogs: false,
    staffManagement: false,
    viewAnalytics: true,
    fullAnalytics: false,
    courseManagement: false,
    contentModeration: true,
    blogManagement: true,
    pagesCMS: true,
    assetLibrary: true,
    userManagement: false,
    instructorManagement: false,
  },
  instructor: {
    deleteUsers: false,
    roleManagement: false,
    platformSettings: false,
    securityLogs: false,
    staffManagement: false,
    viewAnalytics: false,
    fullAnalytics: false,
    courseManagement: true,  // own courses only
    contentModeration: false,
    blogManagement: false,
    pagesCMS: false,
    assetLibrary: false,
    userManagement: false,
    instructorManagement: false,
  },
  student: {
    deleteUsers: false,
    roleManagement: false,
    platformSettings: false,
    securityLogs: false,
    staffManagement: false,
    viewAnalytics: false,
    fullAnalytics: false,
    courseManagement: false,
    contentModeration: false,
    blogManagement: false,
    pagesCMS: false,
    assetLibrary: false,
    userManagement: false,
    instructorManagement: false,
  },
  guest: {
    deleteUsers: false,
    roleManagement: false,
    platformSettings: false,
    securityLogs: false,
    staffManagement: false,
    viewAnalytics: false,
    fullAnalytics: false,
    courseManagement: false,
    contentModeration: false,
    blogManagement: false,
    pagesCMS: false,
    assetLibrary: false,
    userManagement: false,
    instructorManagement: false,
  },
};

export function roleHasPermission(
  role: UserRole,
  permission: keyof PermissionSet
): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}

// ─── Protected Collections (gateway-level enforcement) ───────────────────────
// Which MongoDB collections require elevated roles for writes
export const PROTECTED_WRITE_COLLECTIONS: Record<string, UserRole[]> = {
  users: ['super_admin', 'admin'],
  profiles: ['super_admin', 'admin'],
  site_settings: ['super_admin', 'admin'],
  security_logs: ['super_admin', 'admin'],
  security_audit_logs: ['super_admin'],  // read-only for admin via security UI
  staff: ['super_admin'],
};

/** Which roles can write to a given collection */
export function canWriteToCollection(role: UserRole, collection: string): boolean {
  const required = PROTECTED_WRITE_COLLECTIONS[collection];
  if (!required) return true; // unprotected collection — RBAC allows writes
  return required.includes(role);
}

// ─── Audit Event Types ────────────────────────────────────────────────────────
export type AuditEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'DOMAIN_ACCESS_DENIED'
  | 'INVALID_ROLE'
  | 'UNAUTHENTICATED'
  | 'INSTRUCTOR_BLOCKED_SUPPORT'
  | 'STUDENT_BLOCKED'
  | 'GATEWAY_UNAUTHORIZED'
  | 'GATEWAY_FORBIDDEN_COLLECTION'
  | 'CSRF_VIOLATION'
  | 'RATE_LIMIT_EXCEEDED'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_TAMPERED'
  | 'IDOR_ATTEMPT'
  | 'PRIVILEGE_ESCALATION_ATTEMPT'
  | 'LOGOUT';

export type AuditSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuditEvent {
  event: AuditEventType;
  userId: string | null;
  email: string | null;
  role: string | null;
  attemptedDomain: Domain;
  attemptedPath: string;
  ip: string;
  userAgent: string;
  severity: AuditSeverity;
  timestamp: Date;
  auditId: string;
  metadata?: Record<string, unknown>;
}

export const AUDIT_SEVERITY: Record<AuditEventType, AuditSeverity> = {
  LOGIN_SUCCESS: 'INFO',
  LOGIN_FAILED: 'MEDIUM',
  DOMAIN_ACCESS_DENIED: 'HIGH',
  INVALID_ROLE: 'HIGH',
  UNAUTHENTICATED: 'MEDIUM',
  INSTRUCTOR_BLOCKED_SUPPORT: 'CRITICAL',
  STUDENT_BLOCKED: 'HIGH',
  GATEWAY_UNAUTHORIZED: 'HIGH',
  GATEWAY_FORBIDDEN_COLLECTION: 'CRITICAL',
  CSRF_VIOLATION: 'CRITICAL',
  RATE_LIMIT_EXCEEDED: 'HIGH',
  TOKEN_EXPIRED: 'LOW',
  TOKEN_TAMPERED: 'CRITICAL',
  IDOR_ATTEMPT: 'CRITICAL',
  PRIVILEGE_ESCALATION_ATTEMPT: 'CRITICAL',
  LOGOUT: 'INFO',
};

// ─── 2FA Schema (future-ready, not yet enforced) ──────────────────────────────
export interface TwoFactorSchema {
  two_factor_enabled: boolean;
  totp_secret: string | null;         // TOTP secret (encrypted at rest)
  backup_codes: string[] | null;      // hashed backup codes
  two_factor_verified_at: Date | null;
}

// ─── Cookie Names ─────────────────────────────────────────────────────────────
export const COOKIE_ACCESS_TOKEN = 'xmarty_access_token';
export const COOKIE_REFRESH_TOKEN = 'xmarty_refresh_token';
export const COOKIE_CSRF = 'xmarty_csrf';

// ─── Token TTLs ───────────────────────────────────────────────────────────────
export const ACCESS_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;       // 2 hours
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Internal secret header (for SSR → gateway calls) ────────────────────────
export const INTERNAL_SECRET_HEADER = 'X-Internal-Secret';
