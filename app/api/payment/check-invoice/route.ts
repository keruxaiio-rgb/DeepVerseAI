import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const invoiceNumber = searchParams.get('invoice');

    if (!invoiceNumber) {
      return NextResponse.json(
        { error: "Invoice number required" },
        { status: 400 }
      );
    }

    // Check if subscription exists with this invoice number
    const subscriptionsRef = collection(db, 'subscriptions');
    const q = query(
      subscriptionsRef,
      where('invoiceNumber', '==', invoiceNumber)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Subscription found - payment was completed
      const subscription = querySnapshot.docs[0].data();
      return NextResponse.json({
        subscription_activated: true,
        subscription_id: querySnapshot.docs[0].id,
        subscription_data: {
          status: subscription.status,
          tier: subscription.tier,
          startDate: subscription.startDate,
          endDate: subscription.endDate
        }
      });
    } else {
      // No subscription found - payment not completed yet
      return NextResponse.json({
        subscription_activated: false,
        message: "Payment not yet confirmed"
      });
    }

  } catch (error) {
    console.error('Invoice check error:', error);
    return NextResponse.json(
      { error: "Failed to check invoice status" },
      { status: 500 }
    );
  }
}
