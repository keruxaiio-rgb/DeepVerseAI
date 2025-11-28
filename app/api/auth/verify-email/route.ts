import { NextRequest, NextResponse } from "next/server";

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

    if (action === 'send-verification') {
      // Generate verification token (in production, use crypto.randomBytes)
      const verificationToken = Math.random().toString(36).substring(2, 15) +
                               Math.random().toString(36).substring(2, 15);

      // Store verification token (in production, use Redis or database)
      // For now, we'll simulate sending email

      // TODO: Send actual email with verification link
      // Example: sendEmail(email, 'Verify your email', `Click here: ${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`)

      console.log(`Verification email would be sent to: ${email}`);
      console.log(`Verification token: ${verificationToken}`);
      console.log(`Verification link: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`);

      return NextResponse.json({
        success: true,
        message: "Verification email sent (check console for demo link)",
        // In production, don't return the token
        verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined
      });

    } else if (action === 'verify-token') {
      const { token } = body;

      if (!token) {
        return NextResponse.json(
          { error: "Verification token is required" },
          { status: 400 }
        );
      }

      // TODO: Verify token against stored tokens
      // For demo, we'll accept any non-empty token

      // TODO: Update user verification status in database
      // Example: updateUserVerificationStatus(email, true)

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
