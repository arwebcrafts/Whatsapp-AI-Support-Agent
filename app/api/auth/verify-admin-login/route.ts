import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminCode, createVerifiedAdminToken } from '@/lib/admin-verification';

/**
 * API endpoint to verify admin login code
 *
 * POST /api/auth/verify-admin-login
 * Body: { email: string, code: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { message: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    // Verify the code
    const result = verifyAdminCode(email, code);

    if (!result.valid) {
      return NextResponse.json(
        {
          message: result.message,
          attemptsLeft: result.attemptsLeft,
        },
        { status: 400 }
      );
    }

    // Code is valid - fetch user data
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
      },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Invalid admin account' },
        { status: 403 }
      );
    }

    // Create a temporary verified token for completing the login
    const verifiedToken = createVerifiedAdminToken(user.email);

    // Return success with verified token
    return NextResponse.json(
      {
        success: true,
        message: result.message,
        verifiedToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Admin verification error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
