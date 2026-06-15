"use client";

import { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/db";
import { isUUID } from "@/lib/validators";

export type CmsPage = {
  id?: string;
  slug?: string;
  title?: string;
  description?: string;
  content?: any;
  status?: string;
};

export function useCmsPage(identifier?: string) {
  const [page, setPage] = useState<CmsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!identifier) return;
    setLoading(true);
    setError(null);
    try {
      const identifierIsUUID = isUUID(String(identifier));
      const query = db.from('pages').select('*');
      const res = identifierIsUUID
        ? await query.eq('id', identifier).maybeSingle()
        : await query.eq('slug', identifier).maybeSingle();
      const data = res.data as CmsPage | null;
      if (!data) {
        // create a minimal page if missing
        const seed: CmsPage = {
          slug: identifierIsUUID ? undefined : identifier,
          id: identifierIsUUID ? identifier : undefined,
          title: String(identifier),
          description: '',
          content: { blocks: [] },
          status: 'draft',
        };
        const up = await db.from('pages').upsert(seed, { onConflict: identifierIsUUID ? 'id' : 'slug' }).select().maybeSingle();
        setPage((up.data as CmsPage) || seed);
      } else {
        setPage(data);
      }
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [identifier]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async (payload: Partial<CmsPage>) => {
    if (!identifier) throw new Error('Missing identifier');
    setLoading(true);
    setError(null);
    try {
      const identifierIsUUID = isUUID(String(identifier));
      const record: any = { ...payload };
      if (!identifierIsUUID) record.slug = identifier;
      else record.id = identifier;

      const { data, error } = await db.from('pages').upsert(record, { onConflict: identifierIsUUID ? 'id' : 'slug' }).select().maybeSingle();
      if (error) throw error;
      setPage(data || record);
      return data || record;
    } catch (err: any) {
      setError(err?.message || String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [identifier]);

  return { page, loading, error, reload: load, save };
}
