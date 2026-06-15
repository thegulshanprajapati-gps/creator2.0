import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    const collection = db.collection('blogs');

    // Auto-purge any expired deleted_blogs entries
    const trashCol = db.collection('deleted_blogs');
    await trashCol.deleteMany({ expires_at: { $lt: new Date() } });

    const blogs = await collection.find({}).sort({ date: -1 }).toArray();

    const formatted = blogs.map((b: any) => ({
      ...b,
      id: b._id ? b._id.toString() : b.id,
      _id: undefined
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Failed to fetch blogs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const db = await getDb();
    const collection = db.collection('blogs');

    const blogId = payload.id;
    const blogDoc: any = {
      title: payload.title,
      slug: payload.slug,
      excerpt: payload.excerpt,
      category: payload.category || 'General',
      author: payload.author || 'Admin',
      date: payload.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      readTime: payload.readTime || '1 min',
      image: payload.image,
      featured: !!payload.featured,
      content: payload.content,
      metaTitle: payload.metaTitle,
      metaDescription: payload.metaDescription,
      keywords: payload.keywords,
      focusKeyphrase: payload.focusKeyphrase,
      // Font & Color fields
      titleFont: payload.titleFont || '',
      titleColor: payload.titleColor || '',
      excerptFont: payload.excerptFont || '',
      excerptColor: payload.excerptColor || '',
      authorFont: payload.authorFont || '',
      authorColor: payload.authorColor || '',
      // Block CMS Content Builder integration
      blocks: payload.blocks || [],
      fontConfig: payload.fontConfig || null,
      sidebarConfig: payload.sidebarConfig || [],
      updated_at: new Date()
    };

    if (blogId && ObjectId.isValid(blogId)) {
      await collection.updateOne(
        { _id: new ObjectId(blogId) },
        { $set: blogDoc }
      );
    } else if (blogId) {
      await collection.updateOne(
        { id: blogId },
        { $set: blogDoc },
        { upsert: true }
      );
    } else {
      blogDoc.created_at = new Date();
      blogDoc.id = String(Date.now());
      const insertRes = await collection.insertOne(blogDoc);
      blogDoc.id = insertRes.insertedId.toString();
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to save blog:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const all = searchParams.get('all');

    const db = await getDb();
    const collection = db.collection('blogs');

    if (all === 'true') {
      // Hard delete all — bypasses recycle bin (reset action)
      await collection.deleteMany({});
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ error: 'Id is required' }, { status: 400 });
    }

    // Find the blog before deleting
    let blog: any = null;
    if (ObjectId.isValid(id)) {
      blog = await collection.findOne({ _id: new ObjectId(id) });
    }
    if (!blog) {
      blog = await collection.findOne({ id });
    }

    if (blog) {
      // Soft-delete: move to deleted_blogs with 10-day expiry
      const trashCol = db.collection('deleted_blogs');
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
      await trashCol.insertOne({
        ...blog,
        _id: undefined,
        original_id: blog._id?.toString() || blog.id,
        deleted_at: now,
        expires_at: expiresAt,
      });
    }

    // Remove from active blogs
    if (ObjectId.isValid(id)) {
      await collection.deleteOne({ _id: new ObjectId(id) });
    } else {
      await collection.deleteOne({ id });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete blog:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
