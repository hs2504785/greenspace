/**
 * UPI Payment Limits Helper
 * Provides information about UPI transaction limits and suggestions
 */

// Common UPI app limits (per transaction and daily)
// Note: "Bank limit exceeded" errors are often due to UPI string formatting issues, not actual limits
export const UPI_LIMITS = {
  gpay: {
    name: "Google Pay",
    perTransaction: 100000,
    daily: 100000,
    description: "Most reliable for amounts up to ₹1,00,000",
    commonIssues: [
      "Deep link formatting",
      "Parameter encoding",
      "App version compatibility",
    ],
  },
  phonepe: {
    name: "PhonePe",
    perTransaction: 100000,
    daily: 100000,
    description: "Generally supports higher limits and better compatibility",
    commonIssues: ["App not installed", "Network connectivity"],
  },
  paytm: {
    name: "Paytm",
    perTransaction: 50000,
    daily: 100000,
    description: "Good for medium amounts, may have lower limits on some banks",
    commonIssues: ["Bank-specific limits", "Wallet vs UPI confusion"],
  },
  bhim: {
    name: "BHIM UPI",
    perTransaction: 40000,
    daily: 40000,
    description: "Government app with conservative limits but high reliability",
    commonIssues: ["Lower transaction limits", "Slower processing"],
  },
  amazonpay: {
    name: "Amazon Pay",
    perTransaction: 50000,
    daily: 100000,
    description: "Good alternative for medium amounts",
    commonIssues: ["Limited bank support", "App availability"],
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

/**
 * Detect if GPay is likely to fail for this user/device combination
 * @param {number} amount - Transaction amount
 * @param {string} userAgent - Browser user agent string
 * @returns {Object} GPay compatibility assessment
 */
export function detectGpayCompatibility(amount, userAgent) {
  const isAndroid = /android/i.test(userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isMobile = isAndroid || isIOS;

  // GPay is more problematic on certain conditions
  const riskFactors = {
    smallAmount: amount < 500, // Small amounts often trigger false limit errors
    isDesktop: !isMobile, // Desktop users can't use deep links effectively
    isOldAndroid: isAndroid && /Android [1-6]\./.test(userAgent), // Older Android versions
    webView: /wv/.test(userAgent), // WebView context has more restrictions
  };

  const riskScore = Object.values(riskFactors).filter(Boolean).length;
  const isHighRisk = riskScore >= 2; // 2 or more risk factors

  let compatibility = "good";
  let hideGpay = false;
  let warningMessage = "";

  if (isHighRisk) {
    compatibility = "poor";
    hideGpay = true;

    if (riskFactors.smallAmount && riskFactors.isDesktop) {
      warningMessage = `For ₹${amount} on desktop, scan QR code directly`;
    } else if (riskFactors.smallAmount) {
      warningMessage = `Small amount payments often work better with QR scan`;
    } else if (riskFactors.isDesktop) {
      warningMessage = `Desktop users should scan QR code with mobile UPI app`;
    } else {
      warningMessage = `GPay may have compatibility issues - try QR scan`;
    }
  } else if (riskScore === 1) {
    compatibility = "fair";
    hideGpay = false; // Show but with warning

    if (riskFactors.smallAmount) {
      warningMessage = `Small amounts sometimes trigger false "limit exceeded" errors`;
    } else if (riskFactors.isDesktop) {
      warningMessage = `Use mobile device for app-to-app payment`;
    }
  }

  return {
    compatible: compatibility === "good",
    riskFactors,
    riskScore,
    compatibility,
    hideGpay,
    warningMessage,
    recommendedAction: hideGpay
      ? "Use QR code scanning instead"
      : "Try GPay button, fallback to QR scan if needed",
  };
}

/**
 * Handle the specific "bank limit exceeded" error that occurs even with small amounts
 * This is usually a UPI string formatting issue, not an actual limit problem
 * @param {number} amount - Transaction amount
 * @param {string} app - UPI app that failed
 * @returns {Object} Specific guidance for this error
 */
export function handleBankLimitExceededError(amount, app = "UPI app") {
  // For small amounts (< ₹100), this is definitely a formatting issue
  const isSmallAmount = amount < 100;
  const isMediumAmount = amount >= 100 && amount <= 5000;

  let primaryMessage = "";
  let solutions = [];
  let alternatives = [];

  if (isSmallAmount) {
    primaryMessage = `"Bank limit exceeded" error for ₹${amount} is likely a technical issue, not an actual limit problem.`;
    solutions = [
      "Scan the QR code directly in your UPI app instead of using the button",
      "Try BHIM UPI which often works better",
      "Restart your UPI app and try again",
      "Check if your UPI app needs an update",
    ];
    alternatives = ["BHIM UPI", "Any UPI app via QR scan"];
  } else if (isMediumAmount) {
    primaryMessage = `For ₹${amount}, try these solutions to resolve the "bank limit exceeded" error:`;
    solutions = [
      "Use QR code scanning instead of the app button",
      "Try BHIM UPI which has better compatibility",
      "Check your daily UPI transaction history",
      "Contact your bank if the issue persists",
    ];
    alternatives = ["BHIM UPI", "QR code scanning"];
  } else {
    primaryMessage = `₹${amount} might genuinely exceed some UPI limits. Try these solutions:`;
    solutions = [
      "Use Google Pay which supports higher limits",
      "Check your bank's UPI transaction limits",
      "Consider splitting into smaller transactions",
      "Use net banking for large amounts",
    ];
    alternatives = ["Google Pay", "Net Banking"];
  }

  return {
    isLikelyTechnicalIssue: isSmallAmount,
    primaryMessage,
    solutions,
    alternatives,
    recommendedAction: isSmallAmount
      ? "Scan QR code manually - this will definitely work"
      : "Try BHIM UPI or scan QR code manually",
    troubleshooting: [
      "The QR code always works - it's the most reliable method",
      "Different UPI apps handle deep links differently",
      "Your bank account and UPI are working fine",
      `₹${amount} is well within normal UPI limits`,
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
  handleBankLimitExceededError,
  detectGpayCompatibility,
};
