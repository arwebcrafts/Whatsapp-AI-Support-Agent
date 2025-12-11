import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getOpenAIClient, estimateTokens } from '@/lib/openai-client';
import { TokenUsageService } from '@/lib/token-usage-service';
import { IntentDetector, EscalationManager } from '@/lib/intent-detector';

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

    // CRITICAL: AI suggestions only work in COPILOT mode
    const aiMode = conversation.aiMode || 'auto';
    if (aiMode !== 'copilot') {
      return NextResponse.json(
        {
          message: 'AI suggestions are only available in Copilot mode. Please switch to Copilot mode to use this feature.',
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

    // Get the last customer message
    const lastCustomerMessage = conversation.messages
      .filter(msg => msg.senderType === 'customer')
      .slice(-1)[0]?.messageText || 'No messages yet';

    // Get agent information
    const agentName = conversation.agent?.name || 'Support Agent';
    const businessType = conversation.agent?.businessType || 'customer service';
    const aiTone = conversation.agent?.aiTone || 'friendly';

    // ENHANCEMENT: Detect customer intent
    const conversationHistoryArray = conversation.messages.map(msg => msg.messageText || '');
    const intent = IntentDetector.detectIntent(lastCustomerMessage, conversationHistoryArray);

    // Check available features
    const hasProducts = await prisma.product.count({ where: { userId: user.id } }) > 0;
    const hasAppointments = false; // Will be true when appointments system added
    const hasOrders = false; // Will be true when orders system added

    // Check if escalation needed
    const messageCount = conversation.messages.filter(m => m.senderType === 'customer').length;
    const escalationCheck = IntentDetector.shouldEscalate(
      messageCount,
      intent.intent === 'complaint',
      false // Could track AI failures in future
    );

    // Generate base system prompt
    let systemPrompt = `You are ${agentName}, a ${aiTone} ${businessType} representative helping customers.

YOUR ROLE:
- Agent Name: ${agentName}
- Business Type: ${businessType}
- Communication Tone: ${aiTone}

KNOWLEDGE BASE:
${knowledgeContext || 'No specific knowledge provided.'}

FREQUENTLY ASKED QUESTIONS:
${faqContext || 'No FAQs available.'}

CONVERSATION HISTORY:
${conversationHistory}

CURRENT TASK:
The customer just said: "${lastCustomerMessage}"

Generate a helpful, professional response that DIRECTLY addresses what the customer just said. Use the knowledge base and FAQs when relevant. Be specific and personalized - avoid generic responses. Keep it concise and ${aiTone}.`;

    // ENHANCEMENT: Add intent-specific instructions to system prompt
    systemPrompt = IntentDetector.getEnhancedPrompt(
      systemPrompt,
      intent,
      hasProducts,
      hasAppointments,
      hasOrders
    );

    // Add product context if customer is asking about products
    if (intent.intent === 'product_inquiry' && hasProducts) {
      const products = await prisma.product.findMany({
        where: { userId: user.id },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      if (products.length > 0) {
        const productContext = products.map(p =>
          `Product: ${p.name}${p.brand ? ` by ${p.brand}` : ''}
Price: ${p.currency} ${p.price || 'Contact for pricing'}
${p.inStock ? '✅ In Stock' : '❌ Out of Stock'}
${p.description ? `Description: ${p.description.substring(0, 200)}...` : ''}`
        ).join('\n\n');

        systemPrompt += `\n\nAVAILABLE PRODUCTS:\n${productContext}`;
      }
    }


    // Estimate tokens for quota check
    const estimatedInputTokens = estimateTokens(systemPrompt + 'Please suggest a response to the customer.');
    const estimatedOutputTokens = 300; // max_tokens setting
    const estimatedTotalTokens = estimatedInputTokens + estimatedOutputTokens;

    // Check token quota
    const quotaCheck = await TokenUsageService.checkQuota(user.id, estimatedTotalTokens);
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          message: quotaCheck.reason,
          usage: quotaCheck.usage,
        },
        { status: 429 }
      );
    }

    // Check rate limit
    const rateLimitCheck = await TokenUsageService.checkRateLimit(user.id);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { message: rateLimitCheck.reason },
        { status: 429 }
      );
    }

    // Get singleton OpenAI client
    const openai = getOpenAIClient();

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

    // Track actual token usage
    const actualInputTokens = completion.usage?.prompt_tokens || estimatedInputTokens;
    const actualOutputTokens = completion.usage?.completion_tokens || estimateTokens(suggestion);
    await TokenUsageService.trackUsage(user.id, actualInputTokens, actualOutputTokens);

    // ENHANCEMENT: Check if AI is confused and suggest escalation
    const aiConfused = EscalationManager.detectAIConfusion(suggestion);
    const shouldEscalate = escalationCheck.shouldEscalate || intent.shouldEscalate || aiConfused;

    // Return enhanced response with intent and escalation info
    return NextResponse.json({
      suggestion,
      metadata: {
        intent: intent.intent,
        confidence: intent.confidence,
        shouldEscalate,
        escalationReason: escalationCheck.reason || intent.escalationReason,
        suggestedAction: intent.suggestedAction,
        hasProducts,
        messageCount,
      }
    });
  } catch (error) {
    console.error('Error generating suggestion:', error);
    return NextResponse.json(
      { message: 'Failed to generate suggestion' },
      { status: 500 }
    );
  }
}
