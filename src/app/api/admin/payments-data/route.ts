import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    
    // Aggregate captured totals
    const orders = await db.collection('orders')
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    const paidOrders = await db.collection('orders').find({ paymentStatus: 'Paid' }).toArray();

    let totalRev = 0;
    let mrr = 0;
    let pending = 0;
    let failed = 0;
    let refunds = 0;

    paidOrders.forEach((o: any) => {
      totalRev += o.total || 0;
      if (o.type === 'Subscription') {
        const itemPrice = o.total || 0;
        mrr += o.billingCycle === 'yearly' ? Math.round(itemPrice / 12) : itemPrice;
      }
    });

    const pendingOrders = await db.collection('orders').find({ paymentStatus: 'Pending' }).toArray();
    pendingOrders.forEach((o: any) => { pending += o.total || 0; });

    const failedOrders = await db.collection('orders').find({ paymentStatus: 'Failed' }).toArray();
    failedOrders.forEach((o: any) => { failed += o.total || 0; });

    const refundedOrders = await db.collection('orders').find({ paymentStatus: 'Refunded' }).toArray();
    refundedOrders.forEach((o: any) => { refunds += o.total || 0; });

    const arr = mrr * 12;

    return NextResponse.json({
      success: true,
      stats: {
        mrr,
        arr,
        totalRev,
        pending,
        failed,
        refunds
      },
      orders: orders.map((o: any) => ({
        ...o,
        id: o._id.toString(),
        _id: undefined
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
