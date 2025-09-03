/**
 * UPI Payment Limits Helper
 * Provides information about UPI transaction limits and suggestions
 */

// Common UPI app limits (per transaction and daily)
export const UPI_LIMITS = {
  gpay: {
    name: "Google Pay",
    perTransaction: 100000,
    daily: 100000,
    description: "Most banks support up to ₹1,00,000 per transaction",
  },
  phonepe: {
    name: "PhonePe",
    perTransaction: 100000,
    daily: 100000,
    description: "Generally supports higher limits",
  },
  paytm: {
    name: "Paytm",
    perTransaction: 10000,
    daily: 20000,
    description: "Lower limits, good for smaller amounts",
  },
  bhim: {
    name: "BHIM UPI",
    perTransaction: 10000,
    daily: 20000,
    description: "Government app with standard limits",
  },
  amazonpay: {
    name: "Amazon Pay",
    perTransaction: 50000,
    daily: 100000,
    description: "Good alternative for medium amounts",
  },
};

// Bank-specific common limits
export const BANK_LIMITS = {
  sbi: { name: "State Bank of India", limit: 100000 },
  hdfc: { name: "HDFC Bank", limit: 100000 },
  icici: { name: "ICICI Bank", limit: 200000 },
  axis: { name: "Axis Bank", limit: 100000 },
  kotak: { name: "Kotak Mahindra", limit: 100000 },
  pnb: { name: "Punjab National Bank", limit: 25000 },
  canara: { name: "Canara Bank", limit: 25000 },
};

/**
 * Check if amount is within UPI limits
 * @param {number} amount - Transaction amount
 * @returns {Object} Limit check result
 */
export function checkUpiLimits(amount) {
  const numAmount = parseFloat(amount);

  // Find apps that support this amount
  const supportedApps = Object.entries(UPI_LIMITS)
    .filter(([key, limit]) => numAmount <= limit.perTransaction)
    .map(([key, limit]) => ({
      app: key,
      name: limit.name,
      limit: limit.perTransaction,
      description: limit.description,
    }))
    .sort((a, b) => b.limit - a.limit); // Sort by highest limit first

  return {
    amount: numAmount,
    isWithinCommonLimits: numAmount <= 100000,
    isWithinBasicLimits: numAmount <= 10000,
    supportedApps,
    recommendedApps: supportedApps.slice(0, 3), // Top 3 recommendations
    exceedsAllLimits: supportedApps.length === 0,
  };
}

/**
 * Get user-friendly error messages for UPI limit issues
 * @param {number} amount - Transaction amount
 * @param {string} failedApp - App that failed
 * @returns {Object} Error messages and suggestions
 */
export function getUpiLimitGuidance(amount, failedApp = null) {
  const limitCheck = checkUpiLimits(amount);

  let primaryMessage = "";
  let suggestions = [];
  let alternatives = [];

  if (limitCheck.exceedsAllLimits) {
    primaryMessage = `Amount ₹${amount} exceeds most UPI app limits.`;
    suggestions = [
      "Contact your bank to increase UPI transaction limits",
      "Consider splitting into multiple smaller transactions",
      "Use net banking or other payment methods",
      "Check if your bank supports higher limits",
    ];
  } else if (!limitCheck.isWithinCommonLimits) {
    primaryMessage = `Amount ₹${amount} may exceed some UPI app limits.`;
    suggestions = [
      "Try scanning QR code directly in your UPI app",
      "Use apps that support higher limits",
      "Check your daily transaction limit",
      "Verify your bank's UPI limits",
    ];
    alternatives = limitCheck.recommendedApps;
  } else {
    primaryMessage = "UPI payment should work with most apps.";
    suggestions = [
      "Try scanning QR code if app button fails",
      "Check your internet connection",
      "Ensure UPI PIN is set up correctly",
      "Try a different UPI app",
    ];
    alternatives = limitCheck.recommendedApps.slice(0, 2);
  }

  return {
    primaryMessage,
    suggestions,
    alternatives,
    limitCheck,
    troubleshooting: [
      "Restart your UPI app",
      "Check if UPI service is down",
      "Verify beneficiary details",
      "Contact your bank if issues persist",
    ],
  };
}

/**
 * Generate user-friendly limit information for display
 * @param {number} amount - Transaction amount
 * @returns {Object} Display information
 */
export function getUpiLimitDisplay(amount) {
  const guidance = getUpiLimitGuidance(amount);

  return {
    showWarning: !guidance.limitCheck.isWithinBasicLimits,
    warningLevel: guidance.limitCheck.exceedsAllLimits
      ? "danger"
      : !guidance.limitCheck.isWithinCommonLimits
      ? "warning"
      : "info",
    title: guidance.limitCheck.exceedsAllLimits
      ? "Amount Exceeds UPI Limits"
      : !guidance.limitCheck.isWithinCommonLimits
      ? "Check UPI Limits"
      : "UPI Payment Tips",
    message: guidance.primaryMessage,
    suggestions: guidance.suggestions,
    alternatives: guidance.alternatives,
    troubleshooting: guidance.troubleshooting,
  };
}

/**
 * Get app-specific error handling
 * @param {string} app - UPI app name
 * @param {number} amount - Transaction amount
 * @returns {Object} App-specific guidance
 */
export function getAppSpecificGuidance(app, amount) {
  const appKey = app.toLowerCase().replace(/\s+/g, "");
  const appLimits = UPI_LIMITS[appKey] || UPI_LIMITS.gpay;
  const guidance = getUpiLimitGuidance(amount, app);

  const isAmountSupported = amount <= appLimits.perTransaction;

  return {
    app: appLimits.name,
    isSupported: isAmountSupported,
    limit: appLimits.perTransaction,
    message: isAmountSupported
      ? `${appLimits.name} should support ₹${amount}`
      : `₹${amount} exceeds ${appLimits.name} limit of ₹${appLimits.perTransaction}`,
    alternatives: guidance.alternatives.filter((alt) => alt.app !== appKey),
    suggestions: isAmountSupported
      ? [
          "Try scanning QR code directly",
          "Check your internet connection",
          "Restart the app and try again",
        ]
      : [
          "Try an app with higher limits",
          "Contact your bank for limit increase",
          "Split into smaller transactions",
        ],
  };
}

export default {
  UPI_LIMITS,
  BANK_LIMITS,
  checkUpiLimits,
  getUpiLimitGuidance,
  getUpiLimitDisplay,
  getAppSpecificGuidance,
};
