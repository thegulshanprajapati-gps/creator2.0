import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

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

export async function GET() {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (!cloudinaryUrl) {
    return NextResponse.json({ error: 'CLOUDINARY_URL is not configured on the server.' }, { status: 500 });
  }

  const parsed = parseCloudinaryUrl(cloudinaryUrl);
  if (!parsed || !parsed.cloudName || !parsed.apiKey || !parsed.apiSecret) {
    return NextResponse.json({ error: 'Invalid CLOUDINARY_URL format.' }, { status: 500 });
  }

  const { cloudName, apiKey, apiSecret } = parsed;
  const endpointImage = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload?max_results=100`;
  const endpointRaw = `https://api.cloudinary.com/v1_1/${cloudName}/resources/raw/upload?max_results=100`;
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

  try {
    const [resImage, resRaw] = await Promise.all([
      fetch(endpointImage, { headers: { Authorization: `Basic ${auth}` } }),
      fetch(endpointRaw, { headers: { Authorization: `Basic ${auth}` } })
    ]);

    let resources: any[] = [];
    
    if (resImage.ok) {
      const dataImage = await resImage.json();
      resources = [...resources, ...(dataImage.resources || [])];
    }
    if (resRaw.ok) {
      const dataRaw = await resRaw.json();
      resources = [...resources, ...(dataRaw.resources || [])];
    }

    // Filter out recycled assets
    const db = await getDb();
    const recycled = await db.collection('recycled_assets').find({}).toArray();
    const recycledPublicIds = new Set(recycled.map((item) => item.public_id));

    const activeResources = resources.filter(
      (asset: any) => !recycledPublicIds.has(asset.public_id)
    );

    return NextResponse.json({ resources: activeResources });
  } catch (error) {
    return NextResponse.json({ error: `Failed to fetch Cloudinary assets. ${String(error)}` }, { status: 500 });
  }
}

// POST endpoint to handle soft-deletion / move to Recycle Bin
export async function POST(request: Request) {
  try {
    const { assets } = await request.json();
    if (!assets || !Array.isArray(assets)) {
      return NextResponse.json({ error: 'No assets provided for deletion.' }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection('recycled_assets');
    const now = new Date();

    const insertPromises = assets.map((asset: any) => {
      const recycledDoc = {
        public_id: asset.public_id,
        secure_url: asset.secure_url,
        resource_type: asset.resource_type || 'image',
        format: asset.format || '',
        bytes: asset.bytes || 0,
        original_folder: asset.folder || '',
        original_path: asset.secure_url,
        deleted_at: now,
      };

      return collection.updateOne(
        { public_id: asset.public_id },
        { $set: recycledDoc },
        { upsert: true }
      );
    });

    await Promise.all(insertPromises);

    return NextResponse.json({ success: true, message: 'Assets moved to Recycle Bin.' });
  } catch (error: any) {
    console.error('Failed to move assets to recycle bin:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
