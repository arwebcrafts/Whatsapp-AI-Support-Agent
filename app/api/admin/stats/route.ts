import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/stats - Get platform statistics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (user?.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get platform stats
    const [
      totalUsers,
      activeUsers,
      trialUsers,
      totalAgents,
      totalConversations,
      totalMessages,
      activeConnections,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Active paid users
      prisma.user.count({
        where: {
          subscriptionStatus: { in: ['active', 'lifetime'] },
        },
      }),

      // Trial users
      prisma.user.count({
        where: {
          subscriptionStatus: 'trial',
        },
      }),

      // Total agents
      prisma.agent.count(),

      // Total conversations
      prisma.conversation.count(),

      // Total messages
      prisma.message.count(),

      // Active WhatsApp connections
      prisma.whatsAppConnection.count({
        where: {
          isConnected: true,
        },
      }),
    ]);

    // Get this month's message usage
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyUsage = await prisma.messageUsage.aggregate({
      where: {
        month: currentMonth,
      },
      _sum: {
        messagesUsed: true,
      },
    });

    // Get revenue estimate (based on subscriptions)
    const planRevenue = {
      starter: 29,
      professional: 99,
      business: 299,
    };

    const subscriptionBreakdown = await prisma.user.groupBy({
      by: ['planType'],
      where: {
        subscriptionStatus: { in: ['active', 'lifetime'] },
      },
      _count: true,
    });

    let estimatedMRR = 0;
    subscriptionBreakdown.forEach((sub) => {
      const plan = sub.planType as keyof typeof planRevenue;
      estimatedMRR += (planRevenue[plan] || 0) * sub._count;
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        activeUsers,
        trialUsers,
        totalAgents,
        totalConversations,
        totalMessages,
        activeConnections,
        monthlyMessages: monthlyUsage._sum.messagesUsed || 0,
        estimatedMRR,
        subscriptionBreakdown,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { message: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
