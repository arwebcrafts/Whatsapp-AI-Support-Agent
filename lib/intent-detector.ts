/**
 * AI Intent Detection & Escalation Helper
 * Detects customer intent and suggests appropriate actions
 */

export interface IntentResult {
  intent: 'appointment' | 'order' | 'product_inquiry' | 'support' | 'general' | 'complaint';
  confidence: number; // 0-1
  shouldEscalate: boolean;
  escalationReason?: string;
  suggestedAction?: string;
}

export class IntentDetector {
  /**
   * Detect customer intent from message
   */
  static detectIntent(message: string, conversationHistory?: string[]): IntentResult {
    const lowerMessage = message.toLowerCase();

    // Appointment keywords
    const appointmentKeywords = [
      'book', 'appointment', 'schedule', 'reserve', 'meeting',
      'consultation', 'visit', 'time slot', 'available', 'calendar'
    ];

    // Order keywords
    const orderKeywords = [
      'order', 'buy', 'purchase', 'cart', 'checkout', 'payment',
      'shipping', 'delivery', 'track', 'status', 'confirm order'
    ];

    // Product inquiry keywords
    const productKeywords = [
      'product', 'price', 'cost', 'how much', 'available', 'stock',
      'specification', 'features', 'details', 'show me', 'recommend'
    ];

    // Complaint/escalation keywords
    const complaintKeywords = [
      'complaint', 'angry', 'frustrated', 'terrible', 'awful', 'worst',
      'disappointed', 'unacceptable', 'refund', 'cancel', 'manager',
      'speak to human', 'real person', 'not helping', 'useless'
    ];

    // Support keywords
    const supportKeywords = [
      'help', 'issue', 'problem', 'not working', 'broken', 'error',
      'wrong', 'fix', 'support', 'technical', 'trouble'
    ];

    // Check for complaints/escalation first (highest priority)
    const complaintScore = this.calculateScore(lowerMessage, complaintKeywords);
    if (complaintScore > 0.3) {
      return {
        intent: 'complaint',
        confidence: complaintScore,
        shouldEscalate: true,
        escalationReason: 'Customer expressed frustration or requested human assistance',
        suggestedAction: 'Switch to manual mode and notify admin'
      };
    }

    // Check for appointment intent
    const appointmentScore = this.calculateScore(lowerMessage, appointmentKeywords);
    if (appointmentScore > 0.4) {
      return {
        intent: 'appointment',
        confidence: appointmentScore,
        shouldEscalate: false,
        suggestedAction: 'Collect appointment details (date, time, service)'
      };
    }

    // Check for order intent
    const orderScore = this.calculateScore(lowerMessage, orderKeywords);
    if (orderScore > 0.4) {
      return {
        intent: 'order',
        confidence: orderScore,
        shouldEscalate: false,
        suggestedAction: 'Help customer place or track order'
      };
    }

    // Check for product inquiry
    const productScore = this.calculateScore(lowerMessage, productKeywords);
    if (productScore > 0.4) {
      return {
        intent: 'product_inquiry',
        confidence: productScore,
        shouldEscalate: false,
        suggestedAction: 'Provide product information from catalog'
      };
    }

    // Check for support
    const supportScore = this.calculateScore(lowerMessage, supportKeywords);
    if (supportScore > 0.4) {
      return {
        intent: 'support',
        confidence: supportScore,
        shouldEscalate: false,
        suggestedAction: 'Help resolve issue from knowledge base'
      };
    }

    // Default: general inquiry
    return {
      intent: 'general',
      confidence: 0.5,
      shouldEscalate: false,
      suggestedAction: 'Respond naturally from knowledge base'
    };
  }

  /**
   * Calculate keyword match score
   */
  private static calculateScore(message: string, keywords: string[]): number {
    let matches = 0;
    const words = message.split(/\s+/);

    for (const keyword of keywords) {
      if (message.includes(keyword)) {
        matches++;
      }
    }

    // Normalize score between 0 and 1
    return Math.min(matches / 3, 1);
  }

  /**
   * Check if conversation should be escalated based on context
   */
  static shouldEscalate(
    messageCount: number,
    hasNegativeSentiment: boolean,
    aiFailedToResolve: boolean
  ): { shouldEscalate: boolean; reason?: string } {
    // Escalate if conversation too long without resolution
    if (messageCount > 10 && aiFailedToResolve) {
      return {
        shouldEscalate: true,
        reason: 'Conversation exceeds 10 messages without resolution'
      };
    }

    // Escalate if customer is frustrated
    if (hasNegativeSentiment) {
      return {
        shouldEscalate: true,
        reason: 'Negative customer sentiment detected'
      };
    }

    return { shouldEscalate: false };
  }

