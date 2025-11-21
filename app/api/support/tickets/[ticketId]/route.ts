import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/support/tickets/[ticketId]
 * Get a specific ticket with all messages
 */
export async function GET(
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

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.ticketId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
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
        }
      }
    });

    if (!ticket) {
      return NextResponse.json(
        { message: "Ticket not found" },
        { status: 404 }
      );
    }

    // Check permissions: users can only see their own tickets, admins can see all
    if (user.role !== 'admin' && ticket.userId !== user.id) {
      return NextResponse.json(
        { message: "You don't have permission to view this ticket" },
        { status: 403 }
      );
    }

    return NextResponse.json({ ticket }, { status: 200 });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/support/tickets/[ticketId]
 * Update ticket status (admin only)
 */
export async function PATCH(
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

    // Only admins can update ticket status
    if (user.role !== 'admin') {
      return NextResponse.json(
        { message: "Only admins can update ticket status" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { status, priority, assignedToId } = body;

    const updateData: any = {};

    if (status) {
      updateData.status = status;

      // Set resolved/closed timestamps
      if (status === 'resolved' && !updateData.resolvedAt) {
        updateData.resolvedAt = new Date();
      }
      if (status === 'closed' && !updateData.closedAt) {
        updateData.closedAt = new Date();
      }
    }

    if (priority) {
      updateData.priority = priority;
    }

    if (assignedToId !== undefined) {
      updateData.assignedToId = assignedToId;
    }

    const ticket = await prisma.supportTicket.update({
      where: { id: params.ticketId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    return NextResponse.json(
      {
        message: "Ticket updated successfully",
        ticket
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/support/tickets/[ticketId]
 * Delete a ticket (admin only)
 */
export async function DELETE(
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

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { message: "Only admins can delete tickets" },
        { status: 403 }
      );
    }

    await prisma.supportTicket.delete({
      where: { id: params.ticketId }
    });

    return NextResponse.json(
      { message: "Ticket deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
