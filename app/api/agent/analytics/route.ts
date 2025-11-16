import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET - Get analytics for agent or conversations
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');
    const conversationId = searchParams.get('conversationId');
    const timeframe = searchParams.get('timeframe') || '7d'; // 7d, 30d, 90d, all

    // Get date range based on timeframe
    const now = new Date();
    let startDate: Date | undefined;

    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = undefined;
    }

    const where: any = { userId: user.id };
    if (agentId) where.agentId = agentId;
    if (conversationId) where.conversationId = conversationId;
    if (startDate) where.createdAt = { gte: startDate };

    // Get analytics
    const analytics = await prisma.conversationAnalytics.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Calculate summary stats
    const totalConversations = analytics.length;
    const successfulConversations = analytics.filter(a => a.wasSuccessful).length;
    const averageSatisfaction = analytics
      .filter(a => a.customerSatisfaction !== null)
      .reduce((sum, a) => sum + (a.customerSatisfaction || 0), 0) /
      (analytics.filter(a => a.customerSatisfaction !== null).length || 1);
    const averageSentiment = analytics
      .reduce((sum, a) => sum + (a.sentimentScore || 0), 0) / (totalConversations || 1);
    const averageResponseTime = analytics
      .filter(a => a.avgResponseTime !== null)
      .reduce((sum, a) => sum + (a.avgResponseTime || 0), 0) /
      (analytics.filter(a => a.avgResponseTime !== null).length || 1);
    const resolutionRate = totalConversations > 0
      ? (successfulConversations / totalConversations) * 100
      : 0;

    return NextResponse.json({
      analytics,
      summary: {
        totalConversations,
        successfulConversations,
        successRate: resolutionRate,
        averageSatisfaction: parseFloat(averageSatisfaction.toFixed(2)),
        averageSentiment: parseFloat(averageSentiment.toFixed(2)),
        averageResponseTime: Math.round(averageResponseTime)
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Get analytics error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
