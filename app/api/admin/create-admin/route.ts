import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
// PRODUCTION: Use Redis rate limiter for scalability
import { checkRateLimit, RateLimitPresets } from '@/lib/rate-limiter-redis';

// TEMPORARY ENDPOINT - DELETE AFTER CREATING ADMIN
// Only works if no admin exists yet (security measure)
// CRITICAL: Set ADMIN_CREATION_DISABLED=true in production after first admin is created

export async function POST(req: NextRequest) {
  try {
    // Rate limiting - prevent brute force
    const rateLimit = await checkRateLimit(req, RateLimitPresets.ADMIN);
    if (!rateLimit.allowed) {
      return rateLimit.response!;
    }

    // Check if admin creation is permanently disabled via environment variable
    if (process.env.ADMIN_CREATION_DISABLED === 'true') {
      console.warn('🚨 SECURITY: Attempted access to disabled admin creation endpoint');
      return NextResponse.json(
        { message: 'This endpoint has been permanently disabled for security.' },
        { status: 403 }
      );
    }

    // Check if any admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' },
    });

    if (existingAdmin) {
      console.warn('🚨 SECURITY: Admin already exists. Set ADMIN_CREATION_DISABLED=true in .env');
      return NextResponse.json(
        {
          message: 'Admin user already exists. Set ADMIN_CREATION_DISABLED=true in .env to permanently disable this endpoint.',
          security: 'CRITICAL: Disable this endpoint immediately'
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email,
        name: name || 'Admin User',
        password: hashedPassword,
        role: 'admin',
        subscriptionStatus: 'active',
        planType: 'business',
      },
    });

    console.log('✅ Admin user created successfully');
    console.warn('🚨 SECURITY WARNING: Set ADMIN_CREATION_DISABLED=true in .env IMMEDIATELY');

    return NextResponse.json({
      message: 'Admin user created successfully!',
      security: {
        warning: 'CRITICAL: Set ADMIN_CREATION_DISABLED=true in your .env file immediately',
        instructions: 'Add this line to .env: ADMIN_CREATION_DISABLED=true'
      },
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json(
      { message: 'Failed to create admin user', error: String(error) },
      { status: 500 }
    );
  }
}
