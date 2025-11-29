import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { generateInvoiceNumber } from "../../../lib/invoiceUtils";

// Handle QR payment generation
async function handleQRPayment(amount: number, userId: string, planType: string) {
  try {
    // Validate required fields
    if (!amount || !userId || !planType) {
      return NextResponse.json(
        { error: "Missing required fields: amount, userId, planType" },
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

    // Get PayMongo configuration
    const paymongoSecretKey = process.env.PAYMONGO_SECRET_KEY;
    if (!paymongoSecretKey) {
      return NextResponse.json(
        { error: "PayMongo configuration missing" },
        { status: 500 }
      );
    }

    // Convert amount to centavos (PayMongo uses smallest currency unit)
    const amountInCentavos = amount * 100;

    // Generate unique invoice number
    const invoiceNumber = await generateInvoiceNumber();
    console.log(`Generated invoice number: ${invoiceNumber} for QR payment by user ${userId}`);

    try {
      // Create QR payment using PayMongo payment intents
      const paymentIntentResponse = await axios.post(
        'https://api.paymongo.com/v1/payment_intents',
        {
          data: {
            attributes: {
              amount: amountInCentavos,
              currency: 'PHP',
              payment_method_allowed: ['qrph'],
              description: `DeepVerse AI Premium Subscription - ${invoiceNumber}`,
              metadata: {
                invoice_number: invoiceNumber,
                user_id: userId,
                plan_id: `monthly_${amount}`,
                payment_type: 'qr'
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

      // Create QR code for the payment intent
      const qrResponse = await axios.post(
        `https://api.paymongo.com/v1/payment_intents/${paymentIntent.id}/attach`,
        {
          data: {
            attributes: {
              payment_method: 'qrph',
              client_key: process.env.PAYMONGO_PUBLIC_KEY
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

      const qrData = qrResponse.data.data;

      const response = {
        success: true,
        payment_intent_id: paymentIntent.id,
        qr_code: qrData.attributes.qr_code || null,
        invoice_number: invoiceNumber,
        amount: amount,
        payment_url: 'https://paymongo.page/l/deepverseai' // Provided PayMongo link
      };

      return NextResponse.json(response);

    } catch (paymongoError) {
      console.error('PayMongo QR API error:', paymongoError);
      const error = paymongoError as Error & { response?: { data?: unknown; status?: number } };
      console.error('PayMongo QR error details:', {
        status: error.response?.status,
        data: JSON.stringify(error.response?.data, null, 2),
        message: error.message
      });

      // Fallback: return payment link if QR generation fails
      const invoiceNumber = await generateInvoiceNumber();
      return NextResponse.json({
        success: true,
        payment_intent_id: null,
        qr_code: null,
        invoice_number: invoiceNumber,
        amount: amount,
        payment_url: 'https://paymongo.page/l/deepverseai',
        fallback: true
      });
    }

  } catch (error) {
    console.error('QR payment creation error:', error);
    return NextResponse.json(
      { error: "QR payment creation failed" },
      { status: 500 }
    );
  }
}

// Handle static QR payment (just generate invoice, no PayMongo API call)
async function handleStaticQRPayment(amount: number, userId: string, planType: string) {
  try {
    // Validate required fields
    if (!amount || !userId || !planType) {
      return NextResponse.json(
        { error: "Missing required fields: amount, userId, planType" },
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

    // Generate unique invoice number for tracking
    const invoiceNumber = await generateInvoiceNumber();
    console.log(`Generated invoice number: ${invoiceNumber} for static QR payment by user ${userId}`);

    // Return response with invoice number for frontend tracking
    const response = {
      success: true,
      invoice_number: invoiceNumber,
      amount: amount,
      payment_type: 'qr_static',
      qr_code: 'code_pRQ6tBUFwMxHnGct8GbTuW2c', // Static QR code provided by user
      payment_url: 'https://pm.link/qrph/code_pRQ6tBUFwMxHnGct8GbTuW2c'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Static QR payment invoice generation error:', error);
    return NextResponse.json(
      { error: "Invoice generation failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, userId, planType, paymentType } = body;

    // Support both GCash source and QR payment
    if (paymentType === 'qr') {
      return handleQRPayment(amount, userId, planType);
    }

    // Support static QR payment (no API call, just generate invoice)
    if (paymentType === 'qr_static') {
      return handleStaticQRPayment(amount, userId, planType);
    }

    // Validate required fields
    if (!amount || !userId || !planType) {
      return NextResponse.json(
        { error: "Missing required fields: amount, userId, planType" },
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

    // Get PayMongo configuration
    const paymongoSecretKey = process.env.PAYMONGO_SECRET_KEY;
    if (!paymongoSecretKey) {
      return NextResponse.json(
        { error: "PayMongo configuration missing" },
        { status: 500 }
      );
    }

    // Convert amount to centavos (PayMongo uses smallest currency unit)
    const amountInCentavos = amount * 100;

    // Generate unique invoice number
    const invoiceNumber = await generateInvoiceNumber();
    console.log(`Generated invoice number: ${invoiceNumber} for user ${userId}`);

    try {
      // Create GCash source directly
      const sourceResponse = await axios.post(
        'https://api.paymongo.com/v1/sources',
        {
          data: {
            attributes: {
              amount: amountInCentavos,
              currency: 'PHP',
              type: 'gcash',
              redirect: {
                success: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade?success=true&source_id={id}`,
                failed: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade?success=false&source_id={id}`
              },
              metadata: {
                invoice_number: invoiceNumber,
                user_id: userId,
                plan_id: `monthly_${amount}` // e.g., "monthly_299"
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

      const response = {
        success: true,
        checkout_url: source.attributes.redirect.checkout_url,
        source_id: source.id,
        invoice_number: invoiceNumber
      };

      return NextResponse.json(response);

    } catch (paymongoError) {
      console.error('PayMongo API error:', paymongoError);
      const error = paymongoError as Error & { response?: { data?: unknown; status?: number } };
      console.error('PayMongo error details:', {
        status: error.response?.status,
        data: JSON.stringify(error.response?.data, null, 2),
        message: error.message
      });
      return NextResponse.json(
        { error: "Payment gateway error", details: error.response?.data },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('GCash source creation error:', error);
    return NextResponse.json(
      { error: "GCash source creation failed" },
      { status: 500 }
    );
  }
}
