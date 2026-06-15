import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const LOG_PATH = path.join(process.cwd(), 'supportdomain', 'db_error_logs.json');

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    let existing: any[] = [];
    try {
      const content = await fs.readFile(LOG_PATH, 'utf-8');
      existing = JSON.parse(content || '[]');
    } catch (e) {
      existing = [];
    }

    existing.push(payload);
    await fs.writeFile(LOG_PATH, JSON.stringify(existing, null, 2), 'utf-8');

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const content = await fs.readFile(LOG_PATH, 'utf-8');
    const data = JSON.parse(content || '[]');
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ data: [] });
  }
}
