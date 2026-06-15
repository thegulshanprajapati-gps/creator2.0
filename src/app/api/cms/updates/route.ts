import { NextResponse } from 'next/server';
import { getUpdates, getUpdateBySlug, upsertUpdate } from '@/lib/updates';

const ADMIN_SECRET = process.env.ADMIN_API_SECRET;

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');
    if (slug) {
      const u = await getUpdateBySlug(slug);
      if (!u) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ data: u });
    }
    const updates = await getUpdates(true);
    return NextResponse.json({ data: updates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = request.headers.get('x-admin-secret') === ADMIN_SECRET;
  if (!admin) return unauthorized();
  try {
    const body = await request.json();
    if (!body || !body.slug) return NextResponse.json({ error: 'Missing payload or slug' }, { status: 400 });
    const res = await upsertUpdate(body);
    return NextResponse.json({ data: res });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
