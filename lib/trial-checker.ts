import { prisma } from "./prisma";
import { whatsappService } from "./whatsapp-service";

/**
 * Check and enforce trial expiration
 * This should be run periodically (e.g., via cron job)
 */
export async function checkAndExpireTrials() {
  try {
    const now = new Date();

    // Find all users whose trial has expired
    const expiredTrialUsers = await prisma.user.findMany({
      where: {
        subscriptionStatus: "trial",
        trialEndsAt: {
          lte: now,
        },
      },
    });

    console.log(`Found ${expiredTrialUsers.length} expired trial users`);

    for (const user of expiredTrialUsers) {
      // Disconnect WhatsApp
      try {
        await whatsappService.disconnectWhatsApp(user.id);
      } catch (error) {
        console.error(`Error disconnecting WhatsApp for user ${user.id}:`, error);
      }

      // Update user status
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: "expired",
        },
      });

      // Disable AI for all conversations
      await prisma.conversation.updateMany({
        where: { userId: user.id },
        data: { aiEnabled: false },
      });

      console.log(`Expired trial for user ${user.email}`);
    }

    return {
      success: true,
      expiredCount: expiredTrialUsers.length,
    };
  } catch (error) {
    console.error("Error checking trials:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if user can send messages (trial not expired, subscription active, within limits)
 */
export async function canUserSendMessage(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { allowed: false, reason: "User not found" };
    }

    // Check trial expiration
    if (user.subscriptionStatus === "trial" && user.trialEndsAt) {
      if (new Date() > user.trialEndsAt) {
        return {
          allowed: false,
          reason: "Trial expired. Please upgrade to continue.",
        };
      }
    }

    // Check subscription status
    if (user.subscriptionStatus === "expired" || user.subscriptionStatus === "cancelled") {
      return {
        allowed: false,
        reason: "Subscription inactive. Please upgrade to continue.",
      };
    }

    // Check message limits
    const currentMonth = new Date().toISOString().slice(0, 7);
    const usage = await prisma.messageUsage.findUnique({
      where: {
        userId_month: {
          userId,
          month: currentMonth,
        },
      },
    });

    if (usage && usage.messagesUsed >= usage.messageLimit) {
      return {
        allowed: false,
        reason: "Monthly message limit reached. Upgrade your plan for more messages.",
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error checking user permissions:", error);
    return { allowed: false, reason: "Error checking permissions" };
  }
}
