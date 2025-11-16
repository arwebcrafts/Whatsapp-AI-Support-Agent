import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET - Get performance metrics for an agent
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
    const periodType = searchParams.get('periodType') || 'daily'; // 'daily', 'weekly', 'monthly'

    if (!agentId) {
      return NextResponse.json(
        { message: "Agent ID is required" },
        { status: 400 }
      );
    }

    // Get performance metrics
    const performance = await prisma.agentPerformance.findMany({
      where: {
        agentId,
        userId: user.id,
        periodType
      },
      orderBy: {
        period: 'desc'
      },
      take: 30 // Last 30 periods
    });

    // Get learning log
    const learningLog = await prisma.agentLearningLog.findMany({
      where: {
        agentId,
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    // Calculate trends
    let trends = null;
    if (performance.length >= 2) {
      const latest = performance[0];
      const previous = performance[1];

      trends = {
        resolutionRate: latest.resolutionRate && previous.resolutionRate
          ? latest.resolutionRate - previous.resolutionRate
          : null,
        satisfaction: latest.averageSatisfaction && previous.averageSatisfaction
          ? latest.averageSatisfaction - previous.averageSatisfaction
          : null,
        sentiment: latest.averageSentiment && previous.averageSentiment
          ? latest.averageSentiment - previous.averageSentiment
          : null,
        responseTime: latest.avgResponseTime && previous.avgResponseTime
          ? previous.avgResponseTime - latest.avgResponseTime // Negative is better
          : null
      };
    }

    return NextResponse.json({
      performance,
      learningLog,
      trends,
      latest: performance[0] || null
    }, { status: 200 });
  } catch (error) {
    console.error("Get performance error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
