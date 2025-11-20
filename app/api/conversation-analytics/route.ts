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
 * SECURITY: Use header-based authentication instead of query string
 * Send secret in 'X-Cron-Secret' header, never in URL
 */
export async function GET(req: NextRequest) {
  try {
    // Get secret from header (more secure than query string)
    const secret = req.headers.get('x-cron-secret') || req.headers.get('authorization')?.replace('Bearer ', '');

    // Check for cron secret (set in environment variables)
    if (!secret || secret !== process.env.CRON_SECRET) {
      console.warn('🚨 SECURITY: Unauthorized cron access attempt');
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Additional validation: check if CRON_SECRET is still the default
    if (process.env.CRON_SECRET === 'change-this-secret') {
      console.error('🚨 SECURITY: CRON_SECRET is still using default value!');
      return NextResponse.json(
        {
          message: "Server misconfiguration",
          error: "CRON_SECRET must be changed from default value"
        },
        { status: 500 }
      );
    }

    console.log('🤖 Running automated learning cycle for all agents...');

    // Pagination configuration
    const BATCH_SIZE = 50; // Process 50 agents at a time
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '0');
    const skip = page * BATCH_SIZE;

    // Get total count first
    const totalAgents = await prisma.agent.count({
      where: { isActive: true }
    });

    // Get paginated batch of agents
    const agents = await prisma.agent.findMany({
      where: { isActive: true },
      include: { user: true },
      skip,
      take: BATCH_SIZE,
      orderBy: { updatedAt: 'desc' }, // Process most recently updated first
    });

    if (agents.length === 0) {
      return NextResponse.json({
        message: page === 0 ? "No active agents found" : "No more agents to process",
        page,
        totalAgents,
        processed: 0,
        hasMore: false
      }, { status: 200 });
    }

    console.log(`📊 Processing batch ${page + 1}: ${agents.length} agents (${skip + 1}-${skip + agents.length} of ${totalAgents})`);

    const results = [];

    for (const agent of agents) {
      try {
        // Update analytics for recent conversations (optimize with select)
        const recentConversations = await prisma.conversation.findMany({
          where: {
            agentId: agent.id,
            lastMessageAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          select: { id: true },
          take: 100, // Limit conversations per agent
        });

        // Save analytics for each conversation (batch in chunks of 10)
        const ANALYTICS_BATCH = 10;
        for (let i = 0; i < recentConversations.length; i += ANALYTICS_BATCH) {
          const batch = recentConversations.slice(i, i + ANALYTICS_BATCH);
          await Promise.allSettled(
            batch.map(conv => saveConversationAnalytics(conv.id))
          );
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

    const hasMore = skip + agents.length < totalAgents;
    const nextPage = hasMore ? page + 1 : null;

    console.log(`✅ Batch ${page + 1} completed: ${agents.length} agents processed`);

    if (hasMore) {
      console.log(`⏭️  Next batch: page ${nextPage} (${totalAgents - (skip + agents.length)} agents remaining)`);
    } else {
      console.log(`🎉 All ${totalAgents} agents processed!`);
    }

    return NextResponse.json({
      message: "Automated learning cycle batch completed",
      page,
      batchSize: BATCH_SIZE,
      totalAgents,
      processed: agents.length,
      hasMore,
      nextPage,
      nextPageUrl: hasMore ? `/api/conversation-analytics?page=${nextPage}` : null,
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
