import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runLearningCycle } from "@/lib/learning-engine";

/**
 * GET - Get insights for an agent
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
    const insightType = searchParams.get('insightType');
    const category = searchParams.get('category');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    if (!agentId) {
      return NextResponse.json(
        { message: "Agent ID is required" },
        { status: 400 }
      );
    }

    const where: any = { agentId, userId: user.id };
    if (insightType) where.insightType = insightType;
    if (category) where.category = category;
    if (activeOnly) where.isActive = true;

    const insights = await prisma.conversationInsight.findMany({
      where,
      orderBy: [
        { confidence: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Group by type
    const groupedInsights = {
      successful_patterns: insights.filter(i => i.insightType === 'successful_pattern'),
      common_questions: insights.filter(i => i.insightType === 'common_question'),
      effective_responses: insights.filter(i => i.insightType === 'effective_response'),
      customer_preferences: insights.filter(i => i.insightType === 'customer_preference'),
      performance_issues: insights.filter(i => i.insightType === 'performance_issue'),
      all: insights
    };

    return NextResponse.json({
      insights: groupedInsights,
      total: insights.length
    }, { status: 200 });
  } catch (error) {
    console.error("Get insights error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST - Trigger learning cycle to generate new insights
 */
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { agentId } = body;

    if (!agentId) {
      return NextResponse.json(
        { message: "Agent ID is required" },
        { status: 400 }
      );
    }

    // Verify agent belongs to user
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: user.id }
    });

    if (!agent) {
      return NextResponse.json(
        { message: "Agent not found" },
        { status: 404 }
      );
    }

    // Run learning cycle
    const result = await runLearningCycle(agentId, user.id);

    return NextResponse.json({
      message: "Learning cycle completed",
      insightsGenerated: result.insightsGenerated,
      performanceUpdated: result.performanceUpdated,
      success: true
    }, { status: 200 });
  } catch (error) {
    console.error("Trigger learning cycle error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update insight (approve, deactivate, etc.)
 */
export async function PATCH(req: NextRequest) {
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

    const body = await req.json();
    const { insightId, isApproved, isActive } = body;

    if (!insightId) {
      return NextResponse.json(
        { message: "Insight ID is required" },
        { status: 400 }
      );
    }

    // Verify insight belongs to user
    const insight = await prisma.conversationInsight.findFirst({
      where: { id: insightId, userId: user.id }
    });

    if (!insight) {
      return NextResponse.json(
        { message: "Insight not found" },
        { status: 404 }
      );
    }

    // Update insight
    const updatedInsight = await prisma.conversationInsight.update({
      where: { id: insightId },
      data: {
        ...(isApproved !== undefined && { isApproved }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      message: "Insight updated successfully",
      insight: updatedInsight,
      success: true
    }, { status: 200 });
  } catch (error) {
    console.error("Update insight error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
