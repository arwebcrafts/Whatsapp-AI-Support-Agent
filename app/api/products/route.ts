import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/products - Get all products for the user
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');
    const category = searchParams.get('category');

    const where: any = { userId: user.id };
    if (agentId) where.agentId = agentId;
    if (category) where.category = category;

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Get products error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a manual product entry
export async function POST(req: NextRequest) {
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

    if (!name) {
      return NextResponse.json(
        { message: "Product name is required" },
        { status: 400 }
      );
    }

    // Validate agent belongs to user if specified
    if (agentId) {
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

    const product = await prisma.product.create({
      data: {
        userId: user.id,
        agentId: agentId || null,
        name,
        description,
        price: price ? parseFloat(price) : null,
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        currency: currency || 'USD',
        sku,
        category,
        brand,
        images: images || null,
        variants: variants || null,
        features,
        inStock: inStock !== undefined ? inStock : true,
        stockQuantity: stockQuantity ? parseInt(stockQuantity) : null,
        stockStatus: stockStatus || 'in_stock',
        sourceUrl,
        sourceType: 'manual',
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { message: "Failed to create product" },
      { status: 500 }
    );
  }
}
