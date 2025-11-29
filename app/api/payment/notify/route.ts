import { NextRequest, NextResponse } from 'next/server';

interface NotificationData {
  userId: string;
  paymentData: {
    success: boolean;
    paymentId?: string;
    amount?: number;
    paymentMethod?: string;
    status?: string;
    transactionId?: string;
  };
  type: 'payment_success' | 'bank_pending';
}

export async function POST(req: NextRequest) {
  try {
    const body: NotificationData = await req.json();
    const { userId, paymentData, type } = body;

    // In production, fetch user email from database
    // For now, using placeholder - replace with actual user lookup
    const userEmail = 'user@example.com'; // Replace with actual email lookup
    const userName = 'User'; // Replace with actual name lookup

    let subject: string;
    let htmlContent: string;

    if (type === 'payment_success') {
      subject = '🎉 Payment Successful - Welcome to DeepVerse AI Premium!';
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Payment Successful!</h1>
          <p>Dear ${userName},</p>
          <p>Thank you for upgrading to DeepVerse AI Premium! Your payment has been processed successfully.</p>

          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">Payment Details:</h3>
            <p><strong>Amount:</strong> ₱${paymentData.amount}</p>
            <p><strong>Payment Method:</strong> ${paymentData.paymentMethod === 'gcash' ? 'GCash' : 'Bank Transfer'}</p>
            <p><strong>Transaction ID:</strong> ${paymentData.transactionId}</p>
            <p><strong>Status:</strong> Active</p>
          </div>

          <p>You now have access to all premium features:</p>
          <ul>
            <li>✓ Unlimited AI chat interactions</li>
            <li>✓ Full sermon library access</li>
            <li>✓ Advanced study tools</li>
            <li>✓ Hymn library with audio</li>
            <li>✓ Personal notes and bookmarks</li>
          </ul>

          <p>Start exploring your premium features now!</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/chat"
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
            Go to Chat
          </a>

          <p>If you have any questions, feel free to contact our support team.</p>
          <p>Best regards,<br>The DeepVerse AI Team</p>
        </div>
      `;
    } else if (type === 'bank_pending') {
      subject = '⏳ Payment Submitted - Verification in Progress';
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f59e0b;">Payment Submitted for Verification</h1>
          <p>Dear ${userName},</p>
          <p>Thank you for your bank transfer payment! We have received your payment proof and it's currently being verified.</p>

          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #92400e;">Submission Details:</h3>
            <p><strong>Amount:</strong> ₱${paymentData.amount}</p>
            <p><strong>Payment Method:</strong> Bank Transfer</p>
            <p><strong>Reference ID:</strong> ${paymentData.transactionId}</p>
            <p><strong>Status:</strong> Pending Verification</p>
          </div>

          <p><strong>What happens next?</strong></p>
          <ol>
            <li>Our team will verify your payment within 24-48 hours</li>
            <li>You'll receive another email once verification is complete</li>
            <li>Your premium access will be activated automatically</li>
          </ol>

          <p>During the verification process, you may experience limited access. This is normal and will be resolved once verification is complete.</p>

          <p>If you have any questions about your payment, please contact our support team with your reference ID.</p>
          <p>Best regards,<br>The DeepVerse AI Team</p>
        </div>
      `;
    } else {
      throw new Error('Invalid notification type');
    }

    // Log notification details (email sending removed)
    console.log('📧 NOTIFICATION WOULD BE SENT:', {
      to: userEmail,
      subject,
      type,
      paymentData
    });

    // In development, also log the HTML content
    if (process.env.NODE_ENV === 'development') {
      console.log('📄 EMAIL HTML CONTENT:', htmlContent.substring(0, 200) + '...');
    }

    return NextResponse.json({
      success: true,
      emailId: 'console_logged',
      message: 'Notification logged successfully (email sending disabled)'
    });

  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
