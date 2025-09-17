// Google Sheets API Protection Utilities

const DAILY_LIMIT = 100; // Conservative daily limit
const EMERGENCY_LIMIT = 90; // Emergency stop at 90%

export class SheetsApiProtection {
  static async checkUsageLimit() {
    try {
      const response = await fetch("/api/admin/sheets-usage");
      if (!response.ok) return true; // Allow on error

      const data = await response.json();
      const usagePercentage = (data.today / DAILY_LIMIT) * 100;

      // Emergency stop at 90% usage
      if (usagePercentage >= EMERGENCY_LIMIT) {
        console.warn(
          `🚨 EMERGENCY STOP: Sheets API usage at ${usagePercentage.toFixed(
            1
          )}%`
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking API usage limit:", error);
      return true; // Allow on error to avoid breaking the app
    }
  }

  static async trackError() {
    try {
      await fetch("/api/admin/sheets-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "increment_error" }),
      });
    } catch (trackingError) {
      console.warn("Failed to track API error:", trackingError);
    }
  }

  static getEmergencyFallbackData() {
    return {
      success: true,
      products: [], // Empty products to avoid showing stale data
      cached: false,
      totalProducts: 0,
      message: "External products temporarily disabled due to API usage limits",
      emergencyMode: true,
    };
  }
}

export default SheetsApiProtection;



