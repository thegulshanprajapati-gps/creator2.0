import { getDb } from './mongodb';

export type Page = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  content: any;
  status: 'published' | 'draft' | 'archived';
  seo_title?: string;
  seo_description?: string;
  featured_image?: string | null;
  meta?: any;
  created_at?: string;
  updated_at?: string;
};

export async function getPages(publishedOnly = true): Promise<Page[]> {
  const db = await getDb();
  const filter: Record<string, any> = {};
  if (publishedOnly) filter.status = 'published';
  const data = await db.collection('pages').find(filter).toArray();
  return data.map((doc) => {
    const { _id, ...rest } = doc;
    return {
      ...rest,
      id: _id.toString(),
    } as unknown as Page;
  });
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  const db = await getDb();
  const doc = await db.collection('pages').findOne({ slug });
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return {
    ...rest,
    id: _id.toString(),
  } as unknown as Page;
}

export async function upsertPage(payload: Partial<Page>): Promise<Page> {
  const db = await getDb();
  const slug = payload.slug;
  if (!slug) throw new Error('Page slug is required for upsert');
  
  const { id, ...normalized } = payload;

  await db.collection('pages').updateOne(
    { slug },
    { $set: { ...normalized, updated_at: new Date() } },
    { upsert: true }
  );

  const updated = await getPageBySlug(slug);
  if (!updated) throw new Error('Failed to fetch page after upsert');
  return updated;
}

export async function ensureDefaultPages(): Promise<void> {
  const home = await getPageBySlug('home');
  if (!home) {
    await upsertPage({
      title: 'Home',
      slug: 'home',
      description: 'Landing page',
      content: { blocks: [{ type: 'hero', data: { heading: 'Welcome' } }] },
      status: 'published',
    });
  }
}
