import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/conversations/[id]/update-ai-mode - Update AI mode
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
    const body = await req.json();
    const { aiMode } = body;

    if (!aiMode || !['auto', 'copilot', 'manual'].includes(aiMode)) {
      return NextResponse.json(
        { message: 'Invalid AI mode. Must be auto, copilot, or manual.' },
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

    // Update AI mode and ensure AI is enabled
    // When user selects a mode, they want AI to be active
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        aiMode,
        aiEnabled: true  // Always enable AI when changing mode
      },
    });

    return NextResponse.json({
      message: 'AI mode updated successfully',
      aiMode,
      aiEnabled: true
    });
  } catch (error) {
    console.error('Error updating AI mode:', error);
    return NextResponse.json(
      { message: 'Failed to update AI mode' },
      { status: 500 }
    );
  }
}
