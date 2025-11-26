import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPlanLimits } from '@/lib/plan-limits';

// PATCH /api/admin/users/[id] - Update user details
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (adminUser?.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { subscriptionStatus, planType, role } = body;

    // Build update data
    const updateData: any = {};

    if (role) {
      updateData.role = role;
    }

    if (planType) {
      updateData.planType = planType;
    }

    if (subscriptionStatus) {
      updateData.subscriptionStatus = subscriptionStatus;

      // Auto-set trialEndsAt based on subscription status
      if (subscriptionStatus === 'trial') {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 3); // 3 days trial
        updateData.trialEndsAt = trialEndsAt;
      } else if (subscriptionStatus === 'lifetime' || subscriptionStatus === 'active') {
        // Clear trial end date for lifetime/active subscriptions
        updateData.trialEndsAt = null;
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    });

    // If plan type changed, update message limits
    if (planType) {
      const planLimits = getPlanLimits(planType);
      const currentMonth = new Date().toISOString().slice(0, 7);

      // Update or create message usage record with new limits
      await prisma.messageUsage.upsert({
        where: {
          userId_month: {
            userId: params.id,
            month: currentMonth,
          },
        },
        update: {
          messageLimit: planLimits.messageLimit,
        },
        create: {
          userId: params.id,
          month: currentMonth,
          messagesUsed: 0,
          messageLimit: planLimits.messageLimit,
        },
      });
    }

    return NextResponse.json({
      user: updatedUser,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { message: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (adminUser?.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Delete user (cascades to agents, conversations, etc.)
    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { message: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
