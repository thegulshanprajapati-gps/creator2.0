import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const db = await getDb();
    
    // Clear security tracker logs
    await db.collection('security_logs').deleteMany({});
    
    // Clear soft-deleted trash items
    await db.collection('deleted_blogs').deleteMany({});
    
    // Reset branding settings
    const defaultBranding = {
      site_name: 'Xmarty Creator',
      primary_color: '#FF0000',
      secondary_color: '#FF0000',
      headings_font: 'Times New Roman',
      body_font: 'Times New Roman',
      theme_settings: { themeMode: 'light' },
      instagram_url: '',
      youtube_url: '',
      whatsapp_url: '',
      updated_at: new Date()
    };
    
    await db.collection('site_settings').updateOne(
      {},
      { $set: defaultBranding },
      { upsert: true }
    );
    
    return NextResponse.json({ success: true, message: "System configurations, telemetry records, and trash purged successfully." });
  } catch (error: any) {
    console.error("Clear system data error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
