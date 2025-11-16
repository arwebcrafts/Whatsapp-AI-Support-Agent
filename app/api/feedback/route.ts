import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveConversationAnalytics } from "@/lib/analytics-service";

/**
 * POST - Submit feedback for a conversation or message
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
    const {
      conversationId,
      agentId,
      messageId,
      rating,
      feedbackType,
      feedbackTags,
      comment,
      wasHelpful,
      wasAccurate,
      wasPolite
    } = body;

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

    // Create feedback
    const feedback = await prisma.agentFeedback.create({
      data: {
        conversationId,
        agentId: agentId || conversation.agentId,
        userId: user.id,
        messageId,
        rating: rating ? parseInt(rating) : null,
        feedbackType: feedbackType || (rating >= 4 ? 'positive' : rating >= 2 ? 'neutral' : 'negative'),
        feedbackTags: feedbackTags ? JSON.stringify(feedbackTags) : null,
        comment,
        wasHelpful: wasHelpful !== undefined ? wasHelpful : true,
        wasAccurate: wasAccurate !== undefined ? wasAccurate : true,
        wasPolite: wasPolite !== undefined ? wasPolite : true
      }
    });

    // Update conversation analytics with feedback
    if (rating) {
      await prisma.conversationAnalytics.updateMany({
        where: { conversationId },
        data: {
          customerSatisfaction: rating
        }
      });

      // Recalculate analytics
      await saveConversationAnalytics(conversationId);
    }

    return NextResponse.json({
      message: "Feedback submitted successfully",
      feedback,
      success: true
    }, { status: 201 });
  } catch (error) {
    console.error("Submit feedback error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET - Get feedback for conversations
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
    const conversationId = searchParams.get('conversationId');
    const agentId = searchParams.get('agentId');

    const where: any = { userId: user.id };
    if (conversationId) where.conversationId = conversationId;
    if (agentId) where.agentId = agentId;

    const feedback = await prisma.agentFeedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return NextResponse.json({ feedback }, { status: 200 });
  } catch (error) {
    console.error("Get feedback error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
