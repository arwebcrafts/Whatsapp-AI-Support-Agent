import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { followUpService } from "@/lib/follow-up-service";

/**
 * Manual trigger for follow-up message processor
 * Useful for testing and admin control
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    console.log('🔔 Manual follow-up processor triggered by:', session.user.email);

    // Run follow-up processor
    await followUpService.processFollowUps();

    return NextResponse.json({
      message: "Follow-up processor executed successfully",
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error: any) {
    console.error("Follow-up processor error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to process follow-ups" },
      { status: 500 }
    );
  }
}

/**
 * Get follow-up status and statistics
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Return info about follow-up system
    return NextResponse.json({
      status: "active",
      message: "Follow-up system is running",
      checkIntervalMinutes: 60,
      scenarios: {
        no_response_3hr: "Customer stopped responding after 3-4 hours",
        no_purchase_24hr: "No purchase made after 24 hours",
        feedback_7days: "Feedback request 7 days after purchase",
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error("Follow-up status error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to get follow-up status" },
      { status: 500 }
    );
  }
}
