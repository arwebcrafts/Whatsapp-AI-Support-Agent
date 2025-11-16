import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/analytics - Get user's analytics data
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Get total messages count
    const totalMessages = await prisma.message.count({
      where: {
        conversation: {
          userId: user.id,
        },
      },
    });

    // Get total conversations
    const totalConversations = await prisma.conversation.count({
      where: { userId: user.id },
    });

    // Calculate response rate (AI messages / total messages)
    const aiMessages = await prisma.message.count({
      where: {
        conversation: {
          userId: user.id,
        },
        senderType: 'ai',
      },
    });

    const responseRate = totalMessages > 0 ? (aiMessages / totalMessages) * 100 : 0;

    // Get average response time (simplified - just showing 0 for now as we don't track timestamps)
    const avgResponseTime = 2.3; // Placeholder - would need message timestamps to calculate

    // Get last 7 days of messages
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyMessages = await prisma.message.groupBy({
      by: ['createdAt'],
      where: {
        conversation: {
          userId: user.id,
        },
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      _count: {
        id: true,
      },
    });

    // Group by date
    const messagesByDate: { [key: string]: number } = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      messagesByDate[dateStr] = 0;
    }

    dailyMessages.forEach((msg) => {
      const dateStr = new Date(msg.createdAt).toISOString().split('T')[0];
      if (messagesByDate[dateStr] !== undefined) {
        messagesByDate[dateStr] += msg._count.id;
      }
    });

    const chartData = Object.entries(messagesByDate).map(([date, count]) => ({
      date,
      count,
    }));

    // Get agent performance
    const agents = await prisma.agent.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            conversations: true,
          },
        },
      },
      orderBy: {
        conversations: {
          _count: 'desc',
        },
      },
      take: 3,
    });

    const agentPerformance = await Promise.all(
      agents.map(async (agent) => {
        const messages = await prisma.message.count({
          where: {
            conversation: {
              agentId: agent.id,
            },
          },
        });

        const aiMsgs = await prisma.message.count({
          where: {
            conversation: {
              agentId: agent.id,
            },
            senderType: 'ai',
          },
        });

        const rate = messages > 0 ? (aiMsgs / messages) * 100 : 0;

        return {
          name: agent.name,
          messages,
          responseRate: Math.round(rate),
        };
      })
    );

    // Get conversations by lead score
    const leadDistribution = await prisma.conversation.groupBy({
      by: ['leadScore'],
      where: { userId: user.id },
      _count: {
        id: true,
      },
    });

    const stats = {
      totalMessages,
      totalConversations,
      responseRate: Math.round(responseRate * 10) / 10,
      avgResponseTime,
      chartData,
      agentPerformance,
      leadDistribution,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { message: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
