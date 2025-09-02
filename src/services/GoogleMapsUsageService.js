/**
 * Google Maps Usage Monitoring Service
 * Tracks API usage and automatically disables maps when approaching limits
 */

class GoogleMapsUsageService {
  constructor() {
    this.DAILY_LIMIT = 1000; // Your set quota
    this.WARNING_THRESHOLD = 0.9; // 90%
    this.STORAGE_KEY = "gmaps_usage";
    this.DATE_KEY = "gmaps_date";
  }

  /**
   * Get current usage for today
   */
  getTodayUsage() {
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem(this.DATE_KEY);

    // Reset counter if it's a new day
    if (storedDate !== today) {
      localStorage.setItem(this.DATE_KEY, today);
      localStorage.setItem(this.STORAGE_KEY, "0");
      return 0;
    }

    return parseInt(localStorage.getItem(this.STORAGE_KEY) || "0");
  }

  /**
   * Increment usage counter
   */
  incrementUsage() {
    const currentUsage = this.getTodayUsage();
    const newUsage = currentUsage + 1;
    localStorage.setItem(this.STORAGE_KEY, newUsage.toString());

    console.log(`📊 Google Maps API Usage: ${newUsage}/${this.DAILY_LIMIT}`);

    // Log warning if approaching limit
    if (newUsage >= this.DAILY_LIMIT * this.WARNING_THRESHOLD) {
      console.warn(
        `⚠️ Google Maps usage at ${Math.round(
          (newUsage / this.DAILY_LIMIT) * 100
        )}% of daily limit`
      );
    }

    return newUsage;
  }

  /**
   * Check if maps should be disabled
   */
  shouldDisableMaps() {
    const usage = this.getTodayUsage();
    const isOverLimit = usage >= this.DAILY_LIMIT * this.WARNING_THRESHOLD;

    if (isOverLimit) {
      console.warn(
        `🚫 Maps disabled: ${usage}/${
          this.DAILY_LIMIT
        } requests used (${Math.round((usage / this.DAILY_LIMIT) * 100)}%)`
      );
    }

    return isOverLimit;
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    const usage = this.getTodayUsage();
    const percentage = Math.round((usage / this.DAILY_LIMIT) * 100);
    const remaining = Math.max(0, this.DAILY_LIMIT - usage);

    return {
      used: usage,
      limit: this.DAILY_LIMIT,
      percentage,
      remaining,
      isNearLimit: usage >= this.DAILY_LIMIT * this.WARNING_THRESHOLD,
      shouldDisable: this.shouldDisableMaps(),
    };
  }

  /**
   * Reset usage (for testing or manual reset)
   */
  resetUsage() {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.DATE_KEY);
    console.log("📊 Google Maps usage counter reset");
  }
}

// Export singleton instance
export const mapsUsageService = new GoogleMapsUsageService();
export default mapsUsageService;
