import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { whatsappServiceFixed } from '@/lib/whatsapp-service-fixed';
import { prisma } from '@/lib/prisma';
import { getPlanLimits } from '@/lib/plan-limits';
import { checkRateLimit, RateLimitPresets } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  // SECURITY: Rate limit to prevent message spam abuse
  const rateLimit = checkRateLimit(req, {
    maxRequests: 60, // 60 messages per minute per IP
    windowMs: 60 * 1000,
    message: 'Too many messages sent. Please slow down.',
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

    const body = await req.json();
    const { conversationId, message } = body;

    if (!conversationId || !message) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // CRITICAL: Check user limits before sending (trial, subscription, message limits)
    const { canUserSendMessage } = await import('@/lib/trial-checker');
    const canSend = await canUserSendMessage(user.id);

    if (!canSend.allowed) {
      return NextResponse.json(
        {
          message: canSend.reason,
          requiresUpgrade: true,
          limitReached: true
        },
        { status: 403 }
      );
    }

    // Get conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || conversation.userId !== user.id) {
      return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
    }

    if (!conversation.agentId) {
      return NextResponse.json({ message: 'Agent not configured for this conversation' }, { status: 400 });
    }

    // Send message
    const remoteJid = `${conversation.customerPhone}@s.whatsapp.net`;
    await whatsappServiceFixed.sendMessage(conversation.agentId, remoteJid, message);

    // Save message
    await prisma.message.create({
      data: {
        conversationId,
        senderType: 'user',
        messageText: message,
        messageType: 'text',
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // CRITICAL: Increment message counter for manual messages
    const currentMonth = new Date().toISOString().slice(0, 7);
    const usage = await prisma.messageUsage.findUnique({
      where: {
        userId_month: {
          userId: user.id,
          month: currentMonth,
        },
      },
    });

    if (usage) {
      await prisma.messageUsage.update({
        where: { id: usage.id },
        data: { messagesUsed: { increment: 1 } },
      });
    } else {
      // Create usage record if it doesn't exist - use user's current plan limits
      const userPlanLimits = getPlanLimits(user.planType || 'starter');
      await prisma.messageUsage.create({
        data: {
          userId: user.id,
          month: currentMonth,
          messagesUsed: 1,
          messageLimit: userPlanLimits.messageLimit,
        },
      });
    }

    return NextResponse.json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { message: 'Failed to send message' },
      { status: 500 }
    );
  }
}
