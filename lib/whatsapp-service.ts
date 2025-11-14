import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { prisma } from './prisma';

interface WhatsAppSession {
  sock: any;
  qr: string | null;
  isConnected: boolean;
  userId: string;
}

class WhatsAppService {
  private sessions: Map<string, WhatsAppSession> = new Map();
  private authDir = path.join(process.cwd(), 'auth_sessions');

  constructor() {
    // Create auth directory if it doesn't exist
    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }
  }

  async connectWhatsApp(userId: string): Promise<{ qr: string | null; status: string }> {
    try {
      const userAuthDir = path.join(this.authDir, userId);

      if (!fs.existsSync(userAuthDir)) {
        fs.mkdirSync(userAuthDir, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(userAuthDir);
      const { version } = await fetchLatestBaileysVersion();

      const sock = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, console),
        },
        printQRInTerminal: false,
        browser: ['WhaSales AI', 'Chrome', '1.0.0'],
      });

      let qrCode: string | null = null;

      // Handle connection updates
      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          // Generate QR code as data URL
          qrCode = await QRCode.toDataURL(qr);
          const session = this.sessions.get(userId);
          if (session) {
            session.qr = qrCode;
          }
        }

        if (connection === 'close') {
          const shouldReconnect =
            (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

          if (shouldReconnect) {
            await this.connectWhatsApp(userId);
          } else {
            // Update database
            await this.updateConnectionStatus(userId, false, null);
            this.sessions.delete(userId);
          }
        } else if (connection === 'open') {
          console.log('WhatsApp connected for user:', userId);

          // Get phone number
          const phoneNumber = sock.user?.id?.split(':')[0] || '';

          // Update database
          await this.updateConnectionStatus(userId, true, phoneNumber);

          // Import previous chats
          await this.importPreviousChats(userId, sock);
        }
      });

      // Handle credentials update
      sock.ev.on('creds.update', saveCreds);

      // Handle incoming messages
      sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'notify') {
          for (const msg of messages) {
            if (!msg.key.fromMe && msg.message) {
              await this.handleIncomingMessage(userId, sock, msg);
            }
          }
        }
      });

      // Store session
      this.sessions.set(userId, {
        sock,
        qr: qrCode,
        isConnected: false,
        userId,
      });

      return {
        qr: qrCode,
        status: 'waiting_for_scan',
      };
    } catch (error) {
      console.error('WhatsApp connection error:', error);
      throw error;
    }
  }

  async importPreviousChats(userId: string, sock: any): Promise<void> {
    try {
      // Get all chats
      const chats = await sock.store?.chats?.all() || [];

      // Ask user for permission first
      await prisma.user.update({
        where: { id: userId },
        data: {
          // We'll add a field to track if user wants chat analysis
        },
      });

      // Import chats (limit to recent ones)
      for (const chat of chats.slice(0, 50)) {
        const chatId = chat.id;

        // Fetch chat messages
        const messages = await sock.loadMessages(chatId, 25);

        // Create conversation
        const whatsappConnection = await prisma.whatsAppConnection.findFirst({
          where: { userId, isConnected: true },
        });

        if (!whatsappConnection) continue;

        const conversation = await prisma.conversation.create({
          data: {
            userId,
            whatsappConnectionId: whatsappConnection.id,
            customerPhone: chatId.split('@')[0],
            customerName: chat.name || chatId.split('@')[0],
            leadScore: 'cold',
            aiEnabled: false, // Initially disabled for imported chats
          },
        });

        // Import messages
        for (const msg of messages) {
          if (msg.message) {
            const messageText = this.extractMessageText(msg);

            await prisma.message.create({
              data: {
                conversationId: conversation.id,
                senderType: msg.key.fromMe ? 'user' : 'customer',
                messageText,
                messageType: this.getMessageType(msg),
              },
            });
          }
        }

        // Analyze conversation with AI
        await this.analyzeConversationWithAI(conversation.id, userId);
      }

      console.log(`Imported ${chats.length} previous chats for user ${userId}`);
    } catch (error) {
      console.error('Error importing previous chats:', error);
    }
  }

  async analyzeConversationWithAI(conversationId: string, userId: string): Promise<void> {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 50,
          },
        },
      });

      if (!conversation || conversation.messages.length === 0) return;

      // Use OpenAI to analyze the conversation
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const chatHistory = conversation.messages
        .map(m => `${m.senderType === 'customer' ? 'Customer' : 'You'}: ${m.messageText}`)
        .join('\n');

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Analyze this WhatsApp conversation and provide:
1. Lead score (hot/warm/cold)
2. Whether this lead needs follow-up
3. Suggested next action

Conversation:
${chatHistory}

