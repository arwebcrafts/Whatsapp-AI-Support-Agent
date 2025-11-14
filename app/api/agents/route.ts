import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
