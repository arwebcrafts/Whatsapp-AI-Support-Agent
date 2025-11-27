import { prisma } from './prisma';

/**
 * Agent Router - Routes incoming messages to the appropriate agent
 *
 * ARCHITECTURE:
 * - One WhatsApp connection can serve multiple agents
 * - Routes messages based on strategy: keyword, AI-based, or sticky (remember last agent)
 * - Enables multi-agent support without needing multiple phone numbers
 */

export interface RoutingStrategy {
  type: 'keyword' | 'sticky' | 'ai' | 'default';
  config?: {
    keywords?: Record<string, string>; // { "sales": "agent-id", "support": "agent-id" }
    defaultAgentId?: string; // Fallback agent when no match
  };
}

export class AgentRouter {
  /**
   * Route incoming message to appropriate agent
   * @param userId - User ID
   * @param whatsappConnectionId - WhatsApp connection ID
   * @param customerPhone - Customer phone number
   * @param messageText - Incoming message text
   * @returns Agent ID to handle this message
   */
  async routeMessage(
    userId: string,
    whatsappConnectionId: string,
    customerPhone: string,
    messageText: string
  ): Promise<string> {
    // 1. Check if customer has an existing conversation (sticky routing)
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        userId,
        whatsappConnectionId,
        customerPhone,
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
      select: {
        agentId: true,
      },
    });

    // If customer already has a conversation, route to same agent (sticky)
    if (existingConversation && existingConversation.agentId) {
      console.log(`📌 Sticky routing: Customer ${customerPhone} → Agent ${existingConversation.agentId}`);
      return existingConversation.agentId;
    }

    // 2. Get user's routing configuration
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        agents: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!user || user.agents.length === 0) {
      throw new Error('No active agents found for user');
    }

    // 3. Try keyword-based routing
    const keywordAgent = this.routeByKeyword(messageText, user.agents);
    if (keywordAgent) {
      console.log(`🔑 Keyword routing: "${messageText}" → Agent ${keywordAgent}`);
      return keywordAgent;
    }

    // 4. Fallback to first/default agent
    const defaultAgent = user.agents[0];
    console.log(`⚡ Default routing: Customer ${customerPhone} → Agent ${defaultAgent.id}`);
    return defaultAgent.id;
  }

  /**
   * Route based on keywords in message
   * Checks if message contains routing keywords like "sales", "support", "billing"
   */
  private routeByKeyword(messageText: string, agents: any[]): string | null {
    const lowerMessage = messageText.toLowerCase();

    // Define keyword mappings (can be made configurable in database)
    const keywordMappings: Record<string, string[]> = {
      sales: ['sales', 'buy', 'purchase', 'price', 'pricing', 'cost', 'quote'],
      support: ['support', 'help', 'issue', 'problem', 'broken', 'fix', 'error'],
      technical: ['technical', 'integration', 'api', 'setup', 'install', 'configure'],
      billing: ['billing', 'payment', 'invoice', 'refund', 'subscription', 'cancel'],
    };

    // Find agent whose name/description matches keywords
    for (const agent of agents) {
      const agentNameLower = agent.name.toLowerCase();
      const agentDescLower = (agent.description || '').toLowerCase();

      // Check if message contains keywords related to this agent
      for (const [category, keywords] of Object.entries(keywordMappings)) {
        // If agent name/description contains category (e.g., "Sales Agent" contains "sales")
        if (agentNameLower.includes(category) || agentDescLower.includes(category)) {
          // Check if message contains any of the keywords for this category
          if (keywords.some(keyword => lowerMessage.includes(keyword))) {
            return agent.id;
          }
        }
      }
    }

    return null;
  }

  /**
   * AI-based routing (future enhancement)
   * Uses OpenAI to analyze message intent and route to appropriate agent
   */
  async routeByAI(messageText: string, agents: any[]): Promise<string | null> {
    // TODO: Implement AI-based routing
    // 1. Send message + agent descriptions to OpenAI
    // 2. Ask GPT to determine which agent is best suited
    // 3. Return selected agent ID
    //
    // Example prompt:
    // "Given these agents: [Sales: handles purchases, Support: handles issues]
    //  and this message: 'I want to buy your product'
    //  Which agent should handle this? Response JSON: {agentId: '...'}"

    return null;
  }

  /**
   * Transfer conversation to different agent
   * Useful for manual routing or escalation
   */
  async transferConversation(
    conversationId: string,
    newAgentId: string,
    reason?: string
  ): Promise<void> {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        agentId: newAgentId,
        notes: reason
          ? `Transferred to new agent. Reason: ${reason}`
          : 'Transferred to new agent',
      },
    });

    console.log(`↪️ Transferred conversation ${conversationId} to agent ${newAgentId}`);
  }
}

// Singleton instance
export const agentRouter = new AgentRouter();
