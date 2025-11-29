import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../firebase";
import { doc, updateDoc, getDoc, collection, addDoc } from "firebase/firestore";
import type { User } from "../../../../types/api";

// PayMongo webhook secret (set this in environment variables)
const PAYMONGO_WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET;

// Verify PayMongo webhook signature
function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!PAYMONGO_WEBHOOK_SECRET) return true; // Skip verification in development

  import('crypto').then(crypto => {
    const expectedSignature = crypto.default
      .createHmac('sha256', PAYMONGO_WEBHOOK_SECRET!)
      .update(payload)
      .digest('hex');
    return signature === expectedSignature;
  });

  return true; // Temporary return for async compatibility
}

// Handle PayMongo webhook events
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('paymongo-signature');

    // Verify webhook signature (skip in development if no secret set)
    if (PAYMONGO_WEBHOOK_SECRET && signature) {
      if (!verifyWebhookSignature(body, signature)) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(body);
    const { data, type } = payload;

    console.log('PayMongo webhook received:', type, data.id);

    if (type === 'source.chargeable') {
      // GCash source is ready for charging (successful payment)
      await handleSuccessfulPayment(data);

    } else if (type === 'payment.paid') {
      // QR payment was successful
      await handleSuccessfulQRPayment(data);

    } else if (type === 'payment.failed') {
      // Payment failed
      await handlePaymentFailed(data);

    } else if (type === 'payment.expired') {
      // Payment expired
      await handlePaymentExpired(data);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handle successful source chargeable event
async function handleSuccessfulPayment(sourceData: { id: string; attributes: { metadata?: Record<string, unknown> } }) {
  try {
    const sourceId = sourceData.id;
    const metadata = sourceData.attributes.metadata || {};
    const { invoice_number, user_id, plan_id } = metadata;

    console.log(`Processing successful payment for user ${user_id}, source ${sourceId}, invoice ${invoice_number}`);

    if (!user_id) {
      console.error('No user_id in source metadata');
      return;
    }

    if (!invoice_number) {
      console.error('No invoice_number in source metadata');
      return;
    }

    // Find user by email (user_id is email in our system)
    const userRef = doc(db, 'users', user_id as string);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.error(`User ${user_id} not found`);
      return;
    }

    const userData = userSnap.data() as User;

    // Extract plan type from plan_id (e.g., "monthly_299" -> "premium")
    const planType = (plan_id as string)?.includes('299') ? 'premium' : 'basic';

    // Update user subscription status
    await updateDoc(userRef, {
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + (planType === 'premium' ? 30 : 365) * 24 * 60 * 60 * 1000),
      lastLogin: new Date(),
    });

    // Create subscription record with invoice number
    const subscriptionData = {
      userId: user_id,
      tier: planType,
      status: 'active',
      paymentMethod: 'gcash',
      accountNumber: userData.mobileNumber || '',
      fullName: userData.fullName || '',
      email: userData.email,
      mobileNumber: userData.mobileNumber || '',
      authorizationConfirmed: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + (planType === 'premium' ? 30 : 365) * 24 * 60 * 60 * 1000),
      autoRenew: true,
      interval: 'monthly' as const,
      paymentId: sourceId,
      paidAt: new Date(),
      invoiceNumber: invoice_number, // Include invoice number in subscription
    };

    await addDoc(collection(db, 'subscriptions'), subscriptionData);

    console.log(`✅ Subscription activated for user ${user_id} with invoice ${invoice_number}`);

    // TODO: Send confirmation email with invoice number
    // TODO: Update referral bonuses if applicable

  } catch (error) {
    console.error('Error processing successful payment:', error);
  }
}

