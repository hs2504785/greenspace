/**
 * UPI QR Code Generator Utility
 * Generates UPI payment QR codes for orders with proper formatting
 */

/**
 * Generate UPI payment string according to NPCI specifications
 * @param {Object} params - Payment parameters
 * @param {string} params.payeeVPA - UPI ID of the payee (seller)
 * @param {string} params.payeeName - Name of the payee
 * @param {number} params.amount - Transaction amount
 * @param {string} params.transactionRef - Unique transaction reference
 * @param {string} params.transactionNote - Payment description/note
 * @param {string} params.merchantCode - Optional merchant category code
 * @returns {string} UPI payment string
 */
export function generateUpiPaymentString({
  payeeVPA,
  payeeName,
  amount,
  transactionRef,
  transactionNote,
  merchantCode = "5411", // Default: Grocery Stores
}) {
  // Force cache refresh - this should trigger if new code is loaded
  console.log("🚨 UPI GENERATOR VERSION 2.0 LOADED - NEW DEBUGGING");

  // Debug all incoming parameters immediately
  console.log("📋 ALL UPI PARAMETERS RECEIVED:", {
    payeeVPA,
    payeeName,
    amount,
    transactionRef,
    transactionNote,
    merchantCode,
  });

  // Validate required parameters with detailed error messages
  console.log("🔍 Validating UPI parameters:", {
    payeeVPA: payeeVPA || "MISSING",
    payeeName: payeeName || "MISSING",
    amount: amount || "MISSING",
    transactionRef: transactionRef || "MISSING",
  });

  if (!payeeVPA) {
    throw new Error(
      "Missing UPI ID (payeeVPA) - seller payment method not configured"
    );
  }
  if (!payeeName) {
    throw new Error("Missing payee name - seller information incomplete");
  }
  if (!amount || amount <= 0) {
    throw new Error("Missing or invalid amount - order total not found");
  }
  if (!transactionRef) {
    throw new Error("Missing transaction reference - order ID issue");
  }

  // Format amount to 2 decimal places
  const formattedAmount = parseFloat(amount).toFixed(2);

  // Clean and encode parameters for UPI string - Enhanced validation
  const cleanPayeeName = encodeURIComponent(payeeName.trim());
  const cleanTransactionNote = encodeURIComponent(
    transactionNote || `Payment for Order #${transactionRef}`
  );

  // Ensure transaction reference is alphanumeric and within limits (max 35 chars for UPI)
  let cleanTransactionRef = transactionRef.replace(/[^a-zA-Z0-9]/g, "");
  if (cleanTransactionRef.length > 35) {
    cleanTransactionRef = cleanTransactionRef.substring(0, 35);
  }

  // Validate UPI ID format
  const upiIdRegex = /^[a-zA-Z0-9.\-_]+@[a-zA-Z0-9.\-_]+$/;
  if (!upiIdRegex.test(payeeVPA)) {
    console.warn("⚠️ UPI ID format validation failed:", payeeVPA);
    // Continue anyway as the validation might be too strict
  }

  // Build UPI payment string according to NPCI specification
  // Use URLSearchParams for proper encoding and avoid encoding issues
  const upiParams = new URLSearchParams({
    pa: payeeVPA, // Payee Address (UPI ID)
    pn: payeeName.trim(), // Payee Name (not encoded in URLSearchParams)
    am: formattedAmount, // Amount
    tr: cleanTransactionRef, // Transaction Reference
    tn: transactionNote || `Payment for Order #${transactionRef}`, // Transaction Note
    mc: merchantCode, // Merchant Code
    cu: "INR", // Currency
  });

  const upiString = `upi://pay?${upiParams.toString()}`;

  console.log("✅ Generated UPI string:", upiString);
  console.log("🔍 UPI parameters breakdown:", {
    payeeVPA,
    payeeName: payeeName.trim(),
    amount: formattedAmount,
    transactionRef: cleanTransactionRef,
    merchantCode,
    fullString: upiString,
  });

  return upiString;
}

/**
 * Generate QR code data URL from UPI string
 * @param {string} upiString - UPI payment string
 * @param {Object} options - QR code options
 * @returns {Promise<string>} Base64 data URL of QR code
 */
