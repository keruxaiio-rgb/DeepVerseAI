import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

// Email templates
const EMAIL_TEMPLATES = {
  verification: (email: string, token: string, appUrl: string) => ({
    from: 'DeepVerse AI <noreply@deepverse.ai>',
    to: email,
    subject: 'Verify your DeepVerse AI account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4B3CBC 0%, #8E6AFF 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to DeepVerse AI</h1>
          <p style="color: #E8E8FF; margin: 10px 0 0 0; font-size: 16px;">Your AI Theological Assistant</p>
        </div>

        <div style="padding: 40px 30px; background: white;">
          <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
          <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
            Thank you for signing up for DeepVerse AI! To complete your registration and start exploring advanced theological insights, please verify your email address.
          </p>

          <div style="text-align: center; margin: 40px 0;">
            <a href="${appUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}"
               style="background: #34C759; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              Verify Email Address
            </a>
          </div>

          <p style="color: #999; font-size: 14px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
            If you didn't create an account with DeepVerse AI, you can safely ignore this email.
          </p>

          <p style="color: #999; font-size: 14px;">
            This verification link will expire in 24 hours.
          </p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #666; margin: 0; font-size: 14px;">
            DeepVerse AI - Advanced Theological AI Assistant<br>
            Questions? Contact us at <a href="mailto:support@deepverse.ai" style="color: #4B3CBC;">support@deepverse.ai</a>
          </p>
        </div>
      </div>
    `
  }),

  passwordReset: (email: string, token: string, appUrl: string) => ({
    from: 'DeepVerse AI <noreply@deepverse.ai>',
    to: email,
    subject: 'Reset your DeepVerse AI password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4B3CBC 0%, #8E6AFF 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
          <p style="color: #E8E8FF; margin: 10px 0 0 0; font-size: 16px;">DeepVerse AI</p>
        </div>

        <div style="padding: 40px 30px; background: white;">
          <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
          <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
            We received a request to reset your password for your DeepVerse AI account. Click the button below to create a new password.
          </p>

          <div style="text-align: center; margin: 40px 0;">
            <a href="${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}"
               style="background: #007AFF; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              Reset Password
            </a>
          </div>

          <p style="color: #999; font-size: 14px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>

          <p style="color: #999; font-size: 14px;">
            This reset link will expire in 1 hour for security reasons.
          </p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #666; margin: 0; font-size: 14px;">
            DeepVerse AI - Advanced Theological AI Assistant<br>
            Questions? Contact us at <a href="mailto:support@deepverse.ai" style="color: #4B3CBC;">support@deepverse.ai</a>
          </p>
        </div>
      </div>
    `
  })
};

// In-memory token store (use Redis in production)
const tokenStore = new Map<string, { token: string; email: string; expires: Date; type: 'verification' | 'reset' }>();

// Generate secure token
function generateSecureToken(): string {
  return createHash('sha256').update(Date.now().toString() + Math.random().toString()).digest('hex');
}

// Send email (console logging only since Resend is removed)
async function sendEmail(template: {
  from: string;
  to: string;
  subject: string;
  html: string;
}) {
  console.log('📧 EMAIL WOULD BE SENT:', {
    to: template.to,
    subject: template.subject,
    from: template.from
  });

  // Log the verification link for development/testing
  const urlMatch = template.html.match(/href="([^"]*verify-email[^"]*)"/);
  if (urlMatch) {
    console.log('🔗 VERIFICATION LINK:', urlMatch[1]);
  }

  return { success: true, id: 'console_logged', fallback: true };
}

// Email verification endpoint
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, action } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (action === 'send-verification') {
      // Generate secure verification token
      const verificationToken = generateSecureToken();
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store token (use Redis/database in production)
      tokenStore.set(`${email}_verification`, {
        token: verificationToken,
        email,
        expires,
        type: 'verification'
      });

      // Send verification email
      const emailTemplate = EMAIL_TEMPLATES.verification(email, verificationToken, appUrl);
      const emailResult = await sendEmail(emailTemplate);

      if (emailResult.success) {
        return NextResponse.json({
          success: true,
          message: "Verification email sent successfully",
          // In development, return token for testing
          verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined
        });
      } else {
        return NextResponse.json(
          { error: "Failed to send verification email" },
          { status: 500 }
        );
      }

    } else if (action === 'verify-token') {
      const { token } = body;

      if (!token) {
        return NextResponse.json(
          { error: "Verification token is required" },
          { status: 400 }
        );
      }

      // Check stored token
      const storedData = tokenStore.get(`${email}_verification`);

      if (!storedData || storedData.token !== token || storedData.type !== 'verification') {
        return NextResponse.json(
          { error: "Invalid or expired verification token" },
          { status: 400 }
        );
      }

      if (new Date() > storedData.expires) {
        tokenStore.delete(`${email}_verification`);
        return NextResponse.json(
          { error: "Verification token has expired" },
          { status: 400 }
        );
      }

      // Token is valid - remove it and mark email as verified
      tokenStore.delete(`${email}_verification`);

      // TODO: Update user verification status in database
      // For now, we'll simulate success

      return NextResponse.json({
        success: true,
        message: "Email verified successfully",
        email: email
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}

// Check verification status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter required" },
        { status: 400 }
      );
    }

    // TODO: Check verification status from database
    // For demo, return mock status
    const isVerified = Math.random() > 0.5; // Random for demo

    return NextResponse.json({
      email: email,
      verified: isVerified,
      verifiedAt: isVerified ? new Date().toISOString() : null
    });

  } catch (error) {
    console.error('Verification status check error:', error);
    return NextResponse.json(
      { error: "Failed to check verification status" },
      { status: 500 }
    );
  }
}