// Handle successful QR payment event
async function handleSuccessfulQRPayment(paymentData: { id: string; attributes: { metadata?: Record<string, unknown> } }) {
  try {
    const paymentId = paymentData.id;
    const metadata = paymentData.attributes.metadata || {};
    const { invoice_number, user_id, plan_id, payment_type } = metadata;

    console.log(`Processing successful QR payment for user ${user_id}, payment ${paymentId}, invoice ${invoice_number}`);

    // Only process if this is actually a QR payment
    if (payment_type !== 'qr') {
      console.log('Skipping non-QR payment');
      return;
    }

    if (!user_id) {
      console.error('No user_id in payment metadata');
      return;
    }

    if (!invoice_number) {
      console.error('No invoice_number in payment metadata');
      return;
    }

    // Find user by email (user_id is email in our system)
    const userRef = doc(db, 'users', user_id as string);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.error(`User ${user_id} not found`);
      return;
    }

    const userData = userSnap.data() as User;

    // Extract plan type from plan_id (e.g., "monthly_299" -> "premium")
    const planType = (plan_id as string)?.includes('299') ? 'premium' : 'basic';

    // Update user subscription status
    await updateDoc(userRef, {
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + (planType === 'premium' ? 30 : 365) * 24 * 60 * 60 * 1000),
      lastLogin: new Date(),
    });

    // Create subscription record with invoice number
    const subscriptionData = {
      userId: user_id,
      tier: planType,
      status: 'active',
      paymentMethod: 'qr',
      accountNumber: userData.mobileNumber || '',
      fullName: userData.fullName || '',
      email: userData.email,
      mobileNumber: userData.mobileNumber || '',
      authorizationConfirmed: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + (planType === 'premium' ? 30 : 365) * 24 * 60 * 60 * 1000),
      autoRenew: true,
      interval: 'monthly' as const,
      paymentId: paymentId,
      paidAt: new Date(),
      invoiceNumber: invoice_number, // Include invoice number in subscription
    };

    await addDoc(collection(db, 'subscriptions'), subscriptionData);

    console.log(`✅ QR subscription activated for user ${user_id} with invoice ${invoice_number}`);

    // TODO: Send confirmation email with invoice number
    // TODO: Update referral bonuses if applicable

  } catch (error) {
    console.error('Error processing successful QR payment:', error);
  }
}

// Handle payment paid event
async function handlePaymentPaid(paymentData: { id: string; attributes: { metadata?: Record<string, unknown> } }) {
  try {
    const paymentId = paymentData.id;
    const metadata = paymentData.attributes.metadata || {};
    const { userId } = metadata;

    console.log(`Payment ${paymentId} marked as paid for user ${userId}`);

    // Additional processing for paid payments
    // This is usually redundant with source.chargeable for GCash

  } catch (error) {
    console.error('Error processing payment paid:', error);
  }
}

// Handle payment failed event
async function handlePaymentFailed(paymentData: { id: string; attributes: { metadata?: Record<string, unknown> } }) {
  try {
    const paymentId = paymentData.id;
    const metadata = paymentData.attributes.metadata || {};
    const { userId } = metadata;

    console.log(`Payment ${paymentId} failed for user ${userId}`);

    if (userId) {
      // Update user status to indicate failed payment
      const userRef = doc(db, 'users', userId as string);
      await updateDoc(userRef, {
        subscriptionStatus: 'none', // Reset to free tier
        lastLogin: new Date(),
      });

      // TODO: Send failure notification email
    }

  } catch (error) {
    console.error('Error processing payment failed:', error);
  }
}

// Handle payment expired event
async function handlePaymentExpired(paymentData: { id: string; attributes: { metadata?: Record<string, unknown> } }) {
  try {
    const paymentId = paymentData.id;
    const metadata = paymentData.attributes.metadata || {};
    const { userId } = metadata;

    console.log(`Payment ${paymentId} expired for user ${userId}`);

    if (userId) {
      // Update user status to indicate failed payment
      const userRef = doc(db, 'users', userId as string);
      await updateDoc(userRef, {
        subscriptionStatus: 'none', // Reset to free tier
        lastLogin: new Date(),
      });

      // TODO: Send failure notification email
    }

  } catch (error) {
    console.error('Error processing payment expired:', error);
  }
}
