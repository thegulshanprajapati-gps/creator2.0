import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    
    // Seed default coupon codes if none exist
    const count = await db.collection('coupons').countDocuments({});
    if (count === 0) {
      const defaultCoupons = [
        {
          code: "WELCOME10",
          description: "Get 10% flat discount on all standard subscription plans.",
          discountType: "Percentage",
          discountValue: 10,
          maxDiscount: 150,
          minimumOrder: 199,
          usageLimit: 500,
          usedCount: 0,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true
        },
        {
          code: "CREATORSAVE",
          description: "Flat 100 INR off on initial annual membership packages.",
          discountType: "Flat",
          discountValue: 100,
          maxDiscount: 100,
          minimumOrder: 999,
          usageLimit: 200,
          usedCount: 0,
          expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          isActive: true
        }
      ];
      await db.collection('coupons').insertMany(defaultCoupons);
    }

    const coupons = await db.collection('coupons').find({}).toArray();

    return NextResponse.json({
      success: true,
      coupons: coupons.map((c: any) => ({
        ...c,
        id: c._id.toString(),
        _id: undefined
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const db = await getDb();

    const res = await db.collection('coupons').insertOne({
      ...payload,
      createdAt: new Date()
    });

    return NextResponse.json({ success: true, id: res.insertedId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, isActive } = await req.json();
    const db = await getDb();

    await db.collection('coupons').updateOne(
      { _id: new ObjectId(id) },
      { $set: { isActive } }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
