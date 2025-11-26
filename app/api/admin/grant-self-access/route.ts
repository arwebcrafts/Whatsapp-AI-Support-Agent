import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPlanLimits } from '@/lib/plan-limits';

/**
 * POST /api/admin/grant-self-access
 *
 * Allows an admin user to grant themselves admin_access plan
 * This is a one-time setup endpoint for the initial admin
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check if user is already an admin (role-wise)
    if (user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Only admin users can use this endpoint' },
        { status: 403 }
      );
    }

    // Grant admin_access plan
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        planType: 'admin_access',
        subscriptionStatus: 'lifetime',
        trialEndsAt: null,
      },
    });

    // Update message limits
    const planLimits = getPlanLimits('admin_access');
    const currentMonth = new Date().toISOString().slice(0, 7);

    await prisma.messageUsage.upsert({
      where: {
        userId_month: {
          userId: user.id,
          month: currentMonth,
        },
      },
      update: {
        messageLimit: planLimits.messageLimit,
      },
      create: {
        userId: user.id,
        month: currentMonth,
        messagesUsed: 0,
        messageLimit: planLimits.messageLimit,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin access granted successfully! Please refresh the page.',
      user: {
        email: updatedUser.email,
        planType: updatedUser.planType,
        subscriptionStatus: updatedUser.subscriptionStatus,
      },
    });
  } catch (error) {
    console.error('Error granting self admin access:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
