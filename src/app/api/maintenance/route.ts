import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const MANAGEABLE_PAGES = [
  { route: '/', label: 'Home' },
  { route: '/blog', label: 'Blog' },
  { route: '/courses', label: 'Courses' },
  { route: '/community', label: 'Community' },
  { route: '/community/hub', label: 'Community Hub' },
  { route: '/about', label: 'About' },
  { route: '/faq', label: 'FAQ' },
  { route: '/updates', label: 'Updates' },
  { route: '/contact', label: 'Contact' },
  { route: '/test', label: 'Tests' },
  { route: '/megaquizzes', label: 'MegaQuizzes' },
  { route: '/search', label: 'Search' },
  { route: '/verify-certificate', label: 'Verify Certificate' },
];

// GET — fetch all maintenance settings
export async function GET() {
  try {
    const db = await getDb();
    const collection = db.collection('maintenance_settings');
    const docs = await collection.find({}).toArray();

    const settingsMap: Record<string, any> = {};
    for (const page of MANAGEABLE_PAGES) {
      settingsMap[page.route] = {
        route: page.route,
        label: page.label,
        enabled: false,
        updatedAt: null,
      };
    }
    for (const doc of docs) {
      if (settingsMap[doc.route]) {
        settingsMap[doc.route].enabled = doc.enabled;
        settingsMap[doc.route].updatedAt = doc.updatedAt;
      }
    }

    return NextResponse.json(Object.values(settingsMap));
  } catch (error: any) {
    console.error('Failed to fetch maintenance settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — toggle maintenance for a route
export async function POST(request: Request) {
  try {
    const { route, enabled } = await request.json();
    if (!route) return NextResponse.json({ error: 'Route is required' }, { status: 400 });

    const db = await getDb();
    const collection = db.collection('maintenance_settings');

    await collection.updateOne(
      { route },
      { $set: { route, enabled: !!enabled, updatedAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, route, enabled: !!enabled });
  } catch (error: any) {
    console.error('Failed to update maintenance settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
