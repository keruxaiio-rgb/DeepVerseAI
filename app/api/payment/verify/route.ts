import { NextRequest, NextResponse } from "next/server";

// In-memory store for verification codes (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; expires: Date; attempts: number }>();

// Generate a 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification code via SMS (mock implementation - in production use actual SMS service)
async function sendVerificationSMS(mobileNumber: string, code: string): Promise<boolean> {
  try {
    // TODO: Integrate with actual SMS service (e.g., Twilio, Semaphore, etc.)
    console.log(`Sending verification code ${code} to ${mobileNumber}`);

    // Mock SMS sending - in production, replace with actual SMS API call
    // For now, just log the code (you can check server logs to see the code)
    console.log(`📱 VERIFICATION CODE for ${mobileNumber}: ${code}`);

    return true;
  } catch (error) {
    console.error('SMS sending failed:', error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mobileNumber, action } = body;

    if (!mobileNumber) {
      return NextResponse.json(
        { error: "Mobile number required" },
        { status: 400 }
      );
    }

    // Basic mobile number validation (Philippine format)
    const mobileRegex = /^(\+63|0)9\d{9}$/;
    if (!mobileRegex.test(mobileNumber)) {
      return NextResponse.json(
        { error: "Invalid mobile number format" },
        { status: 400 }
      );
    }

    const normalizedNumber = mobileNumber.startsWith('+63')
      ? mobileNumber
      : mobileNumber.startsWith('0')
        ? '+63' + mobileNumber.slice(1)
        : '+63' + mobileNumber;

    if (action === 'send') {
      // Check if we recently sent a code (rate limiting)
      const existingCode = verificationCodes.get(normalizedNumber);
      if (existingCode && existingCode.attempts >= 3) {
        return NextResponse.json(
          { error: "Too many attempts. Please try again later." },
          { status: 429 }
        );
      }

      // Generate and send new verification code
      const code = generateVerificationCode();
      const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      const sent = await sendVerificationSMS(normalizedNumber, code);

      if (!sent) {
        return NextResponse.json(
          { error: "Failed to send verification code" },
          { status: 500 }
        );
      }

      verificationCodes.set(normalizedNumber, {
        code,
        expires,
        attempts: (existingCode?.attempts || 0) + 1
      });

      return NextResponse.json({
        success: true,
        message: "Verification code sent successfully",
        maskedNumber: `***${normalizedNumber.slice(-4)}`
      });

    } else if (action === 'verify') {
      const { code } = body;

      if (!code) {
        return NextResponse.json(
          { error: "Verification code required" },
          { status: 400 }
        );
      }

      const storedCode = verificationCodes.get(normalizedNumber);

      if (!storedCode) {
        return NextResponse.json(
          { error: "No verification code found. Please request a new one." },
          { status: 400 }
        );
      }

      if (new Date() > storedCode.expires) {
        verificationCodes.delete(normalizedNumber);
        return NextResponse.json(
          { error: "Verification code has expired. Please request a new one." },
          { status: 400 }
        );
      }

      if (storedCode.code !== code) {
        return NextResponse.json(
          { error: "Invalid verification code" },
          { status: 400 }
        );
      }

      // Code is valid - remove it from store
      verificationCodes.delete(normalizedNumber);

      return NextResponse.json({
        success: true,
        message: "Mobile number verified successfully",
        verifiedNumber: normalizedNumber
      });

    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'send' or 'verify'" },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
