import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');
    const userEmail = req.headers.get('x-user-email');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, category, excerpt, author } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and Content are required' }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection('blogs');

    const slug = body.slug || title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const blogDoc = {
      title,
      slug,
      excerpt: excerpt || content.substring(0, 150) + '...',
      category: category || 'General',
      author: author || userEmail || 'Admin',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      readTime: Math.ceil(content.split(/\s+/).length / 200) + ' min read',
      image: body.image || 'https://picsum.photos/seed/blog/800/600',
      featured: !!body.featured,
      content: content,
      metaTitle: title,
      metaDescription: excerpt || content.substring(0, 150) + '...',
      keywords: category || 'General',
      focusKeyphrase: title,
      blocks: [
        {
          id: String(Date.now()),
          type: 'paragraph',
          content: content
        }
      ],
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await collection.insertOne(blogDoc);

    return NextResponse.json({ success: true, blogId: result.insertedId.toString() });
  } catch (error: any) {
    console.error('Instant blog post error:', error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