  /**
   * Generate enhanced system prompt based on intent
   */
  static getEnhancedPrompt(
    basePrompt: string,
    intent: IntentResult,
    hasProducts: boolean,
    hasAppointments: boolean,
    hasOrders: boolean
  ): string {
    let enhancement = basePrompt;

    // Add intent-specific instructions
    switch (intent.intent) {
      case 'appointment':
        if (hasAppointments) {
          enhancement += `\n\nCURRENT TASK: Customer wants to book an appointment.
- Ask for their preferred date and time
- Ask what service they need
- Confirm their name and contact
- Let them know you'll schedule it and send confirmation
- Be friendly and accommodating`;
        } else {
          enhancement += `\n\nCURRENT TASK: Customer wants to book an appointment.
- Apologize that online booking isn't available yet
- Offer to take their details manually
- Ask them to call or email for scheduling
- Provide contact information`;
        }
        break;

      case 'order':
        if (hasOrders) {
          enhancement += `\n\nCURRENT TASK: Customer is asking about orders.
- If they want to place an order, help them select products
- If they're tracking an order, ask for order number
- If confirming, ask for details to verify
- Be helpful and clear about process`;
        } else {
          enhancement += `\n\nCURRENT TASK: Customer wants to order.
- Help them understand product options
- Collect their requirements
- Let them know how to complete the purchase
- Provide pricing and availability`;
        }
        break;

      case 'product_inquiry':
        if (hasProducts) {
          enhancement += `\n\nCURRENT TASK: Customer asking about products.
- Provide accurate product information
- Share prices, features, and availability
- Suggest alternatives if needed
- Help them make informed decision`;
        }
        break;

      case 'complaint':
        enhancement += `\n\nIMPORTANT: Customer seems frustrated or wants human help.
- Acknowledge their concern with empathy
- Apologize for any inconvenience
- Let them know you're connecting them to a team member
- Ask if there's anything you can help with while they wait
- Be extremely polite and understanding`;
        break;

      case 'support':
        enhancement += `\n\nCURRENT TASK: Customer needs support.
- Understand their issue clearly
- Check knowledge base for solution
- Provide step-by-step help
- If you can't resolve, offer to escalate
- Be patient and thorough`;
        break;
    }

    return enhancement;
  }
}

/**
 * Escalation Manager
 */
export class EscalationManager {
  /**
   * Create support ticket from conversation
   */
  static async createEscalationTicket(
    conversationId: string,
    reason: string,
    customerMessage: string
  ): Promise<{ success: boolean; ticketId?: string; error?: string }> {
    try {
      // This will be called from the API route
      // For now, return structure for implementation
      return {
        success: true,
        ticketId: 'pending-implementation'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create escalation ticket'
      };
    }
  }

  /**
   * Check if message indicates AI confusion
   */
  static detectAIConfusion(aiResponse: string): boolean {
    const confusionPhrases = [
      "i don't understand",
      "i'm not sure",
      "could you clarify",
      "i don't have information",
      "i can't help with that",
      "beyond my capabilities"
    ];

    const lowerResponse = aiResponse.toLowerCase();
    return confusionPhrases.some(phrase => lowerResponse.includes(phrase));
  }

  /**
   * Generate escalation message for customer
   */
  static getEscalationMessage(reason: string): string {
    const messages = {
      frustration: "I understand you're frustrated. Let me connect you with a team member who can help you better. They'll be with you shortly.",

      complexity: "This seems like it needs special attention. I'm escalating this to our support team who can give you personalized assistance.",

      timeout: "I want to make sure you get the best help possible. Let me connect you with a human team member who can assist you further.",

      request: "Of course! I'm connecting you with a team member right now. They'll be able to help you directly.",

      default: "I'm connecting you with our support team to ensure you get the best assistance. Someone will be with you shortly."
    };

    // Match reason to appropriate message
    if (reason.toLowerCase().includes('frustrat') || reason.toLowerCase().includes('angry')) {
      return messages.frustration;
    }
    if (reason.toLowerCase().includes('complex')) {
      return messages.complexity;
    }
    if (reason.toLowerCase().includes('message') || reason.toLowerCase().includes('long')) {
      return messages.timeout;
    }
    if (reason.toLowerCase().includes('request') || reason.toLowerCase().includes('human')) {
      return messages.request;
    }

    return messages.default;
  }
}
