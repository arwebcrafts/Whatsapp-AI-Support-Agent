import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/support/tickets/[ticketId]/messages
 * Add a message to a ticket
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Check if ticket exists
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.ticketId },
      select: { id: true, userId: true, status: true }
    });

    if (!ticket) {
      return NextResponse.json(
        { message: "Ticket not found" },
        { status: 404 }
      );
    }

    // Check permissions: users can only reply to their own tickets, admins can reply to any
    if (user.role !== 'admin' && ticket.userId !== user.id) {
      return NextResponse.json(
        { message: "You don't have permission to reply to this ticket" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { message } = body;

    // Validation
    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { message: "Message cannot be empty" },
        { status: 400 }
      );
    }

    if (message.length > 10000) {
      return NextResponse.json(
        { message: "Message must be less than 10,000 characters" },
        { status: 400 }
      );
    }

    // Determine if this is an admin response
    const isAdminResponse = user.role === 'admin' && ticket.userId !== user.id;

    // Create message and update ticket
    const newMessage = await prisma.supportMessage.create({
      data: {
        ticketId: params.ticketId,
        userId: user.id,
        message: message.trim(),
        isAdminResponse,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      }
    });

    // Update ticket status if it was resolved/closed and user is replying
    let updatedStatus = ticket.status;
    if ((ticket.status === 'resolved' || ticket.status === 'closed') && !isAdminResponse) {
      updatedStatus = 'waiting_response';
    } else if (ticket.status === 'open' && isAdminResponse) {
      updatedStatus = 'in_progress';
    }

    // Update ticket's updatedAt and potentially status
    await prisma.supportTicket.update({
      where: { id: params.ticketId },
      data: {
        status: updatedStatus,
        updatedAt: new Date(),
      }
    });

    return NextResponse.json(
      {
        message: "Message added successfully",
        supportMessage: newMessage
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding message to ticket:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
