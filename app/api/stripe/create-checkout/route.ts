import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-11-20.acacia",
});

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
    const { planType, planInterval } = body; // planType: starter/professional/business, planInterval: monthly/yearly/lifetime

    // Price mapping (developer will add actual Stripe price IDs)
    const priceMap: Record<string, string> = {
      "starter_monthly": process.env.STRIPE_PRICE_STARTER_MONTHLY || "",
      "starter_yearly": process.env.STRIPE_PRICE_STARTER_YEARLY || "",
      "professional_monthly": process.env.STRIPE_PRICE_PRO_MONTHLY || "",
      "professional_yearly": process.env.STRIPE_PRICE_PRO_YEARLY || "",
      "business_monthly": process.env.STRIPE_PRICE_BUSINESS_MONTHLY || "",
      "business_yearly": process.env.STRIPE_PRICE_BUSINESS_YEARLY || "",
      "starter_lifetime": process.env.STRIPE_PRICE_LIFETIME_STARTER || "",
      "professional_lifetime": process.env.STRIPE_PRICE_LIFETIME_PRO || "",
      "business_lifetime": process.env.STRIPE_PRICE_LIFETIME_BUSINESS || "",
    };

    const priceKey = `${planType}_${planInterval}`;
    const priceId = priceMap[priceKey];

    if (!priceId) {
      return NextResponse.json(
        { message: "Invalid plan selection" },
        { status: 400 }
      );
    }

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });

      customerId = customer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: planInterval === "lifetime" ? "payment" : "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/billing?cancelled=true`,
      metadata: {
        userId: user.id,
        planType,
        planInterval,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Create checkout error:", error);
    return NextResponse.json(
      { message: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
