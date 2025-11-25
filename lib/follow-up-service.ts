/**
 * Follow-Up Messaging Service
 *
 * Automatically sends follow-up messages to re-engage customers:
 * - 3-4 hours after customer stops responding
 * - 24 hours after no purchase
 * - 7 days after purchase (feedback request)
 */

import { prisma } from './prisma';
import { whatsappServiceFixed } from './whatsapp-service-fixed';

export class FollowUpService {
  /**
   * Check all active conversations and send follow-ups where needed
   */
  async processFollowUps(): Promise<void> {
    console.log('🔄 Starting follow-up message processor...');

    try {
      const now = new Date();

      // Find conversations that need follow-up messages
      const conversations = await prisma.conversation.findMany({
        where: {
          status: 'active',
          aiEnabled: true,
        },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          agent: {
            include: {
              whatsappConnection: true,
            },
          },
        },
      });

      console.log(`📊 Checking ${conversations.length} active conversations for follow-ups...`);

      let followUpsSent = 0;

      for (const conversation of conversations) {
        try {
          // Skip if no WhatsApp connection
          if (!conversation.agent?.whatsappConnection?.isConnected) {
            continue;
          }

          // Get last message timestamp
          const lastMessageTime = new Date(conversation.lastMessageAt);
          const hoursSinceLastMessage = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60);

          // Get last message sender
          const lastMessage = conversation.messages[0];
          const lastMessageFromCustomer = lastMessage?.senderType === 'customer';

          // SCENARIO 1: Customer stopped responding (3-4 hours)
          // Only if last message was from AI and customer hasn't responded
          if (!lastMessageFromCustomer && hoursSinceLastMessage >= 3 && hoursSinceLastMessage <= 4.5) {
            // ✅ IMPROVEMENT #1: Max 2 follow-ups total (prevent spam)
            const followUpCount = conversation.messages.filter(
              m => m.senderType === 'ai' && (
                m.messageText?.toLowerCase().includes('still interested') ||
                m.messageText?.toLowerCase().includes('still thinking') ||
                m.messageText?.toLowerCase().includes('checking in') ||
                m.messageText?.toLowerCase().includes('following up') ||
                m.messageText?.toLowerCase().includes('wanted to check')
              )
            ).length;

            // Stop after 2 follow-up attempts
            if (followUpCount >= 2) {
              console.log(`⚠️ Max follow-ups reached (${followUpCount}) for conversation ${conversation.id}, skipping...`);

              // ✅ IMPROVEMENT #2: Auto-archive cold leads after 2 failed follow-ups
              if (conversation.status === 'active') {
                await prisma.conversation.update({
                  where: { id: conversation.id },
                  data: {
                    status: 'archived',
                    leadScore: 'cold',
                  },
                });
                console.log(`📦 Auto-archived cold lead: ${conversation.customerPhone}`);
              }
              continue;
            }

            const hoursSinceLastAIMessage = lastMessage ?
              (now.getTime() - new Date(lastMessage.createdAt).getTime()) / (1000 * 60 * 60) : 999;

            if (hoursSinceLastAIMessage >= 3) {
              await this.sendEngagementFollowUp(conversation, 'no_response_3hr');
              followUpsSent++;
            }
          }

          // SCENARIO 2: No purchase after 24 hours (warm lead re-engagement)
          if (!conversation.goalAchieved && hoursSinceLastMessage >= 24 && hoursSinceLastMessage <= 26) {
            const daysSinceCreation = (now.getTime() - new Date(conversation.createdAt).getTime()) / (1000 * 60 * 60 * 24);

            // Only if conversation is less than 3 days old (still warm)
            if (daysSinceCreation <= 3) {
              // ✅ IMPROVEMENT #1: Max 2 follow-ups total (prevent spam)
              const followUpCount = conversation.messages.filter(
                m => m.senderType === 'ai' && (
                  m.messageText?.toLowerCase().includes('special offer') ||
                  m.messageText?.toLowerCase().includes('still available') ||
                  m.messageText?.toLowerCase().includes('limited time') ||
                  m.messageText?.toLowerCase().includes('still interested') ||
                  m.messageText?.toLowerCase().includes('checking in')
                )
              ).length;

              // Stop after 2 follow-up attempts
              if (followUpCount >= 2) {
                console.log(`⚠️ Max follow-ups reached (${followUpCount}) for conversation ${conversation.id}, skipping 24hr follow-up...`);

                // ✅ IMPROVEMENT #2: Auto-archive cold leads
                if (conversation.status === 'active') {
                  await prisma.conversation.update({
                    where: { id: conversation.id },
                    data: {
                      status: 'archived',
                      leadScore: 'cold',
                    },
                  });
                  console.log(`📦 Auto-archived cold lead (24hr): ${conversation.customerPhone}`);
                }
                continue;
              }

              await this.sendEngagementFollowUp(conversation, 'no_purchase_24hr');
              followUpsSent++;
            }
          }

          // SCENARIO 3: Feedback request 7 days after purchase
          if (conversation.goalAchieved) {
            const daysSinceGoal = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60 * 24);

            if (daysSinceGoal >= 7 && daysSinceGoal <= 8) {
              const feedbackRequest = conversation.messages.find(
                m => m.senderType === 'ai' &&
                (m.messageText?.includes('feedback') ||
                 m.messageText?.includes('How was your experience') ||
                 m.messageText?.includes('review'))
              );

              if (!feedbackRequest) {
                await this.sendEngagementFollowUp(conversation, 'feedback_7days');
                followUpsSent++;
              }
            }
          }

        } catch (error) {
          console.error(`Error processing follow-up for conversation ${conversation.id}:`, error);
        }
      }

      console.log(`✅ Follow-up processor complete. Sent ${followUpsSent} follow-up messages.`);

    } catch (error) {
      console.error('Error in follow-up processor:', error);
    }
  }

  /**
   * Send follow-up message based on scenario
   */
  async sendEngagementFollowUp(
    conversation: any,
    scenario: 'no_response_3hr' | 'no_purchase_24hr' | 'feedback_7days'
  ): Promise<void> {
    try {
      console.log(`📬 Sending ${scenario} follow-up to ${conversation.customerPhone}...`);

      // Check user limits before sending
      const { canUserSendMessage } = await import('./trial-checker');
      const canSend = await canUserSendMessage(conversation.userId);

      if (!canSend.allowed) {
        console.log(`❌ Cannot send follow-up: ${canSend.reason}`);
        return;
      }

      // Get agent details
      const agent = conversation.agent;
      const agentName = agent?.name || 'Support';
      const businessType = agent?.businessType || '';

      // Generate contextual follow-up message
      let followUpMessage = '';

      switch (scenario) {
        case 'no_response_3hr':
          // Re-engagement after customer goes quiet
          const reEngageMessages = [
            `Hi! Just wanted to check in - are you still interested? I'm here if you have any questions! 😊`,
            `Hey there! Still thinking it over? I'm happy to help with any questions or concerns you might have.`,
            `Hi! Just following up on our conversation. Let me know if you need any more information - I'm here to help! 🙌`,
            `Hello! I noticed you might need a moment to think. No pressure at all - just wanted to let you know I'm here if you have questions!`,
          ];
          followUpMessage = reEngageMessages[Math.floor(Math.random() * reEngageMessages.length)];
          break;

        case 'no_purchase_24hr':
          // Incentive/urgency after 24 hours no purchase
          const incentiveMessages = [
            `Hi! I wanted to reach out because we have a limited-time offer that might interest you. Would you like to hear about it? 🎁`,
            `Hey! Just thought I'd check in - is there anything holding you back? Sometimes I can offer special pricing or solve concerns. Let me know! 💫`,
            `Hi there! I know you were interested earlier. Just wanted to let you know this is still available, but we're getting limited stock. Want to secure yours?`,
            `Hello! Following up on our chat. Many customers had similar questions initially - happy to address any concerns. What's on your mind? 🤔`,
            `Hi! Quick question - what would make this decision easier for you? I'm here to help! 😊`,
          ];
          followUpMessage = incentiveMessages[Math.floor(Math.random() * incentiveMessages.length)];
          break;

        case 'feedback_7days':
          // Feedback request after purchase
          const feedbackMessages = [
            `Hi! Hope you're enjoying your purchase! 🎉 We'd love to hear your feedback - how has your experience been so far?`,
            `Hey! It's been about a week since your order. How's everything going? We'd really appreciate your thoughts! 😊`,
            `Hi there! Just checking in to see how you're liking everything. Your feedback helps us serve you better! Would love to hear from you. 💬`,
            `Hello! Hope everything arrived perfectly and you're happy with your purchase! Mind sharing your experience? Your feedback means a lot to us! ⭐`,
          ];
          followUpMessage = feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)];
          break;
      }

      // Get WhatsApp connection
      const whatsappConnection = agent?.whatsappConnection;
      if (!whatsappConnection || !whatsappConnection.isConnected) {
        console.log('❌ WhatsApp not connected, skipping follow-up');
        return;
      }

      // Get WhatsApp session
      const session = whatsappServiceFixed.getSession(agent.id);
      if (!session || !session.isConnected) {
        console.log('❌ WhatsApp session not active, skipping follow-up');
        return;
      }

      // Format phone number for WhatsApp
      const remoteJid = `${conversation.customerPhone}@s.whatsapp.net`;

      // Send follow-up message
      await whatsappServiceFixed.sendMessage(agent.id, remoteJid, followUpMessage);

      // Save message to database
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderType: 'ai',
          messageText: followUpMessage,
          messageType: 'text',
        },
      });

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });

      console.log(`✅ Follow-up sent successfully!`);

    } catch (error) {
      console.error('Error sending follow-up message:', error);
    }
  }

  /**
   * Schedule periodic follow-up checks
   * Call this method every hour via cron or interval
   */
  startFollowUpScheduler(intervalMinutes: number = 60): void {
    console.log(`⏰ Starting follow-up scheduler (checking every ${intervalMinutes} minutes)...`);

    // Run immediately on start
    this.processFollowUps();

    // Then run on interval
    setInterval(() => {
      this.processFollowUps();
    }, intervalMinutes * 60 * 1000);
  }
}

// Singleton instance
export const followUpService = new FollowUpService();
