import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/faqs/[id] - Update a FAQ
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

    const faqId = params.id;

    // Verify FAQ belongs to user
    const existingFaq = await prisma.fAQ.findFirst({
      where: {
        id: faqId,
        userId: user.id,
      },
    });

    if (!existingFaq) {
      return NextResponse.json(
        { message: 'FAQ not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { question, answer, category, priority, isActive } = body;

    const faq = await prisma.fAQ.update({
      where: { id: faqId },
      data: {
        ...(question && { question }),
        ...(answer && { answer }),
        ...(category && { category }),
        ...(typeof priority === 'number' && { priority }),
        ...(typeof isActive === 'boolean' && { isActive }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ faq });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    return NextResponse.json(
      { message: 'Failed to update FAQ' },
      { status: 500 }
    );
  }
}

// DELETE /api/faqs/[id] - Delete a FAQ
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

    const faqId = params.id;

    // Verify FAQ belongs to user
    const existingFaq = await prisma.fAQ.findFirst({
      where: {
        id: faqId,
        userId: user.id,
      },
    });

    if (!existingFaq) {
      return NextResponse.json(
        { message: 'FAQ not found' },
        { status: 404 }
      );
    }

    await prisma.fAQ.delete({
      where: { id: faqId },
    });

    return NextResponse.json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return NextResponse.json(
      { message: 'Failed to delete FAQ' },
      { status: 500 }
    );
  }
}
