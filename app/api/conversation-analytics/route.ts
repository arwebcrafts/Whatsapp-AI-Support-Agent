import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveConversationAnalytics } from "@/lib/analytics-service";
import { runLearningCycle } from "@/lib/learning-engine";

/**
 * POST - Trigger analytics update for a conversation
 * This should be called when:
 * - A conversation is marked as complete
 * - A conversation goal is achieved
 * - A significant event occurs in the conversation
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
    const { conversationId, triggerLearning } = body;

    if (!conversationId) {
      return NextResponse.json(
        { message: "Conversation ID is required" },
        { status: 400 }
      );
    }

    // Verify conversation belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: user.id
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { message: "Conversation not found" },
        { status: 404 }
      );
    }

    // Save or update analytics
    const analyticsUpdated = await saveConversationAnalytics(conversationId);

    let learningResult = null;

    // Optionally trigger learning cycle for the agent
    if (triggerLearning && conversation.agentId) {
      learningResult = await runLearningCycle(conversation.agentId, user.id);
    }

    return NextResponse.json({
      message: "Analytics updated successfully",
      analyticsUpdated,
      learningResult,
      success: true
    }, { status: 200 });
  } catch (error) {
    console.error("Update conversation analytics error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET - Run learning cycle for all agents (admin/cron use)
 */
export async function GET(req: NextRequest) {
  try {
    // This endpoint should be protected by API key or cron secret
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');

    // Check for cron secret (set in environment variables)
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    console.log('🤖 Running automated learning cycle for all agents...');

    // Get all active agents
    const agents = await prisma.agent.findMany({
      where: { isActive: true },
      include: { user: true }
    });

    const results = [];

    for (const agent of agents) {
      try {
        // Update analytics for recent conversations
        const recentConversations = await prisma.conversation.findMany({
          where: {
            agentId: agent.id,
            lastMessageAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          select: { id: true }
        });

        // Save analytics for each conversation
        for (const conv of recentConversations) {
          await saveConversationAnalytics(conv.id);
        }

        // Run learning cycle
        const learningResult = await runLearningCycle(agent.id, agent.userId);

        results.push({
          agentId: agent.id,
          agentName: agent.name,
          conversationsAnalyzed: recentConversations.length,
          ...learningResult
        });
      } catch (error) {
        console.error(`Error processing agent ${agent.id}:`, error);
        results.push({
          agentId: agent.id,
          agentName: agent.name,
          error: 'Failed to process'
        });
      }
    }

    console.log(`✅ Automated learning cycle completed for ${agents.length} agents`);

    return NextResponse.json({
      message: "Automated learning cycle completed",
      agentsProcessed: agents.length,
      results
    }, { status: 200 });
  } catch (error) {
    console.error("Automated learning cycle error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
