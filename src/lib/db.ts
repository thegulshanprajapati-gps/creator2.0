// Mock Supabase Client that routes all CRUD operations to MongoDB Atlas API Gateway in supportdomain
// SECURITY: All mutations now require authentication cookie + CSRF token.
// The gateway validates these server-side — localStorage is for UI state only.

const gatewayUrl = '/api/mongodb-gateway';

// ─── CSRF token cache (fetched once per session) ──────────────────────────────
let cachedCsrfToken: string | null = null;

async function getCsrfToken(): Promise<string> {
  if (cachedCsrfToken) return cachedCsrfToken;
  try {
    const res = await fetch('/api/auth/csrf', { method: 'GET', credentials: 'include' });
    const data = await res.json();
    cachedCsrfToken = data.csrfToken || '';
    return cachedCsrfToken!;
  } catch {
    return '';
  }
}

// ─── Normalize MongoDB documents (convert _id to id) ─────────────────────────
function normalizeMongoDoc(doc: any): any {
  if (!doc || typeof doc !== 'object') return doc;
  if (Array.isArray(doc)) {
    return doc.map(normalizeMongoDoc);
  }
  const newDoc = { ...doc };
  if (newDoc._id) {
    newDoc.id = newDoc._id.toString();
  }
  for (const key of Object.keys(newDoc)) {
    if (newDoc[key] && typeof newDoc[key] === 'object') {
      newDoc[key] = normalizeMongoDoc(newDoc[key]);
    }
  }
  return newDoc;
}

// ─── Query Builder ────────────────────────────────────────────────────────────
class MongoQueryBuilder {
  private collection: string;
  private filter: Record<string, any> = {};
  private options: {
    sort?: Record<string, number>;
    limit?: number;
    skip?: number;
  } = {};
  private pendingAction: string = 'find';
  private pendingData: any = null;

  constructor(collection: string) {
    this.collection = collection;
  }

  select(_fields?: string) {
    return this;
  }

  eq(field: string, value: any) {
    const finalField = field === 'id' ? '_id' : field;
    this.filter[finalField] = value;
    return this;
  }

  in(field: string, values: any[]) {
    const finalField = field === 'id' ? '_id' : field;
    this.filter[finalField] = { $in: values };
    return this;
  }

  match(filters: Record<string, any>) {
    Object.assign(this.filter, filters);
    return this;
  }

  order(field: string, opts?: { ascending?: boolean }) {
    const asc = opts?.ascending !== false ? 1 : -1;
    this.options.sort = { [field]: asc };
    return this;
  }

  limit(num: number) {
    this.options.limit = num;
    return this;
  }

  insert(data: any | any[]) {
    this.pendingAction = 'insertOne';
    this.pendingData = Array.isArray(data) ? data[0] : data;
    return this;
  }

  update(data: any) {
    this.pendingAction = 'updateOne';
    this.pendingData = data;
    return this;
  }

  upsert(data: any | any[], _opts?: any) {
    this.pendingAction = 'upsert';
    this.pendingData = Array.isArray(data) ? data[0] : data;
    return this;
  }

  delete() {
    this.pendingAction = 'deleteMany';
    return this;
  }

  async execute() {
    let action = this.pendingAction;
    let data = this.pendingData;
    let filter = { ...this.filter };

    if (action === 'upsert' && data) {
      if (data.slug) filter.slug = data.slug;
      if (data.key) filter.key = data.key;
      if (data.page_slug && data.section_key && data.content_key) {
        filter.page_slug = data.page_slug;
        filter.section_key = data.section_key;
        filter.content_key = data.content_key;
      }
      if (data._id) filter._id = data._id;
      if (data.id) filter._id = data.id;
    }

    // CSRF token for writes
    const isWrite = ['insertOne', 'updateOne', 'upsert', 'deleteMany', 'deleteOne'].includes(action);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (isWrite) {
      const csrf = await getCsrfToken();
      if (csrf) headers['X-CSRF-Token'] = csrf;
    }

    const doRequest = async (hdrs: Record<string, string>) => {
      return fetch(gatewayUrl, {
        method: 'POST',
        headers: hdrs,
        credentials: 'include',
        body: JSON.stringify({
          action,
          collection: this.collection,
          filter,
          data,
          options: this.options,
        }),
      });
    };

    try {
      let res = await doRequest(headers);

      // ── Silent token refresh on 401 ───────────────────────────────────────
      // If access token expired, try refreshing once before giving up.
      if (res.status === 401) {
        try {
          const refreshRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
          });

          if (refreshRes.ok) {
            // Refresh succeeded — invalidate CSRF cache and retry original request
            cachedCsrfToken = null;
            const newHeaders = { ...headers };
            if (isWrite) {
              const newCsrf = await getCsrfToken();
              if (newCsrf) newHeaders['X-CSRF-Token'] = newCsrf;
            }
            res = await doRequest(newHeaders);
          }
        } catch {
          // Refresh failed silently — fall through to 401 handling below
        }
      }

