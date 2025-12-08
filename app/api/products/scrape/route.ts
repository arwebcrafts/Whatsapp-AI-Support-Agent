import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productScraper } from "@/lib/product-scraper";

// POST /api/products/scrape - Scrape product from URL
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
    const { url, agentId } = body;

    if (!url) {
      return NextResponse.json(
        { message: "Product URL is required" },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { message: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Normalize URL
    const normalizedUrl = url.trim().replace(/\/$/, '');

    // Check if product already exists
    const existingProduct = await prisma.product.findFirst({
      where: {
        userId: user.id,
        sourceUrl: normalizedUrl,
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        {
          message: "This product has already been scraped",
          product: existingProduct,
          alreadyExists: true,
        },
        { status: 200 }
      );
    }

    // Validate agent if specified
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

    // Scrape the product
    console.log(`🛍️  Scraping product from: ${normalizedUrl}`);
    const productData = await productScraper.scrapeProduct(normalizedUrl);

    // Save to database
    const product = await prisma.product.create({
      data: {
        userId: user.id,
        agentId: agentId || null,
        name: productData.name,
        description: productData.description || null,
        price: productData.price || null,
        originalPrice: productData.originalPrice || null,
        currency: productData.currency || 'USD',
        sku: productData.sku || null,
        category: productData.category || null,
        brand: productData.brand || null,
        images: productData.images || undefined,
        variants: productData.variants || undefined,
        features: productData.features || null,
        inStock: productData.inStock !== undefined ? productData.inStock : true,
        stockStatus: productData.stockStatus || 'in_stock',
        sourceUrl: normalizedUrl,
        sourceType: 'scraped',
        lastSyncedAt: new Date(),
      },
    });

    console.log(`✅ Product scraped and saved: ${product.name}`);

    return NextResponse.json({
      product,
      alreadyExists: false,
      message: `Product "${product.name}" successfully scraped and added to your catalog!`,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Product scrape error:", error);
    return NextResponse.json(
      {
        message: error.message || "Failed to scrape product. Please make sure the URL is a valid product page.",
      },
      { status: 500 }
    );
  }
}
