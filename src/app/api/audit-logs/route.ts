import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role');
    // Allow super_admin, admin, and editor roles access to view telemetry logs
    if (!role || (role !== 'super_admin' && role !== 'admin' && role !== 'editor')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const severity = searchParams.get('severity') || 'ALL';
    const domain = searchParams.get('domain') || 'ALL';

    const db = await getDb();
    const filter: any = {};

    if (search) {
      filter.$or = [
        { actor_name: { $regex: search, $options: 'i' } },
        { actor_role: { $regex: search, $options: 'i' } },
        { action_type: { $regex: search, $options: 'i' } },
        { target_entity: { $regex: search, $options: 'i' } },
        { target_id: { $regex: search, $options: 'i' } }
      ];
    }

    if (severity !== 'ALL') {
      filter.severity = severity;
    }

    if (domain !== 'ALL') {
      filter.domain = domain;
    }

    const logs = await db.collection('audit_logs')
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();

    return new NextResponse(
      JSON.stringify({
        success: true,
        logs: logs.map((l: any) => ({
          ...l,
          id: l._id.toString(),
          _id: undefined
        }))
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    );
  } catch (error: any) {
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    );
  }
}
