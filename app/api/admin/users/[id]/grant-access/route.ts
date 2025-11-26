import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Grant admin portal access to a user
 * POST /api/admin/users/[id]/grant-access
 *
 * This gives the user:
 * - Admin role (access to admin portal)
 * - Admin Access plan (unlimited limits)
 * - Lifetime subscription status
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is logged in
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (adminUser?.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const userId = params.id;

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Grant admin access
    await prisma.user.update({
      where: { id: userId },
      data: {
        role: 'admin',
        planType: 'admin_access',
        subscriptionStatus: 'lifetime',
        trialEndsAt: null, // Remove trial expiry
      },
    });

    console.log(`✅ Admin access granted to ${targetUser.email} by ${session.user.email}`);

    return NextResponse.json(
      {
        success: true,
        message: `Admin access granted successfully to ${targetUser.email}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error granting admin access:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
