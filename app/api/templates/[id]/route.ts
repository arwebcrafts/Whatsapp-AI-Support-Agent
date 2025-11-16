import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/templates/[id] - Update a template
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
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const templateId = params.id;

    // Verify template belongs to user
    const existingTemplate = await prisma.messageTemplate.findFirst({
      where: {
        id: templateId,
        userId: user.id,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { message: 'Template not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, category, message, isActive } = body;

    const template = await prisma.messageTemplate.update({
      where: { id: templateId },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(message && { message }),
        ...(typeof isActive === 'boolean' && { isActive }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { message: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE /api/templates/[id] - Delete a template
export async function DELETE(
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

    const templateId = params.id;

    // Verify template belongs to user
    const existingTemplate = await prisma.messageTemplate.findFirst({
      where: {
        id: templateId,
        userId: user.id,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { message: 'Template not found' },
        { status: 404 }
      );
    }

    await prisma.messageTemplate.delete({
      where: { id: templateId },
    });

    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { message: 'Failed to delete template' },
      { status: 500 }
    );
  }
}

// POST /api/templates/[id]/use - Increment usage count
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

    const templateId = params.id;

    const template = await prisma.messageTemplate.update({
      where: {
        id: templateId,
        userId: user.id,
      },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error incrementing usage count:', error);
    return NextResponse.json(
      { message: 'Failed to increment usage count' },
      { status: 500 }
    );
  }
}
