import { NextResponse } from "next/server";

// In-memory usage tracking (resets on server restart)
// In production, you'd want to use Redis or database
let usageStats = {
  today: 0,
  thisMonth: 0,
  cacheHits: 0,
  cacheMisses: 0,
  errors: 0,
  lastReset: new Date().toDateString(),
  lastFetch: null,
};

export async function GET() {
  try {
    // Reset daily counter if it's a new day
    const today = new Date().toDateString();
    if (usageStats.lastReset !== today) {
      usageStats.today = 0;
      usageStats.lastReset = today;
    }

    // Reset monthly counter if it's a new month
    const currentMonth = new Date().getMonth();
    const lastResetMonth = new Date(usageStats.lastReset).getMonth();
    if (currentMonth !== lastResetMonth) {
      usageStats.thisMonth = 0;
    }

    return NextResponse.json({
      success: true,
      ...usageStats,
    });
  } catch (error) {
    console.error("Error getting Sheets usage:", error);
    return NextResponse.json(
      { error: "Failed to get usage data" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { action, increment = 1 } = await request.json();

    // Reset daily counter if it's a new day
    const today = new Date().toDateString();
    if (usageStats.lastReset !== today) {
      usageStats.today = 0;
      usageStats.lastReset = today;
    }

    switch (action) {
      case "increment_usage":
        usageStats.today += increment;
        usageStats.thisMonth += increment;
        usageStats.cacheMisses += increment;
        usageStats.lastFetch = new Date().toISOString();
        break;

      case "increment_cache_hit":
        usageStats.cacheHits += increment;
        break;

      case "increment_error":
        usageStats.errors += increment;
        break;

      case "reset_daily":
        usageStats.today = 0;
        usageStats.lastReset = today;
        break;

      case "reset_all":
        usageStats = {
          today: 0,
          thisMonth: 0,
          cacheHits: 0,
          cacheMisses: 0,
          errors: 0,
          lastReset: today,
          lastFetch: null,
        };
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Action ${action} completed`,
      ...usageStats,
    });
  } catch (error) {
    console.error("Error updating Sheets usage:", error);
    return NextResponse.json(
      { error: "Failed to update usage data" },
      { status: 500 }
    );
  }
}


