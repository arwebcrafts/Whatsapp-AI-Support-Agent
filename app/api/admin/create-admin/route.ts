import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// TEMPORARY ENDPOINT - DELETE AFTER CREATING ADMIN
// Only works if no admin exists yet (security measure)

export async function POST(req: NextRequest) {
  try {
    // Check if any admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { message: 'Admin user already exists. Delete this endpoint for security.' },
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

    return NextResponse.json({
      message: 'Admin user created successfully! DELETE THIS ENDPOINT NOW!',
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
