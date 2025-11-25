import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email-service";
// PRODUCTION: Use Redis rate limiter for scalability
import { checkRateLimit, RateLimitPresets, getClientIdentifier } from "@/lib/rate-limiter-redis";

export async function POST(req: NextRequest) {
  try {
    // Rate limiting - prevent token enumeration attacks
    const rateLimit = await checkRateLimit(req, RateLimitPresets.EMAIL_VERIFY);
    if (!rateLimit.allowed) {
      return rateLimit.response!;
    }

    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { message: "Verification token is required" },
        { status: 400 }
      );
    }

    // Find user by verification token
    const user = await prisma.user.findUnique({
      where: { verificationToken: token },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (user.verificationTokenExpiry && new Date() > user.verificationTokenExpiry) {
      return NextResponse.json(
        { message: "Verification token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { message: "Email already verified" },
        { status: 200 }
      );
    }

    // Update user to verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    // Send welcome email (async, don't wait)
    sendWelcomeEmail(user.email, user.name || 'there')
      .then((sent) => {
        if (sent) {
          console.log(`✅ Welcome email sent to ${user.email}`);
        }
      })
      .catch((error) => {
        console.error(`❌ Error sending welcome email:`, error);
      });

    return NextResponse.json(
      {
        message: "Email verified successfully! Welcome to WhaSales AI.",
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Resend verification email
export async function GET(req: NextRequest) {
  try {
    // Rate limiting - prevent email spam
    const rateLimit = await checkRateLimit(req, RateLimitPresets.EMAIL_RESEND);
    if (!rateLimit.allowed) {
      return rateLimit.response!;
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { message: "Email already verified" },
        { status: 200 }
      );
    }

    // Generate new token if needed
    let token = user.verificationToken;
    if (!token || (user.verificationTokenExpiry && new Date() > user.verificationTokenExpiry)) {
      const crypto = require('crypto');
      token = crypto.randomBytes(32).toString('hex');

      const verificationTokenExpiry = new Date();
      verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationToken: token,
          verificationTokenExpiry,
        },
      });
    }

    // Ensure token is not null
    if (!token) {
      return NextResponse.json(
        { message: "Failed to generate verification token" },
        { status: 500 }
      );
    }

    // Resend verification email
    const { sendVerificationEmail } = await import("@/lib/email-service");
    const sent = await sendVerificationEmail(user.email, user.name || 'there', token);

    if (sent) {
      return NextResponse.json(
        { message: "Verification email resent successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: "Failed to send verification email. Please try again later." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
