import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Load full conversation messages on demand (when user clicks on a conversation)
// SCALABILITY FIX: Separates message loading from conversation list to avoid N+1 queries
export async function GET(
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
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const conversationId = params.id;

    // Verify conversation belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: user.id,
      },
    });

    if (!conversation) {
      return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
    }

    // Load messages with pagination support
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await prisma.message.count({
      where: { conversationId },
    });

    return NextResponse.json({
      messages: messages.map(msg => ({
        id: msg.id,
        senderType: msg.senderType,
        messageText: msg.messageText || '',
        messageType: msg.messageType,
        createdAt: msg.createdAt.toISOString(),
      })),
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      }
    });
  } catch (error) {
    console.error('Error loading conversation messages:', error);
    return NextResponse.json(
      { message: 'Failed to load messages' },
      { status: 500 }
    );
  }
}
