import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

// GET: List all soft-deleted blog posts with days remaining
export async function GET() {
  try {
    const db = await getDb();
    const trashCol = db.collection('deleted_blogs');

    // Auto-purge expired entries
    await trashCol.deleteMany({ expires_at: { $lt: new Date() } });

    const deleted = await trashCol.find({}).sort({ deleted_at: -1 }).toArray();

    const formatted = deleted.map((b: any) => {
      const expiresAt = new Date(b.expires_at);
      const now = new Date();
      const msRemaining = expiresAt.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
      return {
        ...b,
        id: b._id ? b._id.toString() : b.id,
        _id: undefined,
        days_remaining: daysRemaining,
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Failed to fetch trash:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Restore a blog post from trash back to blogs
export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const db = await getDb();
    const trashCol = db.collection('deleted_blogs');
    const blogsCol = db.collection('blogs');

    let trashed: any = null;
    if (ObjectId.isValid(id)) {
      trashed = await trashCol.findOne({ _id: new ObjectId(id) });
    }
    if (!trashed) {
      trashed = await trashCol.findOne({ id });
    }

    if (!trashed) {
      return NextResponse.json({ error: 'Trashed blog not found' }, { status: 404 });
    }

    // Remove trash metadata and restore to blogs
    const { _id, deleted_at, expires_at, days_remaining, ...blogDoc } = trashed;
    blogDoc.restored_at = new Date();
    blogDoc.updated_at = new Date();

    await blogsCol.insertOne(blogDoc);
    await trashCol.deleteOne({ _id: trashed._id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to restore blog:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Permanently delete a blog from trash
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const db = await getDb();
    const trashCol = db.collection('deleted_blogs');

    if (ObjectId.isValid(id)) {
      await trashCol.deleteOne({ _id: new ObjectId(id) });
    } else {
      await trashCol.deleteOne({ id });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to permanently delete blog:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
