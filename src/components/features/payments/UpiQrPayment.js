"use client";

import { useState, useEffect } from "react";
import { Modal, Card, Button, Form, Alert, Spinner } from "react-bootstrap";
import PaymentService from "@/services/PaymentService";
import toastService from "@/utils/toastService";

export default function UpiQrPayment({
  show,
  onHide,
  orderData,
  orderType = "regular",
  onPaymentComplete,
}) {
  console.log("🚨🚨🚨 UPI COMPONENT v4.0 - SUPER VISIBLE PROPS DEBUG");
  console.log("🔍 Component props:", {
    show,
    orderData,
    orderType,
    orderDataType: typeof orderData,
    orderDataKeys: orderData ? Object.keys(orderData) : "NULL_OR_UNDEFINED",
  });

  // TRACE THE CALL STACK TO IDENTIFY PARENT COMPONENT
  console.log("🕵️‍♀️ UPI COMPONENT CALL STACK TRACE:");
  console.trace("UPI Component rendered from:");

  // SUPER VISIBLE ALERT FOR DEBUGGING
  if (typeof window !== "undefined" && orderData) {
    console.log(
      "🔥🔥🔥 UPI ALERT: Received orderData with total_amount:",
      orderData.total_amount
    );
    console.log(
      "🔥🔥🔥 UPI ALERT: Received orderData with seller_id:",
      orderData.seller_id
    );
  }

  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadStep, setUploadStep] = useState("qr"); // 'qr', 'upload', 'verification'

  useEffect(() => {
    if (show && orderData) {
      generateQrCode();
    }
  }, [show, orderData]);

  // Test static QR loading
  useEffect(() => {
    if (show) {
      console.log("🎯 Payment Modal opened for order:", orderData?.id);
      console.log(
        "💰 Order amount:",
        orderData?.total_amount || orderData?.total
      );
    }
  }, [show]);

  const generateQrCode = async () => {
    setLoading(true);

    console.log("🚨 UPI EMERGENCY DEBUG v3.0 - FULL TRACE");
    console.log("🔍 Raw orderData type:", typeof orderData);
    console.log("🔍 Raw orderData value:", orderData);
    console.log("🔍 OrderData stringify:", JSON.stringify(orderData, null, 2));
    console.log("🔍 OrderData is null?", orderData === null);
    console.log("🔍 OrderData is undefined?", orderData === undefined);

    // Validate orderData first
    console.log("🔍 UPI Component received orderData:", {
      id: orderData?.id,
      total_amount: orderData?.total_amount,
      total: orderData?.total,
      seller_id: orderData?.seller_id,
      allKeys: Object.keys(orderData || {}),
      allValues: Object.entries(orderData || {}),
      fullOrderData: orderData,
    });

    if (!orderData || !orderData.id) {
      console.error("❌ Invalid orderData received:", orderData);
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

      if (app === "gpay") {
        // Enhanced Google Pay handling with multiple fallback strategies
        const gpayParams = new URLSearchParams({
          pa: params.get("pa") || "",
          pn: params.get("pn") || "",
          am: params.get("am") || "",
          tr: params.get("tr") || "",
          tn: params.get("tn") || "",
          mc: params.get("mc") || "5411",
          cu: params.get("cu") || "INR",
        });

        // Platform-specific Google Pay handling
        if (platform === "android") {
          // Android: Try multiple schemes
          const androidSchemes = [
            `tez://upi/pay?${gpayParams.toString()}`,
            `googlepay://upi/pay?${gpayParams.toString()}`,
            `intent://pay?${gpayParams.toString()}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`,
          ];

          // Try each scheme with small delays
          androidSchemes.forEach((scheme, index) => {
            setTimeout(() => {
              try {
                const linkElement = document.createElement("a");
                linkElement.href = scheme;
                linkElement.style.display = "none";
                document.body.appendChild(linkElement);
                linkElement.click();
                document.body.removeChild(linkElement);
                console.log(`Tried Android scheme ${index + 1}:`, scheme);
              } catch (error) {
                console.log(`Android scheme ${index + 1} failed:`, error);
              }
            }, index * 500);
          });
        } else if (platform === "ios") {
          // iOS: Use universal links and deep links
          const iosSchemes = [
            `tez://upi/pay?${gpayParams.toString()}`,
            `https://pay.google.com/gp/p/ui/pay?${gpayParams.toString()}`,
          ];

          iosSchemes.forEach((scheme, index) => {
            setTimeout(() => {
              try {
                if (index === 0) {
                  // First try deep link
                  window.location.href = scheme;
                } else {
                  // Then try web fallback
                  window.open(scheme, "_blank", "noopener,noreferrer");
                }
                console.log(`Tried iOS scheme ${index + 1}:`, scheme);
              } catch (error) {
                console.log(`iOS scheme ${index + 1} failed:`, error);
              }
            }, index * 1000);
          });
        } else {
          // Desktop: Direct to web version
          const webUrl = `https://pay.google.com/gp/p/ui/pay?${gpayParams.toString()}`;
          window.open(webUrl, "_blank", "noopener,noreferrer");
        }

        // Always show QR code guidance for mobile users
        if (platform !== "desktop") {
          setTimeout(() => {
            toastService.info(
              "If Google Pay doesn't open, please scan the QR code manually",
              {
                autoClose: 8000,
              }
            );
          }, 3000);
        }

        toastService.info("Opening Google Pay...");
        return;
      } else {
        // BHIM and other UPI apps - use standard UPI URL
        const linkElement = document.createElement("a");
        linkElement.href = qrData.upiString;
        linkElement.style.display = "none";
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
      }

      // Show success message
      toastService.info(`Opening ${app.toUpperCase()}...`);

      // Fallback guidance for all apps
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
      toastService.error(
        `Failed to open ${app.toUpperCase()}. Please scan the QR code manually.`
      );
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

                {/* UPI App Buttons - Google Pay & BHIM Only */}
                <div className="mb-3 payment-section">
                  <small className="text-muted d-block mb-2">
                    <i className="ti-mobile me-1"></i>
                    Quick pay with your UPI app:
                  </small>
                  <div className="row g-2 justify-content-center">
                    <div className="col-6 col-md-4">
                      <Button
                        variant="outline-primary"
                        className="w-100 d-flex align-items-center justify-content-center"
                        onClick={() => openUpiApp("gpay")}
                        size="sm"
                      >
                        <img
                          src="/images/gpay.svg"
                          alt="Google Pay"
                          width="20"
                          height="20"
                          className="me-1"
                        />
                        <span className="d-none d-sm-inline">Google Pay</span>
                        <span className="d-sm-none">GPay</span>
                      </Button>
                    </div>
                    <div className="col-6 col-md-4">
                      <Button
                        variant="outline-warning"
                        className="w-100 d-flex align-items-center justify-content-center"
                        onClick={() => openUpiApp("bhim")}
                        size="sm"
                      >
                        <img
                          src="/images/bhim.svg"
                          alt="BHIM UPI"
                          width="20"
                          height="20"
                          className="me-1"
                        />
                        <span className="d-none d-sm-inline">BHIM UPI</span>
                        <span className="d-sm-none">BHIM</span>
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <small className="text-info">
                      <i className="ti-info-alt me-1"></i>
                      If app doesn't open, scan the QR code manually
                    </small>
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
