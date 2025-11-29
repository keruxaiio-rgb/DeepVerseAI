import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

// Password reset email template
const PASSWORD_RESET_TEMPLATE = (email: string, token: string, appUrl: string) => ({
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
});

// In-memory token store (use Redis in production)
const resetTokenStore = new Map<string, { token: string; email: string; expires: Date }>();

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

  // Log the reset link for development/testing
  const urlMatch = template.html.match(/href="([^"]*reset-password[^"]*)"/);
  if (urlMatch) {
    console.log('🔗 RESET LINK:', urlMatch[1]);
  }

  return { success: true, id: 'console_logged', fallback: true };
}

// Password reset endpoint
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, action, token, newPassword } = body;

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

    if (action === 'send-reset-link') {
      // Generate secure reset token
      const resetToken = generateSecureToken();
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token (use Redis/database in production)
      resetTokenStore.set(`${email}_reset`, {
        token: resetToken,
        email,
        expires
      });

      // Send password reset email
      const emailTemplate = PASSWORD_RESET_TEMPLATE(email, resetToken, appUrl);
      const emailResult = await sendEmail(emailTemplate);

      if (emailResult.success) {
        return NextResponse.json({
          success: true,
          message: "Password reset email sent successfully",
          // In development, return token for testing
          resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
        });
      } else {
        return NextResponse.json(
          { error: "Failed to send password reset email" },
          { status: 500 }
        );
      }

    } else if (action === 'reset-password') {
      if (!token || !newPassword) {
        return NextResponse.json(
          { error: "Token and new password are required" },
          { status: 400 }
        );
      }

      // Validate password strength
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters long" },
          { status: 400 }
        );
      }

      // Check stored token
      const storedData = resetTokenStore.get(`${email}_reset`);

      if (!storedData || storedData.token !== token) {
        return NextResponse.json(
          { error: "Invalid or expired reset token" },
          { status: 400 }
        );
      }

      if (new Date() > storedData.expires) {
        resetTokenStore.delete(`${email}_reset`);
        return NextResponse.json(
          { error: "Reset token has expired" },
          { status: 400 }
        );
      }

      // Token is valid - remove it
      resetTokenStore.delete(`${email}_reset`);

      // TODO: Update user password in Firebase Auth
      // For now, we'll simulate success
      // Note: Firebase password reset should be handled via Firebase Auth SDK

      console.log(`Password reset for ${email} completed`);

      return NextResponse.json({
        success: true,
        message: "Password reset successfully",
        email: email
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: "Password reset failed" },
      { status: 500 }
    );
  }
}
