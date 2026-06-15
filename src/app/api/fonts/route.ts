import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

function corsResponse(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET() {
  try {
    const db = await getDb();
    const fonts = await db
      .collection('custom_fonts')
      .find({}, { projection: { font_data: 0 } })
      .toArray();

    const formatted = fonts.map(f => ({
      id: f._id.toString(),
      name: f.name,
      format: f.format,
      file_name: f.file_name,
      created_at: f.created_at,
    }));

    return corsResponse({ success: true, fonts: formatted });
  } catch (error: any) {
    return corsResponse({ success: false, error: error.message }, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const name = formData.get('name') as string | null;

    if (!file || !name) {
      return corsResponse({ success: false, error: 'Font file and font name are required.' }, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString('base64');
    
    const fileName = file.name.toLowerCase();
    let format = 'truetype';
    if (fileName.endsWith('.woff2')) format = 'woff2';
    else if (fileName.endsWith('.woff')) format = 'woff';
    else if (fileName.endsWith('.otf')) format = 'opentype';

    const db = await getDb();
    
    const existing = await db.collection('custom_fonts').findOne({ name });
    if (existing) {
      return corsResponse({ success: false, error: `Font "${name}" already exists.` }, 400);
    }

    const doc = {
      name,
      format,
      file_name: file.name,
      font_data: base64Data,
      created_at: new Date().toISOString(),
    };

    const result = await db.collection('custom_fonts').insertOne(doc);

    return corsResponse({
      success: true,
      font: {
        id: result.insertedId.toString(),
        name,
        format,
        file_name: file.name,
      },
    });
  } catch (error: any) {
    return corsResponse({ success: false, error: error.message }, 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return corsResponse({ success: false, error: 'Font ID is required' }, 400);
    }

    const db = await getDb();
    const result = await db.collection('custom_fonts').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return corsResponse({ success: false, error: 'Font not found' }, 404);
    }

    return corsResponse({ success: true, message: 'Font deleted successfully.' });
  } catch (error: any) {
    return corsResponse({ success: false, error: error.message }, 500);
  }
}