      const json = await res.json();

      // If still 401 after refresh attempt → session truly expired
      if (res.status === 401) {
        if (typeof window !== 'undefined') {
          // Clear stale localStorage session so login page shows the form
          localStorage.removeItem('xmarty_session');
          window.location.href = '/login?reason=session_expired';
        }
        return { data: null, error: { message: 'Session expired. Please log in again.' } };
      }

      if (res.status === 403) {
        return { data: null, error: { message: json.error || 'Permission denied.' } };
      }

      if (json.error) {
        return { data: null, error: { message: json.error } };
      }

      let normalized = normalizeMongoDoc(json.data);
      if ((action === 'upsert' || action === 'insertOne') && data) {
        normalized = { ...data, id: normalized?._id?.toString() || normalized?.upsertedId || data.id };
      }
      return { data: normalized, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err?.message || String(err) } };
    }
  }

  async single() {
    if (this.pendingAction === 'find') {
      this.pendingAction = 'findOne';
    }
    return this.execute();
  }

  async maybeSingle() {
    if (this.pendingAction === 'find') {
      this.pendingAction = 'findOne';
    }
    return this.execute();
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch(onrejected?: (reason: any) => any) {
    return this.execute().catch(onrejected);
  }
}

// ─── Auth Client ──────────────────────────────────────────────────────────────
// SECURITY NOTE: signInWithPassword now calls the server-side /api/auth/login
// which validates against DB AND sets httpOnly cookies.
// localStorage is ONLY used for UI state (displaying user info in sidebar etc.)
// It is NOT trusted by the backend.

class MockAuthClient {
  private listeners: Array<(event: string, session: any) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', () => {
        const session = this.getStoredSession();
        this.notify('SIGNED_IN', session);
      });
    }
  }

  private getStoredSession() {
    if (typeof window === 'undefined') return null;
    const sessionStr = localStorage.getItem('xmarty_session');
    return sessionStr ? JSON.parse(sessionStr) : null;
  }

  async getSession() {
    const session = this.getStoredSession();
    return { data: { session }, error: null };
  }

  async getUser() {
    const session = this.getStoredSession();
    return { data: { user: session?.user || null }, error: null };
  }

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    try {
      // SECURITY: Call server-side login API which:
      // 1. Validates against DB
      // 2. Checks domain-appropriate role
      // 3. Sets httpOnly access + refresh cookies
      // 4. Writes audit log
      const csrf = await getCsrfToken();
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!res.ok) {
        return { data: null, error: { message: json.detail || json.error || 'Login failed.' } };
      }

      const user = json.user;
      // Store in localStorage for UI state ONLY — not for security decisions
      const session = { user, access_token: 'httponly-managed' };
      if (typeof window !== 'undefined') {
        localStorage.setItem('xmarty_session', JSON.stringify(session));
      }
      // Invalidate CSRF cache so next request gets fresh token
      cachedCsrfToken = null;
      this.notify('SIGNED_IN', session);
      return { data: { user, session }, error: null };
    } catch (e: any) {
      return { data: null, error: { message: e?.message || 'Connection error.' } };
    }
  }

  async signUp({ email, password, options }: any) {
    // Registration via gateway (unchanged from original)
    const userId = 'user_' + Math.random().toString(36).substr(2, 9);
    const user = { id: userId, email, ...options?.data };
    const session = { user, access_token: 'httponly-managed' };

    if (typeof window !== 'undefined') {
      localStorage.setItem('xmarty_session', JSON.stringify(session));
    }

    await new MongoQueryBuilder('users').upsert({
      id: userId, email,
      full_name: options?.data?.full_name || '',
      role: 'student',
      enrolled_courses: [],
      // 2FA schema fields (future-ready)
      two_factor_enabled: false,
      totp_secret: null,
      backup_codes: null,
      two_factor_verified_at: null,
    }).execute();

    this.notify('SIGNED_IN', session);
    return { data: { user, session }, error: null };
  }

  async signOut() {
    // Call server-side logout to clear httpOnly cookies
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}

    if (typeof window !== 'undefined') {
      localStorage.removeItem('xmarty_session');
    }
    cachedCsrfToken = null;
    this.notify('SIGNED_OUT', null);
    return { error: null };
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    this.listeners.push(callback);
    const session = this.getStoredSession();
    callback('INITIAL_SESSION', session);

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners = this.listeners.filter((l) => l !== callback);
          },
        },
      },
    };
  }

  private notify(event: string, session: any) {
    this.listeners.forEach((l) => l(event, session));
  }
}

export const db = {
  from(collection: string) {
    const mappedCollection = collection === 'profiles' ? 'users' : collection;
    return new MongoQueryBuilder(mappedCollection);
  },
  auth: new MockAuthClient(),
};
