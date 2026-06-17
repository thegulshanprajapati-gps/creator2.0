import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    const templates = await db.collection('certificate_templates').find({}).toArray();
    
    // Map templates to client-friendly format
    const mapped = templates.map(t => ({
      id: t._id.toString(),
      filename: t.filename,
      type: t.type,
      fileDataPng: t.fileDataPng || '',
      updatedAt: t.updatedAt || t.updated_at
    }));

    return NextResponse.json({
      success: true,
      templates: mapped
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { convertPptxToPdfAndPng } from '@/lib/ppt-converter';

export async function POST(req: Request) {
  try {
    const db = await getDb();
    const { filename, fileData } = await req.json();

    if (!filename || !fileData) {
      return NextResponse.json({ error: 'Missing filename or fileData' }, { status: 400 });
    }

    // Determine template type based on filename keyword
    const lowercaseName = filename.toLowerCase();
    const type = lowercaseName.includes('participation') ? 'participation' : 'completion';

    let pdfBase64 = '';
    let pngBase64 = '';
    try {
      const converted = await convertPptxToPdfAndPng(fileData);
      pdfBase64 = converted.pdfBase64;
      pngBase64 = converted.pngBase64;
    } catch (err: any) {
      console.error("Failed converting PPTX template during upload:", err);
      return NextResponse.json({ error: `PPTX conversion failed: ${err.message}` }, { status: 500 });
    }

    const updateDoc = {
      filename,
      fileData, // Base64 PPTX file
      fileDataPdf: pdfBase64, // Base64 PDF background
      fileDataPng: pngBase64, // Base64 PNG preview
      type,
      updatedAt: new Date()
    };

    // Upsert by template type (since we only keep one active template per type: participation/completion)
    await db.collection('certificate_templates').updateOne(
      { type },
      { $set: updateDoc },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${filename} as ${type} certificate template.`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const db = await getDb();
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const type = url.searchParams.get('type');

    if (id) {
      await db.collection('certificate_templates').deleteOne({ _id: new ObjectId(id) });
    } else if (type) {
      await db.collection('certificate_templates').deleteOne({ type });
    } else {
      return NextResponse.json({ error: 'Missing id or type parameters' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Certificate template deleted successfully.'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
