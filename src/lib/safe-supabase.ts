import { supabase } from './supabase';

export async function safeQuery(operation: () => Promise<any>, meta: { table?: string; action?: string } = {}) {
  try {
    const res = await operation();
    // supabase responses often contain { data, error }
    if (res && res.error) {
      const payload = buildErrorPayload(res.error, meta);
      // fire-and-forget logging to internal API
      try {
        await fetch('/api/db/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (e) {
        // ignore
      }
      return res;
    }
    return res;
  } catch (err: any) {
    const payload = buildErrorPayload(err, meta);
    try {
      await fetch('/api/db/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      // ignore
    }
    throw err;
  }
}

function buildErrorPayload(err: any, meta: { table?: string; action?: string } = {}) {
  const message = err?.message || String(err);
  let error_type = 'unknown';

  if (/row-level security/i.test(message) || /violates row-level security policy/i.test(message)) error_type = 'rls_violation';
  else if (/relation .* does not exist/i.test(message) || /missing table/i.test(message)) error_type = 'missing_table';
  else if (/column .* does not exist/i.test(message) || /missing column/i.test(message)) error_type = 'missing_column';
  else if (/duplicate key value violates unique constraint/i.test(message)) error_type = 'duplicate_key';
  else if (/timeout|timeout exceeded/i.test(message)) error_type = 'timeout';

  return {
    error_type,
    table_name: meta.table || null,
    action_taken: null,
    message,
    severity: 'medium',
    created_at: new Date().toISOString(),
    raw: err,
  };
}

export async function logDbError(payload: any) {
  try {
    await fetch('/api/db/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    // ignore logging failures
  }
}

export default safeQuery;
