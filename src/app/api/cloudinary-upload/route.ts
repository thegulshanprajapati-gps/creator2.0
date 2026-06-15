import { NextResponse } from 'next/server';
import { createHash } from 'crypto';

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

export async function POST(request: Request) {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (!cloudinaryUrl) {
    return NextResponse.json({ error: 'CLOUDINARY_URL is not configured on the server.' }, { status: 500 });
  }

  const parsed = parseCloudinaryUrl(cloudinaryUrl);
  if (!parsed || !parsed.cloudName || !parsed.apiKey || !parsed.apiSecret) {
    return NextResponse.json({ error: 'Invalid CLOUDINARY_URL format.' }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const assetType = String(formData.get('asset_type') || 'image');
  const resourceType = assetType === 'raw' ? 'raw' : 'image';

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file selected for upload.' }, { status: 400 });
  }

  const { cloudName, apiKey, apiSecret } = parsed;
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
  const timestamp = Math.floor(Date.now() / 1000);
  const signatureParams = `timestamp=${timestamp}`;
  const signature = createHash('sha1').update(`${signatureParams}${apiSecret}`).digest('hex');

  const uploadData = new FormData();
  uploadData.append('file', file);
  uploadData.append('api_key', apiKey);
  uploadData.append('timestamp', String(timestamp));
  uploadData.append('signature', signature);

  if (resourceType === 'raw') {
    uploadData.append('resource_type', 'raw');
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: uploadData,
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: `Cloudinary upload failed: ${data.error?.message || response.statusText}` }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: `Cloudinary upload failed: ${String(error)}` }, { status: 500 });
  }
}
