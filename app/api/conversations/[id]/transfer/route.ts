import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { agentRouter } from '@/lib/agent-router';
import { checkRateLimit } from '@/lib/rate-limiter';

/**
 * Transfer conversation to a different agent
 * AGENT ROUTING FEATURE: Allows manual routing/escalation between agents
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Rate limit conversation transfers
  const rateLimit = checkRateLimit(req, {
    maxRequests: 20,
    windowMs: 60 * 1000, // 20 transfers per minute
    message: 'Too many transfer requests. Please slow down.',
  });

  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const conversationId = params.id;
    const body = await req.json();
    const { agentId, reason } = body;

    if (!agentId) {
      return NextResponse.json(
        { message: 'Agent ID is required' },
        { status: 400 }
      );
    }

    // Verify conversation belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: user.id,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { message: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Verify target agent belongs to user
    const targetAgent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        userId: user.id,
        isActive: true,
      },
    });

    if (!targetAgent) {
      return NextResponse.json(
        { message: 'Target agent not found or inactive' },
        { status: 404 }
      );
    }

    // Perform transfer
    await agentRouter.transferConversation(conversationId, agentId, reason);

    // Create system message in conversation
    await prisma.message.create({
      data: {
        conversationId,
        senderType: 'system',
        messageText: `Conversation transferred to ${targetAgent.name}${reason ? `: ${reason}` : ''}`,
        messageType: 'text',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Conversation transferred successfully',
      newAgent: {
        id: targetAgent.id,
        name: targetAgent.name,
      },
    });
  } catch (error) {
    console.error('Error transferring conversation:', error);
    return NextResponse.json(
      { message: 'Failed to transfer conversation' },
      { status: 500 }
    );
  }
}
