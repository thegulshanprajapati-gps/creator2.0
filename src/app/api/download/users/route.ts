import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    const users = await db.collection('users').find({}).toArray();

    // Generate CSV contents
    const headers = ['ID', 'Email', 'Full Name', 'Role', 'Two Factor Enabled', 'Created At'];
    const rows = users.map((u: any) => [
      u._id?.toString() || u.id || '',
      u.email || '',
      u.full_name || '',
      u.role || '',
      u.two_factor_enabled ? 'Yes' : 'No',
      u.created_at ? new Date(u.created_at).toISOString() : '',
    ]);

    // Format fields with quotes to handle commas safely
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    // Return the response as a downloadable file
    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="user_data_export.csv"',
      },
    });
  } catch (error: any) {
    console.error('Failed to export user data:', error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
