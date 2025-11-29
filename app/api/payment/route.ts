import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// Payment processing endpoint
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, paymentMethod, userId, planType } = body;

    // Validate required fields
    if (!amount || !paymentMethod || !userId || !planType) {
      return NextResponse.json(
        { error: "Missing required fields: amount, paymentMethod, userId, planType" },
        { status: 400 }
      );
    }

    // Validate payment method
    const validMethods = ['gcash', 'bank'];
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method. Use 'gcash' or 'bank'" },
        { status: 400 }
      );
    }

    // Validate amount (₱299 for premium)
    if (planType === 'premium' && amount !== 299) {
      return NextResponse.json(
        { error: "Invalid amount for premium plan. Must be ₱299" },
        { status: 400 }
      );
    }

    // Implement PayMongo payment processing
    const paymongoSecretKey = process.env.PAYMONGO_SECRET_KEY;
    if (!paymongoSecretKey) {
      return NextResponse.json(
        { error: "PayMongo configuration missing" },
        { status: 500 }
      );
    }

    // Convert amount to centavos (PayMongo uses smallest currency unit)
    const amountInCentavos = amount * 100;

    try {
      if (paymentMethod === 'gcash') {
        // Create GCash source directly (this is the correct flow for GCash)
        const sourceResponse = await axios.post(
          'https://api.paymongo.com/v1/sources',
          {
            data: {
              attributes: {
                amount: amountInCentavos,
                currency: 'PHP',
                type: 'gcash',
                redirect: {
                  success: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/upgrade?success=true&source_id={id}`,
                  failed: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/upgrade?success=false&source_id={id}`
                },
                metadata: {
                  userId,
                  planType,
                  paymentMethod
                }
              }
            }
          },
          {
            headers: {
              'Authorization': `Basic ${Buffer.from(paymongoSecretKey + ':').toString('base64')}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const source = sourceResponse.data.data;

        const paymentResponse = {
          success: true,
          paymentId: source.id,
          amount: amount,
          currency: 'PHP',
          paymentMethod: paymentMethod,
          status: source.attributes.status,
          userId: userId,
          planType: planType,
          timestamp: new Date().toISOString(),
          transactionId: source.id,
          paymentUrl: source.attributes.redirect.checkout_url,
          sourceId: source.id
        };

        return NextResponse.json(paymentResponse);

      } else if (paymentMethod === 'bank') {
        // For bank transfer, create a payment intent without source
        const paymentIntentResponse = await axios.post(
          'https://api.paymongo.com/v1/payment_intents',
          {
            data: {
              attributes: {
                amount: amountInCentavos,
                currency: 'PHP',
                payment_method_allowed: ['paymaya'],
                description: `DeepVerse AI ${planType} subscription`,
                metadata: {
                  userId,
                  planType,
                  paymentMethod
                }
              }
            }
          },
          {
            headers: {
              'Authorization': `Basic ${Buffer.from(paymongoSecretKey + ':').toString('base64')}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const paymentIntent = paymentIntentResponse.data.data;

        const paymentResponse = {
          success: true,
          paymentId: paymentIntent.id,
          amount: amount,
          currency: 'PHP',
          paymentMethod: paymentMethod,
          status: paymentIntent.attributes.status,
          userId: userId,
          planType: planType,
          timestamp: new Date().toISOString(),
          transactionId: paymentIntent.id,
          paymentUrl: null // Bank transfer doesn't have immediate checkout URL
        };

        return NextResponse.json(paymentResponse);
      }

    } catch (paymongoError) {
      console.error('PayMongo API error:', (paymongoError as any).response?.data || (paymongoError as any).message);
      return NextResponse.json(
        { error: "Payment gateway error", details: (paymongoError as any).response?.data },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { error: "Payment processing failed" },
      { status: 500 }
    );
  }
}

// Get payment status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment ID required" },
        { status: 400 }
      );
    }

    const paymongoSecretKey = process.env.PAYMONGO_SECRET_KEY;
    if (!paymongoSecretKey) {
      return NextResponse.json(
        { error: "PayMongo configuration missing" },
        { status: 500 }
      );
    }

    // Get payment intent status from PayMongo
    const paymentIntentResponse = await axios.get(
      `https://api.paymongo.com/v1/payment_intents/${paymentId}`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(paymongoSecretKey + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const paymentIntent = paymentIntentResponse.data.data;

    const statusResponse = {
      paymentId: paymentIntent.id,
      status: paymentIntent.attributes.status,
      amount: paymentIntent.attributes.amount / 100, // Convert back from centavos
      currency: paymentIntent.attributes.currency,
      completedAt: paymentIntent.attributes.created_at,
      metadata: paymentIntent.attributes.metadata
    };

    return NextResponse.json(statusResponse);

  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 }
    );
  }
}
