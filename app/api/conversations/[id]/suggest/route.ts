import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/conversations/[id]/suggest - Get AI suggestion for response
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const conversationId = params.id;

    // Get conversation with messages
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 20, // Last 20 messages for context
        },
        agent: {
          include: {
            agentKnowledge: {
              include: {
                knowledge: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { message: 'Conversation not found' },
        { status: 404 }
      );
    }

    // CRITICAL: AI suggestions only work in MANUAL mode
    const aiMode = conversation.aiMode || 'auto';
    if (aiMode !== 'manual') {
      return NextResponse.json(
        {
          message: 'AI suggestions are only available in Manual mode. Please switch to Manual mode to use this feature.',
          requiresModeChange: true,
          currentMode: aiMode,
        },
        { status: 403 }
      );
    }

    // CRITICAL: Check user limits (trial, subscription, message limits)
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

    // Build context from knowledge base
    const knowledgeContext = conversation.agent?.agentKnowledge
      .map((ak) => ak.knowledge.content)
      .join('\n\n');

    // Get FAQs
    const faqs = await prisma.fAQ.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      orderBy: { priority: 'desc' },
      take: 10,
    });

    const faqContext = faqs
      .map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`)
      .join('\n\n');

    // Build conversation history
    const conversationHistory = conversation.messages
      .map((msg) => {
        const role = msg.senderType === 'customer' ? 'Customer' : 'Agent';
        return `${role}: ${msg.messageText}`;
      })
      .join('\n');

    // Generate AI suggestion
    const systemPrompt = `You are a helpful customer service AI assistant.

KNOWLEDGE BASE:
${knowledgeContext || 'No specific knowledge provided.'}

FREQUENTLY ASKED QUESTIONS:
${faqContext || 'No FAQs available.'}

CONVERSATION HISTORY:
${conversationHistory}

Generate a helpful, professional response to the customer's most recent message. Keep it concise and friendly.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Please suggest a response to the customer.' },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const suggestion = completion.choices[0]?.message?.content || '';

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('Error generating suggestion:', error);
    return NextResponse.json(
      { message: 'Failed to generate suggestion' },
      { status: 500 }
    );
  }
}
