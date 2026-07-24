import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import webpush from 'web-push';

export async function POST(req: NextRequest) {
  try {
    const { title, body, url: targetUrl, studentId, studentEmail } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@Xmarty Creator.com';

    if (!publicVapidKey || !privateVapidKey) {
      return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 });
    }

    webpush.setVapidDetails(vapidSubject, publicVapidKey, privateVapidKey);

    const db = await getDb();
    
    const filter: Record<string, any> = {};
    if (studentId) {
      filter.user_id = studentId;
    } else if (studentEmail) {
      filter.user_email = studentEmail;
    }
    
    const subscriptions = await db.collection('push_subscriptions').find(filter).toArray();

    if (subscriptions.length === 0) {
      return NextResponse.json({ success: true, message: 'No subscribers' });
    }

    const payload = JSON.stringify({
      title,
      body,
      url: targetUrl || '/'
    });

    const results = await Promise.all(
      subscriptions.map(async (subDoc) => {
        try {
          await webpush.sendNotification(subDoc.subscription, payload);
          return { endpoint: subDoc.subscription.endpoint, status: 'success' };
        } catch (err: any) {
          // Clean up expired subscriptions
          if (err.statusCode === 410 || err.statusCode === 404) {
            await db.collection('push_subscriptions').deleteOne({ _id: subDoc._id });
            return { endpoint: subDoc.subscription.endpoint, status: 'expired_removed' };
          }
          console.error('[PUSH ERROR for subscription]', subDoc.subscription.endpoint, err);
          return { endpoint: subDoc.subscription.endpoint, status: 'failed', error: String(err) };
        }
      })
    );

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error('[SEND NOTIFICATION ERROR]', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
