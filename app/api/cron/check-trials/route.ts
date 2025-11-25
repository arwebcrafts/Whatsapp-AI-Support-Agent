import { NextRequest, NextResponse } from "next/server";
import { checkAndExpireTrials } from "@/lib/trial-checker";

/**
 * Cron endpoint to check and expire trials
 *
 * Set up a cron job to hit this endpoint daily:
 * - Vercel: Use Vercel Cron Jobs
 * - Other platforms: Use external cron service like cron-job.org
 *
 * Add authorization header for security:
 * Authorization: Bearer YOUR_CRON_SECRET
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // CRITICAL: CRON_SECRET must be set - no default fallback for security
    if (!cronSecret) {
      console.error("❌ CRON_SECRET environment variable is not set!");
      return NextResponse.json(
        { message: "Server configuration error" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await checkAndExpireTrials();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Allow POST as well
export async function POST(req: NextRequest) {
  return GET(req);
}
