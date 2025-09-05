/**
 * Payment Service
 * Handles all payment-related operations including UPI QR, Razorpay, and payment verification
 */

import { supabase } from "@/lib/supabase";
import { createOrderUpiQR, validateUpiId } from "@/utils/upiQrGenerator";

class PaymentService {
  constructor() {
    this.baseApiUrl = "/api/payments";
  }

  /**
   * Get seller's payment methods
   * @param {string} sellerId - Seller's user ID
   * @returns {Promise<Array>} Array of payment methods
   */
  async getSellerPaymentMethods(sellerId) {
    try {
      // Check if sellerId is valid
      if (!sellerId || sellerId === "undefined" || sellerId === undefined) {
        console.warn(
          "❌ Invalid seller ID provided to getSellerPaymentMethods:",
          sellerId
        );
        return [];
      }

      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("seller_id", sellerId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Payment methods table not found or error:", error);
        // Return empty array if table doesn't exist yet
        return [];
      }
      return data || [];
    } catch (error) {
      console.warn(
        "Error fetching seller payment methods (likely DB not migrated yet):",
        error
      );
      // Return empty array instead of throwing - allows static QR to work
      return [];
    }
  }

  /**
   * Create UPI QR code for order payment
   * @param {Object} orderData - Order information
   * @param {string} orderType - 'regular' or 'guest'
   * @returns {Promise<Object>} UPI QR code data
   */
  async createUpiQRForOrder(orderData, orderType = "regular") {
    try {
      // Get seller's UPI payment method
      const extractedSellerId = orderData.seller_id || orderData.sellerId;

      const sellerPaymentMethods = await this.getSellerPaymentMethods(
        extractedSellerId
      );

      const upiMethod = sellerPaymentMethods.find(
        (method) => method.method_type === "upi" && method.is_active
      );

      if (!upiMethod || !upiMethod.upi_id) {
        console.warn(
          "⚠️ No UPI payment method found for seller. Using fallback UPI method."
        );

        // Temporary fallback UPI method (your configured UPI)
        const fallbackUpiMethod = {
          upi_id: "smritisgh171@okicici",
          account_holder_name: "Smriti Singh",
          display_name: "Smriti",
          method_type: "upi",
          is_active: true,
        };

        // Use fallback method instead of throwing error
        try {
          const qrData = await createOrderUpiQR(orderData, fallbackUpiMethod);
          return {
            ...qrData,
            paymentMethodInfo: {
              upi_id: fallbackUpiMethod.upi_id,
              display_name: fallbackUpiMethod.display_name,
              account_holder_name: fallbackUpiMethod.account_holder_name,
            },
          };
        } catch (qrError) {
          console.error("❌ Fallback QR generation also failed:", qrError);
          // If even fallback fails, throw the original error to show static QR
          throw new Error(
            "UPI QR generation failed - using static QR as fallback"
          );
        }
      }

      console.log("✅ Using UPI method:", upiMethod.display_name);

      // Generate UPI QR code
      const qrData = await createOrderUpiQR(orderData, upiMethod);

      // Try to update order with UPI QR code (may fail if DB not migrated)
      try {
        const tableName = orderType === "guest" ? "guest_orders" : "orders";
        const updateData = {
          upi_qr_code: qrData.qrCodeDataURL,
          payment_method: "upi_qr",
          payment_status: "pending",
          payment_reference: qrData.transactionRef,
          updated_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
          .from(tableName)
          .update(updateData)
          .eq("id", orderData.id);

        if (updateError) {
          console.warn(
            "⚠️ Could not update order with UPI QR (DB may need migration):",
            updateError
          );
        }
      } catch (updateError) {
        console.warn(
          "⚠️ Order update failed - continuing with QR generation:",
          updateError
        );
      }

      return {
        ...qrData,
        paymentMethodInfo: {
          upi_id: upiMethod.upi_id,
          display_name: upiMethod.display_name,
          account_holder_name: upiMethod.account_holder_name,
        },
      };
    } catch (error) {
      console.warn("❌ Dynamic UPI QR creation failed:", error.message);
      throw error;
    }
  }

  /**
   * Upload payment screenshot for verification
   * @param {string} orderId - Order ID
   * @param {File} screenshotFile - Screenshot file
   * @param {string} orderType - 'regular' or 'guest'
   * @param {number} amount - Payment amount (required for transaction record)
   * @returns {Promise<Object>} Upload result
   */
  async uploadPaymentScreenshot(
    orderId,
    screenshotFile,
    orderType = "regular",
    amount = null
  ) {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = screenshotFile.name.split(".").pop();
      const fileName = `payment-screenshots/${orderType}/${orderId}/${timestamp}.${fileExtension}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("order-attachments")
        .upload(fileName, screenshotFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("order-attachments")
        .getPublicUrl(fileName);

      const screenshotUrl = urlData.publicUrl;

      // Update order with screenshot URL
      const tableName = orderType === "guest" ? "guest_orders" : "orders";
      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          payment_screenshot_url: screenshotUrl,
          payment_status: "manual_verification",
          status:
            orderType === "guest" ? "payment_received" : "payment_received",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) throw updateError;

      // Try to create payment transaction record (may fail if DB not migrated)
      try {
        if (!amount || amount <= 0) {
          console.warn(
            "⚠️ Amount not available for payment transaction, skipping transaction record"
          );
          toastService.warning(
            "Screenshot uploaded, but amount not recorded. Please verify manually."
          );
        } else {
          await this.createPaymentTransaction({
            orderId,
            orderType,
            transactionType: "upi_qr",
            amount: amount, // Use actual amount passed from component
            status: "manual_verification",
            screenshotUrl,
          });
          console.log("✅ Payment transaction created with amount:", amount);
        }
      } catch (transactionError) {
        console.warn(
          "⚠️ Could not create payment transaction (DB may need migration):",
          transactionError
        );
        // Continue anyway - the screenshot is uploaded and order is updated
      }

      return {
        success: true,
        screenshotUrl,
        message:
          "Payment screenshot uploaded successfully. Verification pending.",
      };
    } catch (error) {
      console.error("Error uploading payment screenshot:", error);
      throw error;
    }
  }

  /**
   * Create payment transaction record
   * @param {Object} transactionData - Transaction information
   * @returns {Promise<Object>} Created transaction
   */
  async createPaymentTransaction(transactionData) {
    try {
      const {
        orderId,
        orderType,
        transactionType,
        amount,
        status,
        gatewayTransactionId,
        gatewayPaymentId,
        gatewayOrderId,
        gatewayResponse,
        screenshotUrl,
        failureReason,
      } = transactionData;

      const insertData = {
        transaction_type: transactionType,
        amount,
        status,
        gateway_transaction_id: gatewayTransactionId,
        gateway_payment_id: gatewayPaymentId,
        gateway_order_id: gatewayOrderId,
        gateway_response: gatewayResponse,
        screenshot_url: screenshotUrl,
        failure_reason: failureReason,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Set order reference based on type
      if (orderType === "guest") {
        insertData.guest_order_id = orderId;
      } else {
        insertData.order_id = orderId;
      }

      const { data, error } = await supabase
        .from("payment_transactions")
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.warn("Payment transactions table not found or error:", error);
        throw error;
      }
      return data;
    } catch (error) {
      console.warn(
        "Error creating payment transaction (likely DB not migrated yet):",
        error
      );
      throw error;
    }
  }

  /**
   * Verify payment and update order status
   * @param {string} transactionId - Payment transaction ID
   * @param {boolean} isApproved - Whether payment is approved
   * @param {string} verifiedBy - User ID of verifier
   * @param {string} notes - Verification notes
   * @returns {Promise<Object>} Verification result
   */
  async verifyPayment(transactionId, isApproved, verifiedBy, notes = "") {
    try {
      const response = await fetch(`${this.baseApiUrl}/verify`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          transactionId,
          isApproved,
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to verify payment");
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error verifying payment:", error);
      throw error;
    }
  }

  /**
   * Get payment transactions for an order
   * @param {string} orderId - Order ID
   * @param {string} orderType - 'regular' or 'guest'
   * @returns {Promise<Array>} Array of payment transactions
   */
  async getOrderPaymentTransactions(orderId, orderType = "regular") {
    try {
      const params = new URLSearchParams({
        orderId,
        orderType,
      });

      const response = await fetch(
        `${this.baseApiUrl}/transactions?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch order payment transactions");
      }

      const result = await response.json();
      return result.transactions || [];
    } catch (error) {
      console.error("Error fetching order payment transactions:", error);
      throw error;
    }
  }

  /**
   * Get pending payment verifications for seller/admin
   * @param {string} sellerId - Seller ID (optional, for seller-specific)
   * @returns {Promise<Array>} Array of pending payment verifications
   */
  async getPendingPaymentVerifications(sellerId = null) {
    try {
      const params = new URLSearchParams({
        status: "manual_verification",
      });

      // Filter by seller if provided
      if (sellerId) {
        params.append("sellerId", sellerId);
      }

      const url = `${this.baseApiUrl}/transactions?${params}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error Response:", errorText);

        // If it's a 500 error and mentions payment transactions, it's likely a missing table
        if (
          response.status === 500 &&
          errorText.includes("payment transactions")
        ) {
          console.warn("⚠️ Payment system tables may not be set up yet");
          // Return empty array instead of throwing error
          return [];
        }

        throw new Error(
          `Failed to fetch pending payment verifications: ${response.status} - ${errorText}`
        );
      }

      const result = await response.json();
      return result.transactions || [];
    } catch (error) {
      console.error("Error fetching pending payment verifications:", error);
      throw error;
    }
  }

  /**
   * Add or update seller payment method
   * @param {string} sellerId - Seller's user ID
   * @param {Object} paymentMethodData - Payment method information
   * @returns {Promise<Object>} Created/updated payment method
   */
  async addSellerPaymentMethod(sellerId, paymentMethodData) {
    try {
      const {
        methodType,
        upiId,
        accountHolderName,
        bankName,
        accountNumber,
        ifscCode,
        displayName,
      } = paymentMethodData;

      // Validate UPI ID if provided
      if (methodType === "upi" && upiId && !validateUpiId(upiId)) {
        throw new Error("Invalid UPI ID format");
      }

      const insertData = {
        seller_id: sellerId,
        method_type: methodType,
        upi_id: upiId,
        account_holder_name: accountHolderName,
        bank_name: bankName,
        account_number: accountNumber,
        ifsc_code: ifscCode,
        display_name: displayName,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("payment_methods")
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error adding seller payment method:", error);
      throw error;
    }
  }

  /**
   * Initialize Razorpay order (for future Razorpay integration)
   * @param {Object} orderData - Order information
   * @returns {Promise<Object>} Razorpay order details
   */
  async initializeRazorpayOrder(orderData) {
    try {
      const response = await fetch(`${this.baseApiUrl}/razorpay/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error("Failed to create Razorpay order");
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error initializing Razorpay order:", error);
      throw error;
    }
  }

  /**
   * Verify Razorpay payment (for future Razorpay integration)
   * @param {Object} paymentData - Razorpay payment verification data
   * @returns {Promise<Object>} Verification result
   */
  async verifyRazorpayPayment(paymentData) {
    try {
      const response = await fetch(
        `${this.baseApiUrl}/razorpay/verify-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paymentData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to verify Razorpay payment");
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error verifying Razorpay payment:", error);
      throw error;
    }
  }
}

export default new PaymentService();
