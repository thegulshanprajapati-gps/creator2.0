import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const channel = searchParams.get('channel') || 'general-discussion';
    const limit = parseInt(searchParams.get('limit') || '100');

    const db = await getDb();
    const messages = await db.collection('chat_messages')
      .find({ channel })
      .sort({ timestamp: 1 }) // oldest to newest
      .limit(limit)
      .toArray();

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Failed to fetch chat messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, senderId, senderName, senderRole, channel } = body;

    if (!message || !senderName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await getDb();
    
    const newMessage = {
      message,
      senderId: senderId || 'admin-system',
      senderName,
      senderRole: senderRole || 'admin',
      channel: channel || 'general-discussion',
      timestamp: new Date().toISOString(),
    };

    const result = await db.collection('chat_messages').insertOne(newMessage);

    return NextResponse.json({ 
      success: true, 
      message: { ...newMessage, _id: result.insertedId.toString() } 
    });
  } catch (error) {
    console.error('Failed to send chat message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
