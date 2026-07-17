import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const db = await getDb();
    
    const res = await db.collection('subscription_plans').insertOne({
      ...payload,
      createdAt: new Date()
    });

    return NextResponse.json({ success: true, id: res.insertedId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, isActive } = await req.json();
    const db = await getDb();
    
    await db.collection('subscription_plans').updateOne(
      { _id: new ObjectId(id) },
      { $set: { isActive } }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
