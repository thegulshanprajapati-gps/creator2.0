import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { createHash } from 'crypto';

const parseCloudinaryUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return {
      cloudName: parsed.hostname,
      apiKey: parsed.username,
      apiSecret: parsed.password,
    };
  } catch (error) {
    return null;
  }
};

// GET handler: Fetch all recycled assets
export async function GET() {
  try {
    const db = await getDb();
    const collection = db.collection('recycled_assets');
    const recycled = await collection.find({}).sort({ deleted_at: -1 }).toArray();
    return NextResponse.json({ resources: recycled });
  } catch (error: any) {
    console.error('Failed to fetch recycled assets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST handler: Restore assets
export async function POST(request: Request) {
  try {
    const { public_ids } = await request.json();
    if (!public_ids || !Array.isArray(public_ids)) {
      return NextResponse.json({ error: 'No public IDs provided for restore.' }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection('recycled_assets');

    // Remove from recycled_assets list to restore back to original
    await collection.deleteMany({ public_id: { $in: public_ids } });

    return NextResponse.json({ success: true, message: 'Assets restored successfully.' });
  } catch (error: any) {
    console.error('Failed to restore assets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE handler: Permanently destroy assets from Cloudinary and DB
export async function DELETE(request: Request) {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (!cloudinaryUrl) {
    return NextResponse.json({ error: 'CLOUDINARY_URL is not configured on the server.' }, { status: 500 });
  }

  const parsed = parseCloudinaryUrl(cloudinaryUrl);
  if (!parsed || !parsed.cloudName || !parsed.apiKey || !parsed.apiSecret) {
    return NextResponse.json({ error: 'Invalid CLOUDINARY_URL format.' }, { status: 500 });
  }

  try {
    const { public_ids } = await request.json();
    if (!public_ids || !Array.isArray(public_ids)) {
      return NextResponse.json({ error: 'No public IDs provided for permanent deletion.' }, { status: 400 });
    }

    const { cloudName, apiKey, apiSecret } = parsed;
    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload`;
    const timestamp = Math.floor(Date.now() / 1000);

    const db = await getDb();
    const collection = db.collection('recycled_assets');

    // Cloudinary admin API for deleting multiple resources
    // DELETE requires public_ids parameters as list
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    const deletePromises = public_ids.map(async (public_id) => {
      const signature = createHash('sha1')
        .update(`public_ids[]=${public_id}&timestamp=${timestamp}${apiSecret}`)
        .digest('hex');

      const body = new URLSearchParams();
      body.append('public_ids[]', public_id);
      body.append('timestamp', String(timestamp));
      body.append('api_key', apiKey);
      body.append('signature', signature);

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Failed to delete ${public_id} on Cloudinary:`, errorText);
      }
    });

    await Promise.all(deletePromises);

    // Remove from MongoDB
    await collection.deleteMany({ public_id: { $in: public_ids } });

    return NextResponse.json({ success: true, message: 'Assets permanently deleted.' });
  } catch (error: any) {
    console.error('Failed to permanently delete assets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
