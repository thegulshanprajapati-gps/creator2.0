import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    let settings: any = await db.collection('site_settings').findOne({}, { sort: { updated_at: -1 } });
    if (!settings) {
      settings = {
        site_name: 'XmartyCreator',
        primary_color: '#FF0000',
        secondary_color: '#FF0000',
        theme_settings: { themeMode: 'light' }
      };
    }
    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        id: settings?._id?.toString(),
        _id: undefined
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const db = await getDb();
    const payload = await req.json();

    const updateDoc: any = {
      site_name: payload.site_name || 'XmartyCreator',
      primary_color: payload.primary_color || '#FF0000',
      secondary_color: payload.secondary_color || '#FF0000',
      headings_font: payload.headings_font || 'Times New Roman',
      body_font: payload.body_font || 'Times New Roman',
      theme_settings: {
        themeMode: payload.theme_settings?.themeMode || 'light'
      },
      instagram_url: payload.instagram_url || '',
      youtube_url: payload.youtube_url || '',
      whatsapp_url: payload.whatsapp_url || '',
      certificate_template: payload.certificate_template || '',
      cert_font_family: payload.cert_font_family || 'helvetica',
      cert_font_bold: payload.cert_font_bold ?? true,
      cert_font_italic: payload.cert_font_italic ?? false,
      cert_font_color: payload.cert_font_color || '#cc3333',
      cert_title_color: payload.cert_title_color || '#1e3a8a',
      cert_exam_color: payload.cert_exam_color || '#33994c',
      updated_at: new Date()
    };

    await db.collection('site_settings').updateOne(
      {},
      { $set: updateDoc },
      { upsert: true }
    );

    // Fetch the updated settings
    const updated: any = await db.collection('site_settings').findOne({}, { sort: { updated_at: -1 } });

    return NextResponse.json({
      success: true,
      settings: {
        ...updated,
        id: updated?._id?.toString(),
        _id: undefined
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
