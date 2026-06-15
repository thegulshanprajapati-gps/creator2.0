import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    const comments = await db.collection('blog_comments')
      .find({})
      .sort({ date: -1 })
      .toArray();

    const formatted = comments.map((c: any) => ({
      ...c,
      id: c._id.toString(),
      _id: undefined
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Failed to fetch comments for admin:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, approved } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    const db = await getDb();
    let query: any = {};
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { id };
    }

    await db.collection('blog_comments').updateOne(
      query,
      { $set: { approved: !!approved } }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update comment status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    const db = await getDb();
    let query: any = {};
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { id };
    }

    await db.collection('blog_comments').deleteOne(query);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete comment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
