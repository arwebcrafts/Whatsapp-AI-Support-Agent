import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { validatePassword } from "@/lib/password-validator";
import { sendVerificationEmail } from "@/lib/email-service";
// PRODUCTION: Use Redis rate limiter for scalability
import { checkRateLimit, RateLimitPresets } from "@/lib/rate-limiter-redis";

export async function POST(req: NextRequest) {
  try {
    // Rate limiting - prevent signup abuse
    const rateLimit = await checkRateLimit(req, RateLimitPresets.SIGNUP);
    if (!rateLimit.allowed) {
      return rateLimit.response!;
    }

    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          message: "Password does not meet requirements",
          errors: passwordValidation.errors
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date();
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24); // 24 hour expiry

    // Calculate trial end date (3 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 3);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        verificationToken,
        verificationTokenExpiry,
        emailVerified: false,
        trialEndsAt,
        subscriptionStatus: "trial",
        planType: "starter",
      }
    });

    // Create initial message usage record
    const currentMonth = new Date().toISOString().slice(0, 7); // Format: 2025-11
    await prisma.messageUsage.create({
      data: {
        userId: user.id,
        month: currentMonth,
        messagesUsed: 0,
        messageLimit: 2000,
      }
    });

    // Send verification email (async, don't wait)
    sendVerificationEmail(email, name, verificationToken)
      .then((sent) => {
        if (sent) {
          console.log(`✅ Verification email sent to ${email}`);
        } else {
          console.warn(`⚠️ Failed to send verification email to ${email}`);
        }
      })
      .catch((error) => {
        console.error(`❌ Error sending verification email to ${email}:`, error);
      });

    return NextResponse.json(
      {
        message: "User created successfully. Please check your email to verify your account.",
        userId: user.id,
        emailSent: true
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
