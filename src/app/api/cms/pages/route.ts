import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isUUID } from '@/lib/validators';
import safeQuery from '@/lib/safe-db';

const ADMIN_SECRET = process.env.ADMIN_API_SECRET;

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');
    const admin = request.headers.get('x-admin-secret') === ADMIN_SECRET;

    if (slug) {
      const identifierIsUUID = isUUID(slug);
      const query = () => db.from('pages').select('*');

      // Try id first when UUID, then fall back to slug
      if (identifierIsUUID) {
        const resById = await safeQuery(async () => (await query()).eq('id', slug).maybeSingle(), { table: 'pages', action: 'select' });
        const page = resById?.data;
        if (page) {
          if (page?.status !== 'published' && !admin) return NextResponse.json({ error: 'Not found' }, { status: 404 });
          return NextResponse.json({ data: page });
        }

        // fallback to slug
        const resBySlug = await safeQuery(async () => (await query()).eq('slug', slug).maybeSingle(), { table: 'pages', action: 'select' });
        const page2 = resBySlug?.data;
        if (!page2) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (page2?.status !== 'published' && !admin) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ data: page2 });
      }

      const res = await safeQuery(async () => (await query()).eq('slug', slug).maybeSingle(), { table: 'pages', action: 'select' });
      const page = res?.data;

      if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      if (page?.status !== 'published' && !admin) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ data: page });
    }

    // If admin secret provided and valid, return all pages; otherwise only published
    const query = db.from('pages').select('*');
    if (!admin) query.eq('status', 'published');
    const res = await query;
    const pages = res.data || [];

    return NextResponse.json({ data: pages });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const isDev = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENVIRONMENT === 'development';
  const admin = request.headers.get('x-admin-secret') === ADMIN_SECRET || isDev;
  if (!admin) return unauthorized();

  try {
    const body = await request.json();
    if (!body || (!body.slug && !body.id)) return NextResponse.json({ error: 'Missing payload or slug/id' }, { status: 400 });

    const identifierIsUUID = body.id && isUUID(body.id);
    const record: any = { ...body };
    if (!identifierIsUUID && body.slug) record.slug = body.slug;

    const result = await safeQuery(async () => await db.from('pages').upsert(record, { onConflict: identifierIsUUID ? 'id' : 'slug' }).select().maybeSingle(), { table: 'pages', action: 'upsert' });
    if (result.error) throw result.error;

    return NextResponse.json({ data: result.data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return POST(request);
}

export async function DELETE(request: Request) {
  const isDev = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENVIRONMENT === 'development';
  const admin = request.headers.get('x-admin-secret') === ADMIN_SECRET || isDev;
  if (!admin) return unauthorized();

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const slug = url.searchParams.get('slug');

    if (!id && !slug) {
      return NextResponse.json({ error: 'Missing id or slug parameter' }, { status: 400 });
    }

    const query = db.from('pages').delete();
    if (id) {
      query.eq('id', id);
    } else if (slug) {
      query.eq('slug', slug);
    }

    const result = await safeQuery(async () => await query, { table: 'pages', action: 'delete' });
    if (result.error) throw result.error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const isDev = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENVIRONMENT === 'development';
  const admin = request.headers.get('x-admin-secret') === ADMIN_SECRET || isDev;
  if (!admin) return unauthorized();
  try {
    const home = await db.from('pages').select('*').eq('slug', 'home').maybeSingle();
    if (!home.data) {
      await db.from('pages').insert({
        title: 'Home',
        slug: 'home',
        description: 'Landing page',
        content: { blocks: [] },
        status: 'published',
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
