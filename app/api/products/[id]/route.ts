import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/products/[id] - Get single product
export async function GET(
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

    const product = await prisma.product.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Get product error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/products/[id] - Update product
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

    // Verify product belongs to user
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      name,
      description,
      price,
      originalPrice,
      currency,
      sku,
      category,
      brand,
      images,
      variants,
      features,
      inStock,
      stockQuantity,
      stockStatus,
      sourceUrl,
      agentId,
    } = body;

    // Validate agent if specified
    if (agentId !== undefined && agentId !== null) {
      const agent = await prisma.agent.findFirst({
        where: {
          id: agentId,
          userId: user.id,
        },
      });

      if (!agent) {
        return NextResponse.json(
          { message: "Agent not found or doesn't belong to you" },
          { status: 404 }
        );
      }
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: price ? parseFloat(price) : null }),
        ...(originalPrice !== undefined && { originalPrice: originalPrice ? parseFloat(originalPrice) : null }),
        ...(currency !== undefined && { currency }),
        ...(sku !== undefined && { sku }),
        ...(category !== undefined && { category }),
        ...(brand !== undefined && { brand }),
        ...(images !== undefined && { images }),
        ...(variants !== undefined && { variants }),
        ...(features !== undefined && { features }),
        ...(inStock !== undefined && { inStock }),
        ...(stockQuantity !== undefined && { stockQuantity: stockQuantity ? parseInt(stockQuantity) : null }),
        ...(stockStatus !== undefined && { stockStatus }),
        ...(sourceUrl !== undefined && { sourceUrl }),
        ...(agentId !== undefined && { agentId: agentId || null }),
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { message: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete product
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

    // Verify product belongs to user
    const product = await prisma.product.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { message: "Failed to delete product" },
      { status: 500 }
    );
  }
}