export async function generateQRCodeDataURL(upiString, options = {}) {
  const QRCode = (await import("qrcode")).default;

  const qrOptions = {
    width: options.width || 300,
    margin: options.margin || 2,
    color: {
      dark: options.darkColor || "#000000",
      light: options.lightColor || "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  };

  try {
    const qrCodeDataURL = await QRCode.toDataURL(upiString, qrOptions);
    return qrCodeDataURL;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Create complete UPI QR code for order
 * @param {Object} orderData - Order information
 * @param {Object} sellerPaymentInfo - Seller's UPI payment details
 * @returns {Promise<Object>} QR code information
 */
export async function createOrderUpiQR(orderData, sellerPaymentInfo) {
  try {
    // Debug logging
    console.log("📝 createOrderUpiQR called with:", {
      orderData: {
        id: orderData?.id,
        total_amount: orderData?.total_amount,
        total: orderData?.total,
        seller_id: orderData?.seller_id,
      },
      sellerPaymentInfo: {
        upi_id: sellerPaymentInfo?.upi_id,
        account_holder_name: sellerPaymentInfo?.account_holder_name,
        display_name: sellerPaymentInfo?.display_name,
      },
    });

    // Validate required parameters
    if (!orderData || !orderData.id) {
      throw new Error("Order data missing or invalid");
    }

    if (!sellerPaymentInfo || !sellerPaymentInfo.upi_id) {
      throw new Error("Seller payment info missing or invalid");
    }

    // Extract amount safely with debugging
    console.log("🔍 UPIORG - orderData received:", {
      orderData,
      total_amount: orderData.total_amount,
      total: orderData.total,
      allKeys: Object.keys(orderData || {}),
      allValues: Object.entries(orderData || {}),
    });

    const amount = orderData.total_amount || orderData.total;
    console.log("🔍 UPIORG - amount extraction:", {
      total_amount: orderData.total_amount,
      total: orderData.total,
      finalAmount: amount,
      amountType: typeof amount,
      isValid: amount && amount > 0,
    });

    if (!amount || amount <= 0) {
      console.error("❌ UPIORG - Amount validation failed:", {
        amount,
        total_amount: orderData.total_amount,
        total: orderData.total,
        fullOrderData: orderData,
      });
      throw new Error("Order amount missing or invalid");
    }

    // Generate transaction reference from order ID
    const transactionRef = `GS${orderData.id.slice(-8)}${Date.now()
      .toString()
      .slice(-4)}`;

    // Prepare UPI parameters with validation
    const upiParams = {
      payeeVPA: sellerPaymentInfo.upi_id,
      payeeName:
        sellerPaymentInfo.account_holder_name ||
        sellerPaymentInfo.display_name ||
        "Seller",
      amount: amount,
      transactionRef: transactionRef,
      transactionNote: `Greenspace Order ${orderData.id.slice(-6)}`,
      merchantCode: "5411", // Grocery stores
    };

    console.log("🔧 UPI parameters prepared:", upiParams);

    // Create UPI payment string
    const upiString = generateUpiPaymentString(upiParams);

    // Generate QR code
    const qrCodeDataURL = await generateQRCodeDataURL(upiString, {
      width: 300,
      margin: 3,
    });

    return {
      upiString,
      qrCodeDataURL,
      transactionRef,
      payeeVPA: sellerPaymentInfo.upi_id,
      payeeName:
        sellerPaymentInfo.account_holder_name || sellerPaymentInfo.display_name,
      amount: orderData.total_amount || orderData.total,
      expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    };
  } catch (error) {
    console.error("Error creating UPI QR code:", error);
    throw new Error("Failed to create UPI QR code for order");
  }
}

/**
 * Validate UPI ID format
 * @param {string} upiId - UPI ID to validate
 * @returns {boolean} True if valid UPI ID format
 */
export function validateUpiId(upiId) {
  // UPI ID format: username@psp (e.g., 9876543210@paytm, john.doe@okaxis)
  const upiRegex = /^[a-zA-Z0-9.\-_]+@[a-zA-Z0-9.\-_]+$/;
  return upiRegex.test(upiId);
}

/**
 * Extract UPI payment details from UPI string
 * @param {string} upiString - UPI payment string
 * @returns {Object} Parsed UPI payment details
 */
export function parseUpiString(upiString) {
  try {
    const url = new URL(upiString);
    const params = new URLSearchParams(url.search);

    return {
      payeeVPA: params.get("pa"),
      payeeName: decodeURIComponent(params.get("pn") || ""),
      amount: parseFloat(params.get("am") || "0"),
      transactionRef: params.get("tr"),
      transactionNote: decodeURIComponent(params.get("tn") || ""),
      merchantCode: params.get("mc"),
      currency: params.get("cu") || "INR",
    };
  } catch (error) {
    console.error("Error parsing UPI string:", error);
    throw new Error("Invalid UPI payment string");
  }
}

// Popular UPI providers mapping
export const UPI_PROVIDERS = {
  "@paytm": "Paytm Payments Bank",
  "@okaxis": "Axis Bank",
  "@ybl": "Yes Bank",
  "@upi": "NPCI",
  "@ibl": "IDFC Bank",
  "@icici": "ICICI Bank",
  "@hdfcbank": "HDFC Bank",
  "@sbi": "State Bank of India",
  "@pnb": "Punjab National Bank",
  "@cub": "City Union Bank",
  "@fbl": "Federal Bank",
  "@rbl": "RBL Bank",
  "@kotak": "Kotak Mahindra Bank",
};

/**
 * Get UPI provider name from UPI ID
 * @param {string} upiId - UPI ID
 * @returns {string} Provider name or 'Unknown Provider'
 */
export function getUpiProvider(upiId) {
  if (!upiId || !upiId.includes("@")) return "Unknown Provider";

  const provider = "@" + upiId.split("@")[1];
  return UPI_PROVIDERS[provider] || "Unknown Provider";
}
