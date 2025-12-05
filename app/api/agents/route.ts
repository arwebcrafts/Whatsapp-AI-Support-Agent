import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlanLimits } from "@/lib/plan-limits";

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

    const agents = await prisma.agent.findMany({
      where: { userId: user.id },
      include: {
        whatsappConnection: true,
        _count: {
          select: {
            conversations: true,
            agentKnowledge: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ agents });
  } catch (error) {
    console.error("Get agents error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const { name, description, businessType, aiTone, knowledgeContent } = body;

    if (!name) {
      return NextResponse.json(
        { message: "Agent name is required" },
        { status: 400 }
      );
    }

    // CRITICAL: Check agent creation limit based on user's plan
    const existingAgents = await prisma.agent.count({
      where: { userId: user.id },
    });

    // Get plan-specific limits: Starter=1, Professional=3, Business=10
    const planLimits = getPlanLimits(user.planType || 'starter');
    const maxAgents = planLimits.agentLimit;

    if (existingAgents >= maxAgents) {
      // Determine if user should upgrade
      const shouldUpgrade = user.planType === 'starter' || user.planType === 'professional';

      return NextResponse.json({
        message: `You've reached your ${user.planType} plan limit of ${maxAgents} agent${maxAgents > 1 ? 's' : ''}. ${shouldUpgrade ? 'Upgrade to get more agents!' : 'Please delete an existing agent to create a new one.'}`,
        requiresUpgrade: shouldUpgrade,
        currentCount: existingAgents,
        maxCount: maxAgents,
        currentPlan: user.planType,
      }, { status: 403 });
    }

    // Create agent
    const agent = await prisma.agent.create({
      data: {
        userId: user.id,
        name,
        description,
        businessType: businessType || "general",
        aiTone: aiTone || "friendly",
        isActive: true,
      },
    });

    // If knowledge content provided, create knowledge base and link it
    if (knowledgeContent && knowledgeContent.trim()) {
      const knowledge = await prisma.knowledgeBase.create({
        data: {
          userId: user.id,
          title: `${name} - Default Knowledge`,
          content: knowledgeContent,
          sourceType: "manual",
        },
      });

      // Link knowledge to agent
      await prisma.agentKnowledge.create({
        data: {
          agentId: agent.id,
          knowledgeId: knowledge.id,
        },
      });
    }

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    console.error("Create agent error:", error);

    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    const errorDetails = {
      message: "Failed to create agent",
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    };

    console.error("Detailed error:", errorDetails);

    return NextResponse.json(
      {
        message: "Failed to create agent",
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
