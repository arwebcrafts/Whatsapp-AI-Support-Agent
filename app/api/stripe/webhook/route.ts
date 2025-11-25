import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { message: "No signature" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { message: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { message: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const planType = session.metadata?.planType;
  const planInterval = session.metadata?.planInterval;

  if (!userId || !planType) return;

  // Determine message limit based on plan
  const messageLimits: Record<string, number> = {
    starter: 2000,
    professional: 5000,
    business: 12000,
  };

  const messageLimit = messageLimits[planType] || 2000;
  const isLifetime = planInterval === "lifetime";

  // CRITICAL FIX: Store Stripe customer ID for subscription management
  const stripeCustomerId = session.customer as string;

  // Update user subscription
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: isLifetime ? "lifetime" : "active",
      planType,
      stripeCustomerId, // ← Fix: Now storing customer ID
    },
  });

  // Update or create message usage
  const currentMonth = new Date().toISOString().slice(0, 7);
  const existingUsage = await prisma.messageUsage.findUnique({
    where: {
      userId_month: {
        userId,
        month: currentMonth,
      },
    },
  });

  if (existingUsage) {
    await prisma.messageUsage.update({
      where: { id: existingUsage.id },
      data: { messageLimit },
    });
  } else {
    await prisma.messageUsage.create({
      data: {
        userId,
        month: currentMonth,
        messagesUsed: 0,
        messageLimit,
      },
    });
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) return;

  // Update subscription status
  const status = subscription.status === "active" ? "active" : "cancelled";

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: status,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: "cancelled",
    },
  });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) return;

  // Ensure subscription is active
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: "active",
    },
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) return;

  // Mark subscription as past_due or cancelled
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: "cancelled",
    },
  });
}
