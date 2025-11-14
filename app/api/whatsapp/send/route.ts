import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { whatsappService } from '@/lib/whatsapp-service';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
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

    // Get conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || conversation.userId !== user.id) {
      return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
    }

    // Send message
    const remoteJid = `${conversation.customerPhone}@s.whatsapp.net`;
    await whatsappService.sendMessage(user.id, remoteJid, message);

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

    return NextResponse.json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { message: 'Failed to send message' },
      { status: 500 }
    );
  }
}
