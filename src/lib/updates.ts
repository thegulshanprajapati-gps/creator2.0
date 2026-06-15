import { getDb } from './mongodb';

export type Update = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: any;
  tags?: string[];
  status?: string;
  created_at?: string;
  updated_at?: string;
};

export async function getUpdates(publishedOnly = true): Promise<Update[]> {
  const db = await getDb();
  const filter: Record<string, any> = {};
  if (publishedOnly) filter.status = 'published';
  const data = await db.collection('updates').find(filter).sort({ created_at: -1 }).toArray();
  return data.map((doc) => {
    const { _id, ...rest } = doc;
    return {
      ...rest,
      id: _id.toString(),
    } as unknown as Update;
  });
}

export async function getUpdateBySlug(slug: string): Promise<Update | null> {
  const db = await getDb();
  const doc = await db.collection('updates').findOne({ slug });
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return {
    ...rest,
    id: _id.toString(),
  } as unknown as Update;
}

export async function upsertUpdate(payload: Partial<Update>): Promise<Update> {
  const db = await getDb();
  const slug = payload.slug;
  if (!slug) throw new Error('Update slug is required for upsert');
  
  const { id, ...normalized } = payload;

  await db.collection('updates').updateOne(
    { slug },
    { $set: { ...normalized, updated_at: new Date() } },
    { upsert: true }
  );

  const updated = await getUpdateBySlug(slug);
  if (!updated) throw new Error('Failed to fetch update after upsert');
  return updated;
}
