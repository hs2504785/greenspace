"use client";

import { useState, useEffect } from "react";
import { Modal, Card, Button, Form, Alert, Spinner } from "react-bootstrap";
import PaymentService from "@/services/PaymentService";
import toastService from "@/utils/toastService";
import {
  getUpiLimitDisplay,
  getAppSpecificGuidance,
  handleBankLimitExceededError,
  checkUpiLimits,
  detectGpayCompatibility,
} from "@/utils/upiLimitHelper";

export default function UpiQrPayment({
  show,
  onHide,
  orderData,
  orderType = "regular",
  onPaymentComplete,
}) {
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadStep, setUploadStep] = useState("qr"); // 'qr', 'upload', 'verification'
  const [gpayCompatibility, setGpayCompatibility] = useState(null);

  useEffect(() => {
    if (show && orderData) {
      generateQrCode();
    }
  }, [show, orderData]);

  const generateQrCode = async () => {
    setLoading(true);

    // Validate orderData first

    if (!orderData || !orderData.id) {
      console.error("Invalid orderData received:", orderData);
      toastService.error("Order data is missing. Please try again.");
      setLoading(false);
      return;
    }

    // Try multiple possible field names for amount
    let amount =
      orderData?.total_amount ||
      orderData?.total ||
      orderData?.amount ||
      orderData?.totalAmount;

    console.log("🔍 Checking amount sources:", {
      total_amount: orderData?.total_amount,
      total: orderData?.total,
      amount: orderData?.amount,
      totalAmount: orderData?.totalAmount,
      selectedAmount: amount,
    });

    // Convert to number if it's a string
    if (typeof amount === "string") {
      amount = parseFloat(amount);
    }

    // If still no amount, check if it's nested in items or calculate from items
    if (!amount && orderData?.items) {
      console.log(
        "🔍 Analyzing items for amount calculation:",
        orderData.items
      );

      const calculatedTotal = orderData.items.reduce((sum, item) => {
        // Try multiple possible price field names
        const itemPrice = item.price_per_unit || item.price || item.total_price;
        const itemQuantity = item.quantity || 1;
        const itemTotal = item.total_price || itemPrice * itemQuantity;

        console.log("🔍 Item analysis:", {
          item,
          itemPrice,
          itemQuantity,
          itemTotal,
          price_per_unit: item.price_per_unit,
          total_price: item.total_price,
        });

        return sum + (itemTotal || 0);
      }, 0);

      console.log("🔍 Calculated amount from items:", calculatedTotal);
      amount = calculatedTotal;
    }

    console.log("🔍 Amount extraction:", {
      total_amount: orderData?.total_amount,
      total: orderData?.total,
      finalAmount: amount,
      amountType: typeof amount,
      isValid: !isNaN(amount) && amount > 0,
    });

    if (!amount || isNaN(amount) || amount <= 0) {
      console.error(
        "❌ Invalid amount - this should no longer happen after fixes:",
        {
          total_amount: orderData?.total_amount,
          total: orderData?.total,
          finalAmount: amount,
          amountType: typeof amount,
          fullOrderData: orderData,
        }
      );

      // Fallback: Show static QR without amount
      const fallbackQrData = {
        amount: 0, // Will show static QR only
        staticQrOnly: true,
        staticQrUrl: "/images/scanner.jpeg",
        upiId: "smritisgh171@okicici", // Fallback UPI ID
        payeeName: "Arya Natural Farms",
        error: "Amount not available - please enter manually",
      };

      setQrData(fallbackQrData);

      // Even for fallback, check GPay compatibility with amount 0 (will still detect platform issues)
      const compatibility = detectGpayCompatibility(0, navigator.userAgent);
      setGpayCompatibility(compatibility);

      setLoading(false);
      toastService.warning(
        "Order amount not found. Please enter amount manually in your UPI app."
      );
      return;
    }

    // Remove temporary bypass - test the real fix

    // Always set basic QR data first (ensures static QR always shows)
    const basicQrData = {
      amount: amount,
      staticQrOnly: true,
    };
    setQrData(basicQrData);

    try {
      console.log("🔄 Attempting to generate dynamic QR code...");
      console.log("🚨 UPI COMPONENT VERSION 2.0 - ENHANCED DEBUGGING");

      const qrResult = await PaymentService.createUpiQRForOrder(
        orderData,
        orderType
      );
      console.log("✅ Dynamic QR generated successfully:", qrResult);
      setQrData({
        ...qrResult,
        staticQrOnly: false,
      });

      // Check GPay compatibility after successful QR generation
      const compatibility = detectGpayCompatibility(
        amount,
        navigator.userAgent
      );
      setGpayCompatibility(compatibility);

      // Show proactive warning if GPay is likely to fail
      if (compatibility.hideGpay) {
        toastService.info(
          `💡 ${compatibility.warningMessage}. QR scanning is most reliable.`,
          { autoClose: 8000 }
        );
      } else if (compatibility.warningMessage && amount < 200) {
        // Show subtle warning for small amounts even if we're showing GPay
        toastService.info(`ℹ️ ${compatibility.warningMessage}`, {
          autoClose: 6000,
        });
      }
    } catch (error) {
      console.error("❌ Dynamic QR generation failed:", error);
      if (error.message.includes("database may need migration")) {
        toastService.info("Using static QR code - setup still in progress");
      } else {
        toastService.info("Using static QR code for payment");
      }
      // Keep the basic QR data (static QR will still show)
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toastService.error("Please select a valid image file (JPG, PNG, WEBP)");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toastService.error("File size should be less than 5MB");
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUploadScreenshot = async () => {
    if (!selectedFile) {
      toastService.error("Please select a screenshot to upload");
      return;
    }

    // Extract amount same way as in generateQrCode
    let amount =
      orderData?.total_amount ||
      orderData?.total ||
      orderData?.amount ||
      orderData?.totalAmount;

    // Convert to number if it's a string
    if (typeof amount === "string") {
      amount = parseFloat(amount);
    }

    // If still no amount, calculate from items
    if (!amount && orderData?.items) {
      amount = orderData.items.reduce((sum, item) => {
        return sum + item.price * item.quantity;
      }, 0);
    }

    console.log("📤 Upload screenshot with amount:", {
      orderId: orderData.id,
      amount: amount,
      amountType: typeof amount,
      orderData: orderData,
    });

    setUploadLoading(true);
    try {
      const result = await PaymentService.uploadPaymentScreenshot(
        orderData.id,
        selectedFile,
        orderType,
        amount // Pass the amount
      );

      if (result.success) {
        setUploadStep("verification");
        toastService.success("Payment screenshot uploaded successfully!");

        // Call completion callback after a short delay
        setTimeout(() => {
          onPaymentComplete && onPaymentComplete(result);
        }, 2000);
      }
    } catch (error) {
      console.error("Error uploading screenshot:", error);
      toastService.error("Failed to upload payment screenshot");
    } finally {
      setUploadLoading(false);
    }
  };

  const copyUpiId = () => {
    if (qrData?.paymentMethodInfo?.upi_id) {
      navigator.clipboard.writeText(qrData.paymentMethodInfo.upi_id);
      toastService.success("UPI ID copied to clipboard!");
    }
  };

  // Detect mobile platform for better UPI handling
  const detectMobilePlatform = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    if (/android/i.test(userAgent)) {
      return "android";
    }

    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      return "ios";
    }

    return "desktop";
  };

  // Handle payment app failures with user-friendly guidance
  const handlePaymentFailure = (app, error) => {
    console.error(`❌ ${app} payment failed:`, error);

    const amount = qrData ? parseFloat(qrData.amount) : 0;
    const guidance = getAppSpecificGuidance(app, amount);

    // Show immediate error with clear guidance
    toastService.error(
      `${app} couldn't open. This might be due to:\n• App not installed\n• Bank/UPI limits\n• Network issues\n\nPlease scan the QR code manually or try BHIM UPI.`,
      { autoClose: 8000 }
    );

    // Auto-suggest BHIM UPI or QR scanning after a short delay
    setTimeout(() => {
      toastService.info(
        `💡 Try BHIM UPI instead, or scan the QR code with any UPI app`,
        { autoClose: 6000 }
      );
    }, 3000);
  };

  const openUpiApp = (app) => {
    if (!qrData?.upiString) {
      toastService.error("Payment information not available");
      return;
    }

    try {
      const platform = detectMobilePlatform();
      const upiUrl = new URL(qrData.upiString);
      const params = new URLSearchParams(upiUrl.search);

      console.log("🔍 Opening UPI app:", {
        app,
        platform,
        upiString: qrData.upiString,
      });

      // Extract and validate critical parameters
      const payeeAddress = params.get("pa");
      const amount = params.get("am");
      const payeeName = params.get("pn");
      const transactionRef = params.get("tr");

      if (!payeeAddress) {
        console.error("❌ UPI ERROR: Missing payee address (pa)");
        toastService.error("Payment setup error: Missing UPI ID");
        return;
      }

      if (!amount || parseFloat(amount) <= 0) {
        console.error("❌ UPI ERROR: Invalid amount", { amount });
        toastService.error("Payment setup error: Invalid amount");
        return;
      }

      // Check UPI limits and show warnings
      const limitCheck = checkUpiLimits(parseFloat(amount));
      if (limitCheck.exceedsAllLimits) {
        toastService.error(
          `Amount ₹${amount} exceeds UPI transaction limits. Please try a smaller amount or contact your bank.`
        );
        return;
      }

      if (app === "gpay") {
        console.log("🔍 GPAY DEBUG - Parameters:", {
          pa: payeeAddress,
          pn: payeeName,
          am: amount,
          tr: transactionRef,
        });

        // 🚨 FIXED APPROACH: Use exact QR parameters to avoid encoding issues
        const directUpiString = qrData.upiString;

        console.log("🔍 GPAY: Using exact QR UPI string:", directUpiString);

        // For Google Pay, use the most reliable approach
        if (platform === "android") {
          // Primary strategy: Direct UPI scheme (same as QR code)
          try {
            window.location.href = directUpiString;
            console.log("✅ GPAY: Opened with direct UPI scheme");

            toastService.info("Opening Google Pay...", { autoClose: 2000 });

            // Provide guidance if app doesn't open
            setTimeout(() => {
              toastService.info(
                "If Google Pay didn't open, please scan the QR code manually",
                { autoClose: 5000 }
              );
            }, 3000);

            return;
          } catch (error) {
            console.error("❌ GPAY: Direct UPI scheme failed:", error);

            // Fallback: Intent scheme
            try {
              const intentUrl =
                directUpiString.replace("upi://pay?", "intent://pay?") +
                "#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end";

              window.location.href = intentUrl;
              console.log("✅ GPAY: Tried Intent scheme fallback");
            } catch (intentError) {
              console.error("❌ GPAY: Intent scheme also failed:", intentError);

              // Show specific error with limit exceeded context
              const limitGuidance = handleBankLimitExceededError(
                parseFloat(amount),
                "Google Pay"
              );
              toastService.error(
                `Google Pay failed to open. ${limitGuidance.primaryMessage}\n\n💡 ${limitGuidance.recommendedAction}`,
                { autoClose: 10000 }
              );
            }
          }
        } else if (platform === "ios") {
          // iOS: Direct UPI scheme
          try {
            window.location.href = directUpiString;
            console.log("✅ GPAY: Opened iOS Google Pay");

            toastService.info("Opening Google Pay...", { autoClose: 2000 });

            setTimeout(() => {
              toastService.info(
                "If Google Pay didn't open, please scan the QR code manually",
                { autoClose: 5000 }
              );
            }, 3000);

            return;
          } catch (error) {
            console.error("❌ GPAY: iOS direct UPI failed:", error);
          }
        } else {
          // Desktop: Show QR code guidance
          toastService.info(
            "Please scan the QR code with Google Pay on your mobile device"
          );
          return;
        }
      } else {
        // BHIM and other UPI apps - use standard UPI URL
        try {
          window.location.href = qrData.upiString;
          console.log(`✅ ${app.toUpperCase()}: Opened successfully`);
          toastService.info(`Opening ${app.toUpperCase()}...`);
        } catch (error) {
          console.error(`❌ ${app.toUpperCase()}: Failed to open:`, error);
          toastService.error(
            `Failed to open ${app.toUpperCase()}. Please scan the QR code manually.`
          );
        }
      }

      // Universal fallback guidance for all apps
      setTimeout(() => {
        toastService.info(
          `If ${app.toUpperCase()} doesn't open, please scan the QR code manually`,
          {
            autoClose: 6000,
          }
        );
      }, 4000);
    } catch (error) {
      console.error(`Error opening ${app}:`, error);
      handlePaymentFailure(app, error);
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      className="upi-payment-modal stacked-modal-top"
      backdrop="static"
      style={{ zIndex: 1055 }}
    >
      <Modal.Header closeButton className="py-2">
        <Modal.Title className="fs-6">
          <i className="ti-credit-card me-2"></i>
          UPI Payment
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-3">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status" className="mb-3" />
            <div>Generating payment QR code...</div>
          </div>
        ) : (
          <>
            {/* Payment Details - Compact */}
            <div className="bg-light rounded p-3 mb-3">
              <div className="row align-items-center">
                <div className="col-sm-6">
                  <small className="text-muted">Order ID:</small>
                  <div className="fw-bold">
                    #{orderData?.id?.slice(-8) || "N/A"}
                  </div>
                  {qrData?.paymentMethodInfo && (
                    <div className="mt-1">
                      <small className="text-muted">
                        Pay to: {qrData.paymentMethodInfo.display_name}
                      </small>
                    </div>
                  )}
                </div>
                <div className="col-sm-6 text-sm-end mt-2 mt-sm-0">
                  <small className="text-muted">Amount to Pay</small>
                  <div className="fs-3 text-success fw-bold">
                    ₹
                    {qrData?.amount ||
                      orderData?.total_amount ||
                      orderData?.total}
                  </div>
                </div>
              </div>
            </div>

            {uploadStep === "qr" && qrData && (
              <>
                {/* QR Code Display - Responsive */}
                <div className="row justify-content-center mb-3">
                  <div className="col-md-8 col-lg-6">
                    <div className="text-center border rounded p-3 bg-white">
                      <h6 className="mb-2 fs-6">Scan QR Code to Pay</h6>

                      {/* QR Code - Responsive size */}
                      <div className="mb-2 qr-code-container">
                        {qrData.qrCodeDataURL && !qrData.staticQrOnly ? (
                          // Dynamic QR Code (Primary)
                          <img
                            src={qrData.qrCodeDataURL}
                            alt="UPI QR Code"
                            className="img-fluid rounded"
                            style={{ maxWidth: "200px", width: "100%" }}
                          />
                        ) : (
                          // Static QR Code (Fallback only)
                          <img
                            src="/images/scanner.jpeg"
                            alt="UPI Payment QR Code"
                            className="img-fluid rounded"
                            style={{ maxWidth: "200px", width: "100%" }}
                            onError={(e) => {
                              console.error("Failed to load static QR image");
                              e.target.style.display = "none";
                            }}
                          />
                        )}
                      </div>

                      <div className="text-success fw-bold mb-1">
                        ₹{qrData?.amount}
                      </div>

                      <small className="text-muted">
                        {qrData.qrCodeDataURL && !qrData.staticQrOnly
                          ? `Pay to: ${
                              qrData.paymentMethodInfo?.display_name || "Seller"
                            }`
                          : "Enter amount manually in your UPI app"}
                      </small>

                      {qrData.staticQrOnly && (
                        <div className="mt-2">
                          <small className="text-info">
                            <i className="ti-info-alt me-1"></i>
                            Using fallback QR code
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* UPI App Buttons - Enhanced with better visual hierarchy */}
                <div className="mb-4 payment-section">
                  <div className="text-center mb-3">
                    <h6 className="text-primary mb-1">
                      <i className="ti-zap me-1"></i>
                      Quick Pay Options
                    </h6>
                    <small className="text-muted">
                      Tap to open your preferred UPI app
                    </small>
                    {gpayCompatibility?.hideGpay && (
                      <div className="mt-2 p-2 bg-light rounded">
                        <small className="text-info">
                          <i className="ti-info-circle me-1"></i>
                          {gpayCompatibility.warningMessage}
                        </small>
                      </div>
                    )}
                  </div>

                  <div className="row g-3 justify-content-center">
                    {/* Google Pay - Conditionally rendered based on compatibility */}
                    {!gpayCompatibility?.hideGpay && (
                      <div className="col-6 col-md-5">
                        <div
                          className="payment-app-card border-2 rounded-3 p-3 text-center"
                          style={{
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            backgroundColor:
                              gpayCompatibility?.compatibility === "fair"
                                ? "#fff8e1"
                                : "#e3f2fd",
                            borderColor:
                              gpayCompatibility?.compatibility === "fair"
                                ? "#ffa000"
                                : "#4285f4",
                            border: `2px solid ${
                              gpayCompatibility?.compatibility === "fair"
                                ? "#ffa000"
                                : "#4285f4"
                            }`,
                          }}
                          onClick={() => openUpiApp("gpay")}
                          onMouseEnter={(e) => {
                            e.target.style.transform = "translateY(-2px)";
                            e.target.style.boxShadow =
                              gpayCompatibility?.compatibility === "fair"
                                ? "0 4px 12px rgba(255, 160, 0, 0.2)"
                                : "0 4px 12px rgba(66, 133, 244, 0.2)";
                            e.target.style.backgroundColor =
                              gpayCompatibility?.compatibility === "fair"
                                ? "#ffecb3"
                                : "#bbdefb";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow =
                              "0 2px 4px rgba(0,0,0,0.1)";
                            e.target.style.backgroundColor =
                              gpayCompatibility?.compatibility === "fair"
                                ? "#fff8e1"
                                : "#e3f2fd";
                          }}
                        >
                          <img
                            src="/images/gpay.svg"
                            alt="Google Pay"
                            width="32"
                            height="32"
                            className="mb-2"
                          />
                          <div
                            className={`fw-bold small ${
                              gpayCompatibility?.compatibility === "fair"
                                ? "text-warning"
                                : "text-primary"
                            }`}
                          >
                            Google Pay
                          </div>
                          <div className="text-muted small">
                            {gpayCompatibility?.compatibility === "fair"
                              ? "May Have Issues"
                              : "Instant Payment"}
                          </div>
                          {gpayCompatibility?.warningMessage && (
                            <div
                              className="text-warning"
                              style={{ fontSize: "10px" }}
                            >
                              <i className="ti-alert-triangle"></i>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* BHIM UPI - Block Rectangle - Adjust width when GPay is hidden */}
                    <div
                      className={`col-6 ${
                        gpayCompatibility?.hideGpay ? "col-md-6" : "col-md-5"
                      }`}
                    >
                      <div
                        className="payment-app-card border-2 p-3 text-center"
                        style={{
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          backgroundColor: "#fff3e0",
                          borderColor: "#ff9800",
                          border: "2px solid #ff9800",
                          borderRadius: "8px", // Less rounded for block look
                        }}
                        onClick={() => openUpiApp("bhim")}
                        onMouseEnter={(e) => {
                          e.target.style.transform = "translateY(-2px)";
                          e.target.style.boxShadow =
                            "0 4px 12px rgba(255, 152, 0, 0.2)";
                          e.target.style.backgroundColor = "#ffe0b2";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "translateY(0)";
                          e.target.style.boxShadow =
                            "0 2px 4px rgba(0,0,0,0.1)";
                          e.target.style.backgroundColor = "#fff3e0";
                        }}
                      >
                        <img
                          src="/images/bhim.svg"
                          alt="BHIM UPI"
                          width="32"
                          height="32"
                          className="mb-2"
                        />
                        <div className="text-warning fw-bold small">
                          BHIM UPI
                        </div>
                        <div className="text-muted small">Secure Payment</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center mt-3">
                    <small className="text-muted">
                      <i className="ti-info-circle me-1"></i>
                      Or scan the QR code with any UPI app
                    </small>
                    {gpayCompatibility?.hideGpay && (
                      <div className="mt-2">
                        <small className="text-info">
                          <i className="ti-lightbulb me-1"></i>
                          Google Pay hidden due to compatibility issues - QR
                          scanning works perfectly!
                        </small>
                      </div>
                    )}
                  </div>
                </div>

                {/* Manual Payment Info - Compact */}
                <div className="bg-light rounded p-2 mb-3 payment-section">
                  <div className="row align-items-center">
                    <div className="col-sm-8">
                      <small className="text-muted">UPI ID:</small>
                      <div className="d-flex align-items-center">
                        <code className="small flex-grow-1 me-2">
                          {qrData.paymentMethodInfo.upi_id}
                        </code>
                        <Button variant="primary" size="sm" onClick={copyUpiId}>
                          <i className="ti-clipboard"></i>
                        </Button>
                      </div>
                    </div>
                    <div className="col-sm-4 text-sm-end mt-1 mt-sm-0">
                      <small className="text-muted">Amount:</small>
                      <div className="text-success fw-bold">
                        ₹{qrData.amount}
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" />
                  <small className="text-muted">
                    Manual entry option if QR scanning fails
                  </small>
                </div>

                {/* Next Step Button */}
                <div className="text-center">
                  <Button
                    variant="success"
                    size="lg"
                    onClick={() => setUploadStep("upload")}
                    className="px-4"
                  >
                    I've Made the Payment
                    <i className="ti-arrow-right ms-2"></i>
                  </Button>
                </div>
              </>
            )}

            {uploadStep === "upload" && (
              <div>
                <Alert variant="info" className="mb-3 py-2">
                  <i className="ti-info-alt me-2"></i>
                  <strong>Upload Payment Screenshot</strong>
                  <br />
                  <small>
                    Upload screenshot of successful payment to confirm order
                  </small>
                </Alert>

                <div className="border rounded p-3 mb-3">
                  <Form.Group className="mb-3">
                    <Form.Label className="small">
                      Payment Screenshot
                    </Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      disabled={uploadLoading}
                      size="sm"
                    />
                    <Form.Text className="text-muted">
                      JPG, PNG, WEBP (Max: 5MB)
                    </Form.Text>
                  </Form.Group>

                  {selectedFile && (
                    <div className="mb-3">
                      <div className="bg-light p-2 rounded d-flex align-items-center">
                        <i className="ti-image me-2 text-success"></i>
                        <div className="flex-grow-1">
                          <div className="small fw-bold">
                            {selectedFile.name}
                          </div>
                          <small className="text-muted">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </small>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="row g-2">
                    <div className="col-sm-8">
                      <Button
                        variant="success"
                        onClick={handleUploadScreenshot}
                        disabled={!selectedFile || uploadLoading}
                        className="w-100"
                      >
                        {uploadLoading ? (
                          <>
                            <Spinner
                              animation="border"
                              size="sm"
                              className="me-2"
                            />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <i className="ti-upload me-2"></i>
                            Upload
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="col-sm-4">
                      <Button
                        variant="outline-secondary"
                        onClick={() => setUploadStep("qr")}
                        disabled={uploadLoading}
                        className="w-100"
                      >
                        <i className="ti-arrow-left"></i>
                        <span className="d-none d-sm-inline ms-1">Back</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {uploadStep === "verification" && (
              <div className="text-center">
                <Alert variant="success" className="mb-3 py-2">
                  <i className="ti-check me-2"></i>
                  <strong>Payment Screenshot Uploaded!</strong>
                  <br />
                  <small>Your payment is being verified by the seller</small>
                </Alert>

                <div className="border border-success rounded p-3 bg-light">
                  <i
                    className="ti-check-box text-success mb-2"
                    style={{ fontSize: "2rem" }}
                  ></i>
                  <h6 className="text-success mb-2">Payment Submitted</h6>
                  <p className="text-muted small mb-3">
                    Order is waiting for payment verification. You'll be
                    notified once approved.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      onHide();
                      // Reset state for next time
                      setTimeout(() => {
                        setUploadStep("qr");
                        setSelectedFile(null);
                        setQrData(null);
                      }, 100);
                    }}
                    className="w-100"
                  >
                    <i className="ti-home me-2"></i>
                    Continue Shopping
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Modal.Body>
    </Modal>
  );
}
