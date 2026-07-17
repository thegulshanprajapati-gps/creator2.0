import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    const communities = await db.collection('communities')
      .find({})
      .sort({ created_at: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      communities: communities.map((c: any) => ({
        ...c,
        id: c._id.toString(),
        _id: undefined
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const db = await getDb();
    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: "Community ID and status are required" }, { status: 400 });
    }

    if (status !== 'approved' && status !== 'rejected') {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const result = await db.collection('communities').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
