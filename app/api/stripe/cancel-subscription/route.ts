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

    if (!user || !user.stripeCustomerId) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json(
        { message: "No active subscription found" },
        { status: 404 }
      );
    }

    // Cancel subscription at period end
    await stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({ message: "Subscription will be cancelled at period end" });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      { message: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
