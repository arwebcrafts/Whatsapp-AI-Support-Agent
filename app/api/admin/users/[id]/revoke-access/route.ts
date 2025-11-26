import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Revoke admin portal access from a user
 * POST /api/admin/users/[id]/revoke-access
 *
 * This reverts the user to:
 * - User role (no admin access)
 * - Starter plan
 * - Trial subscription status
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

    // Revoke admin access
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 3); // 3 day trial

    await prisma.user.update({
      where: { id: userId },
      data: {
        role: 'user',
        planType: 'starter',
        subscriptionStatus: 'trial',
        trialEndsAt,
      },
    });

    console.log(`✅ Admin access revoked from ${targetUser.email} by ${session.user.email}`);

    return NextResponse.json(
      {
        success: true,
        message: `Admin access revoked successfully from ${targetUser.email}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error revoking admin access:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