Respond in JSON format: { "leadScore": "hot|warm|cold", "needsFollowUp": boolean, "suggestedAction": "string" }`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');

      // Update conversation with AI insights
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          leadScore: analysis.leadScore || 'cold',
          aiEnabled: analysis.needsFollowUp || false,
        },
      });
    } catch (error) {
      console.error('Error analyzing conversation:', error);
    }
  }

  async handleIncomingMessage(userId: string, sock: any, msg: any): Promise<void> {
    try {
      const messageText = this.extractMessageText(msg);
      const customerPhone = msg.key.remoteJid?.split('@')[0] || '';

      if (!messageText || !customerPhone) return;

      // Find or create WhatsApp connection
      const whatsappConnection = await prisma.whatsAppConnection.findFirst({
        where: { userId, isConnected: true },
      });

      if (!whatsappConnection) return;

      // Find or create conversation
      let conversation = await prisma.conversation.findFirst({
        where: {
          userId,
          whatsappConnectionId: whatsappConnection.id,
          customerPhone,
        },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            userId,
            whatsappConnectionId: whatsappConnection.id,
            customerPhone,
            customerName: msg.pushName || customerPhone,
            leadScore: 'warm',
            aiEnabled: true,
          },
        });
      }

      // Save customer message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderType: 'customer',
          messageText,
          messageType: this.getMessageType(msg),
        },
      });

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });

      // Generate AI response if enabled
      if (conversation.aiEnabled) {
        // Check if user can send messages (trial status and limits)
        const { canUserSendMessage } = await import('./trial-checker');
        const canSend = await canUserSendMessage(userId);

        if (canSend.allowed) {
          await this.generateAIResponse(userId, conversation.id, sock, msg.key.remoteJid);
        } else {
          // Send notification to user about limit/trial
          console.log(`Cannot send AI reply for user ${userId}: ${canSend.reason}`);
        }
      }
    } catch (error) {
      console.error('Error handling incoming message:', error);
    }
  }

  async generateAIResponse(
    userId: string,
    conversationId: string,
    sock: any,
    remoteJid: string
  ): Promise<void> {
    try {
      // Check limits using trial checker
      const { canUserSendMessage } = await import('./trial-checker');
      const canSend = await canUserSendMessage(userId);

      if (!canSend.allowed) {
        console.log('Cannot generate AI response:', canSend.reason);
        return;
      }

      const currentMonth = new Date().toISOString().slice(0, 7);

      // Get conversation history
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!conversation) return;

      // Get user's knowledge base
      const knowledgeBase = await prisma.knowledgeBase.findMany({
        where: { userId },
      });

      const businessKnowledge = knowledgeBase
        .map(kb => kb.content)
        .join('\n\n');

      // Generate AI response
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const chatHistory = conversation.messages
        .reverse()
        .map(m => ({
          role: m.senderType === 'customer' ? 'user' : 'assistant',
          content: m.messageText || '',
        }));

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful sales AI agent for WhatsApp.

Business Information:
${businessKnowledge || 'No specific business information provided yet.'}

Instructions:
- Be friendly, professional, and concise
- Reply in under 100 words
- Help customers with their questions
- Try to convert leads into sales
- If you don't know something, politely say so
- Match the customer's language
- Use emojis sparingly and naturally`,
          },
          ...chatHistory,
        ],
        max_tokens: 200,
      });

      const aiReply = response.choices[0].message.content || '';

      // Send message via WhatsApp
      await sock.sendMessage(remoteJid, { text: aiReply });

      // Save AI message
      await prisma.message.create({
        data: {
          conversationId,
          senderType: 'ai',
          messageText: aiReply,
          messageType: 'text',
          tokensUsed: response.usage?.total_tokens || 0,
        },
      });

      // Update message usage
      const usage = await prisma.messageUsage.findUnique({
        where: {
          userId_month: {
            userId,
            month: currentMonth,
          },
        },
      });

      if (usage) {
        await prisma.messageUsage.update({
          where: { id: usage.id },
          data: {
            messagesUsed: { increment: 1 },
          },
        });
      } else {
        // Create usage record if it doesn't exist
        await prisma.messageUsage.create({
          data: {
            userId,
            month: currentMonth,
            messagesUsed: 1,
            messageLimit: 2000, // Default limit
          },
        });
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
    }
  }

  extractMessageText(msg: any): string {
    const message = msg.message;

    if (message?.conversation) return message.conversation;
    if (message?.extendedTextMessage?.text) return message.extendedTextMessage.text;
    if (message?.imageMessage?.caption) return message.imageMessage.caption;
    if (message?.videoMessage?.caption) return message.videoMessage.caption;

    return '';
  }

  getMessageType(msg: any): string {
    const message = msg.message;

    if (message?.conversation || message?.extendedTextMessage) return 'text';
    if (message?.imageMessage) return 'image';
    if (message?.videoMessage) return 'video';
    if (message?.audioMessage) return 'voice';
    if (message?.documentMessage) return 'document';

    return 'text';
  }

  async updateConnectionStatus(
    userId: string,
    isConnected: boolean,
    phoneNumber: string | null
  ): Promise<void> {
    try {
      const existing = await prisma.whatsAppConnection.findFirst({
        where: { userId },
      });

      if (existing) {
        await prisma.whatsAppConnection.update({
          where: { id: existing.id },
          data: {
            isConnected,
            phoneNumber,
            lastActive: new Date(),
          },
        });
      } else {
        await prisma.whatsAppConnection.create({
          data: {
            userId,
            isConnected,
            phoneNumber,
            lastActive: new Date(),
          },
        });
      }
    } catch (error) {
      console.error('Error updating connection status:', error);
    }
  }

  async disconnectWhatsApp(userId: string): Promise<void> {
    const session = this.sessions.get(userId);

    if (session?.sock) {
      await session.sock.logout();
    }

    this.sessions.delete(userId);
    await this.updateConnectionStatus(userId, false, null);

    // Remove auth files
    const userAuthDir = path.join(this.authDir, userId);
    if (fs.existsSync(userAuthDir)) {
      fs.rmSync(userAuthDir, { recursive: true, force: true });
    }
  }

  getSession(userId: string): WhatsAppSession | undefined {
    return this.sessions.get(userId);
  }

  async sendMessage(userId: string, remoteJid: string, message: string): Promise<void> {
    const session = this.sessions.get(userId);

    if (session?.sock && session.isConnected) {
      await session.sock.sendMessage(remoteJid, { text: message });
    } else {
      throw new Error('WhatsApp not connected');
    }
  }
}

// Singleton instance
export const whatsappService = new WhatsAppService();
