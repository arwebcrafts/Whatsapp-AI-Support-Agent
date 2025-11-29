import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { whatsappServiceFixed } from '@/lib/whatsapp-service-fixed';

export async function PATCH(
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

    const { aiMode } = await req.json();
    const conversationId = params.id;

    // Validate AI mode
    if (!['auto', 'copilot', 'manual'].includes(aiMode)) {
      return NextResponse.json({ message: 'Invalid AI mode' }, { status: 400 });
    }

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

    // Update AI mode and ensure AI is enabled
    // When user selects a mode, they want AI to be active
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        aiMode,
        aiEnabled: true  // Always enable AI when changing mode
      },
    });

    // Clear any pending auto-reply timers when switching modes
    // This prevents unwanted AI responses when switching from auto to manual/copilot
    whatsappServiceFixed.clearConversationTimer(conversationId);

    return NextResponse.json({
      success: true,
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
