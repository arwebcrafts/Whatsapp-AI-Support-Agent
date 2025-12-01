import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const item = await prisma.knowledgeBase.findUnique({
      where: { id: params.id },
    });

    if (!item || item.userId !== user.id) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { message: "Content is required" },
        { status: 400 }
      );
    }

    const updatedItem = await prisma.knowledgeBase.update({
      where: { id: params.id },
      data: { content },
    });

    return NextResponse.json({ item: updatedItem }, { status: 200 });
  } catch (error) {
    console.error("Update knowledge error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const item = await prisma.knowledgeBase.findUnique({
      where: { id: params.id },
    });

    if (!item || item.userId !== user.id) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    await prisma.knowledgeBase.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete knowledge error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
