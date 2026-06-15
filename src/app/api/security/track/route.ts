import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth-token';
import { parseCookies } from '@/lib/csrf';
import { COOKIE_ACCESS_TOKEN } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const cookies = parseCookies(cookieHeader);
    const accessToken = cookies[COOKIE_ACCESS_TOKEN];
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tokenResult = verifyToken(accessToken, 'access');
    if (!tokenResult.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = tokenResult.payload.role;
    if (userRole !== 'super_admin' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: insufficient permissions' }, { status: 403 });
    }

    const db = await getDb();
    const logs = await db.collection('security_logs')
      .find({})
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({
      success: true,
      logs: logs.map((l: any) => ({
        ...l,
        id: l._id.toString(),
        _id: undefined
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const db = await getDb();
    const payload = await req.json();
    
    // Fallbacks for local testing and header proxy resolvers
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    
    const logItem = {
      ip,
      route: payload.route || '/',
      renderTime: payload.renderTime || 0, // In seconds or ms
      userAgent: req.headers.get('user-agent') || 'Unknown',
      timestamp: new Date()
    };

    // Upsert or insert into log to keep running duration of user session active
    // We can match IP + Route within last 5 minutes to accumulate session time.
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existing = await db.collection('security_logs').findOne({
      ip,
      route: logItem.route,
      timestamp: { $gte: fiveMinutesAgo }
    });

    if (existing) {
      await db.collection('security_logs').updateOne(
        { _id: existing._id },
        { 
          $set: { timestamp: new Date() },
          $inc: { renderTime: logItem.renderTime }
        }
      );
    } else {
      await db.collection('security_logs').insertOne(logItem);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
