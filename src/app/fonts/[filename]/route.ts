import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const resolvedParams = await params;
    const filename = resolvedParams.filename;
    
    const dotIndex = filename.lastIndexOf('.');
    if (dotIndex === -1) {
      return new NextResponse('Invalid font file name format.', { status: 400 });
    }

    const baseName = filename.slice(0, dotIndex);
    const ext = filename.slice(dotIndex + 1).toLowerCase();

    let contentType = 'application/octet-stream';
    if (ext === 'ttf') contentType = 'font/ttf';
    else if (ext === 'otf') contentType = 'font/otf';
    else if (ext === 'woff') contentType = 'font/woff';
    else if (ext === 'woff2') contentType = 'font/woff2';

    const db = await getDb();
    
    const font = await db.collection('custom_fonts').findOne({
      $or: [
        { name: { $regex: new RegExp(`^${baseName}$`, 'i') } },
        { file_name: { $regex: new RegExp(`^${filename}$`, 'i') } }
      ]
    });

    if (!font || !font.font_data) {
      return new NextResponse('Font not found.', { status: 404 });
    }

    const fontBuffer = Buffer.from(font.font_data, 'base64');

    return new NextResponse(fontBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    return new NextResponse(`Error serving font: ${error.message}`, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
