import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
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

    // Fetch conversations with pagination and optimized message loading
    const CONVERSATIONS_PER_PAGE = 20;

    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // Only load the last message for list view
        },
        agent: {
          select: { name: true, id: true }
        }
      },
      orderBy: { lastMessageAt: "desc" },
      take: CONVERSATIONS_PER_PAGE,
    });

    // Serialize data for client component
    const serializedConversations = conversations.map((conv) => ({
      id: conv.id,
      customerName: conv.customerName,
      customerPhone: conv.customerPhone,
      leadScore: conv.leadScore,
      engagementScore: conv.engagementScore,
      conversationGoal: conv.conversationGoal,
      aiEnabled: conv.aiEnabled,
      aiMode: conv.aiMode,
      notes: conv.notes,
      tags: conv.tags,
      lastMessageAt: conv.lastMessageAt.toISOString(),
      agentName: conv.agent?.name || 'Unknown',
      agentId: conv.agent?.id,
      messages: conv.messages.map((msg) => ({
        id: msg.id,
        senderType: msg.senderType,
        messageText: msg.messageText || "",
        createdAt: msg.createdAt.toISOString(),
      })),
    }));

    return NextResponse.json({ conversations: serializedConversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { message: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
