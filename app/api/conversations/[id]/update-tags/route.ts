import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/conversations/[id]/update-tags - Update conversation tags
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
    const { tags } = body;

    // Validate tags
    if (!Array.isArray(tags)) {
      return NextResponse.json(
        { message: 'Tags must be an array' },
        { status: 400 }
      );
    }

    // Ensure all tags are strings
    const validTags = tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0);

    // Limit to 10 tags max
    if (validTags.length > 10) {
      return NextResponse.json(
        { message: 'Maximum 10 tags allowed' },
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

    // Update tags (stored as JSON string)
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { tags: JSON.stringify(validTags) },
    });

    return NextResponse.json({
      message: 'Tags updated successfully',
      tags: validTags
    });
  } catch (error) {
    console.error('Error updating tags:', error);
    return NextResponse.json(
      { message: 'Failed to update tags' },
      { status: 500 }
    );
  }
}
