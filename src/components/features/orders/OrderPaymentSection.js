"use client";

import { useState } from "react";
import { Card, Button, Badge, Alert, Row, Col } from "react-bootstrap";
import UpiQrPayment from "../payments/UpiQrPayment";
import toastService from "@/utils/toastService";

export default function OrderPaymentSection({ order }) {
  // Don't show payment section for post-payment statuses
  if (
    ["confirmed", "processing", "shipped", "delivered"].includes(order.status)
  ) {
    return null;
  }
  const [showUpiPayment, setShowUpiPayment] = useState(false);

  // Determine payment status
  const getPaymentStatus = () => {
    // Check if order has payment_status field, otherwise infer from order status
    if (order.payment_status) {
      return order.payment_status;
    }

    // Infer payment status from order status
    if (order.status === "pending" || order.status === "confirmed") {
      return "pending";
    } else if (
      order.status === "payment_received" ||
      order.status === "processing" ||
      order.status === "shipped" ||
      order.status === "delivered"
    ) {
      return "paid";
    } else if (order.status === "cancelled") {
      return "cancelled";
    }

    return "pending";
  };

  const paymentStatus = getPaymentStatus();
  const isPaid = paymentStatus === "paid" || paymentStatus === "completed";
  const hasValidAmount = !!(order.total_amount && order.total_amount > 0);
  const canPay =
    paymentStatus === "pending" &&
    order.status !== "cancelled" &&
    hasValidAmount;

  const handleUpiPayment = () => {
    setShowUpiPayment(true);
  };

  const handleCodOption = () => {
    // Note: This would typically update the order to COD payment method
    toastService.info("Contact seller to arrange Cash on Delivery payment");
  };

  const handlePaymentSuccess = (result) => {
    try {
      if (result && result.success) {
        toastService.success("Payment completed successfully!");
        setShowUpiPayment(false);
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toastService.error("Payment verification failed");
        setShowUpiPayment(false);
      }
    } catch (error) {
      toastService.error("Payment processing error");
      setShowUpiPayment(false);
    }
  };

  const getPaymentStatusBadge = () => {
    const isFreeOrder = !order.total_amount || order.total_amount === 0;

    // If order status is payment_received, show that instead of using payment status
    if (order.status === "payment_received") {
      return (
        <Badge bg="success" className="fs-6 d-flex align-items-center">
          <i className="ti-check me-1"></i>
          Payment Received
        </Badge>
      );
    }

    const badges = {
      pending: {
        bg: isFreeOrder ? "success" : "warning",
        text: isFreeOrder ? "Payment Received" : "Payment Pending",
        icon: isFreeOrder ? "ti-check" : "ti-timer",
      },
      paid: { bg: "success", text: "Payment Completed", icon: "ti-check" },
      completed: { bg: "success", text: "Payment Completed", icon: "ti-check" },
      failed: { bg: "danger", text: "Payment Failed", icon: "ti-close" },
      cancelled: { bg: "secondary", text: "Cancelled", icon: "ti-close" },
    };

    const badge = badges[paymentStatus] || badges.pending;

    return (
      <Badge bg={badge.bg} className="fs-6 d-flex align-items-center">
        <i className={`${badge.icon} me-1`}></i>
        {badge.text}
      </Badge>
    );
  };

  return (
    <>
      <Card className={`border-${isPaid ? "success" : "warning"}`}>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <i className="ti-credit-card me-2"></i>
            Payment Information
          </div>
          {getPaymentStatusBadge()}
        </Card.Header>
        <Card.Body>
          <Row className="align-items-center">
            <Col md={8}>
              {isPaid ? (
                <div>
                  <h6 className="text-success mb-2">
                    <i className="ti-check me-2"></i>
                    Payment Completed
                  </h6>
                  <p className="text-muted mb-0">
                    Your payment of{" "}
                    <strong>₹{order.total_amount?.toFixed(2)}</strong> has been
                    received. Your order is being processed.
                  </p>
                </div>
              ) : !hasValidAmount && paymentStatus === "pending" ? (
                <div>
                  <h6 className="text-success mb-2">
                    <i className="ti-gift me-2"></i>
                    Free Order
                  </h6>
                  <p className="text-muted mb-0">
                    This is a complimentary order. No payment required.
                    <br />
                    Your order will be confirmed shortly.
                  </p>
                </div>
              ) : canPay ? (
                <div>
                  <h6 className="text-warning mb-2">
                    <i className="ti-timer me-2"></i>
                    Payment Pending
                  </h6>
                  <p className="text-muted mb-0">
                    Amount to pay:{" "}
                    <strong>₹{order.total_amount?.toFixed(2)}</strong>
                  </p>
                  <p className="small text-muted mb-0">
                    Complete your payment to confirm your order
                  </p>
                </div>
              ) : order.status === "payment_received" ? (
                <div>
                  <h6 className="text-success mb-2">
                    <i className="ti-check me-2"></i>
                    Payment Received
                  </h6>
                  <p className="text-muted mb-0">
                    Your payment of{" "}
                    <strong>₹{order.total_amount?.toFixed(2)}</strong> has been
                    received. Waiting for seller confirmation.
                  </p>
                </div>
              ) : (
                <div>
                  <h6 className="text-muted mb-2">
                    <i className="ti-info-alt me-2"></i>
                    Order {order.status}
                  </h6>
                  <p className="text-muted mb-0">
                    Payment is not available for this order status.
                  </p>
                </div>
              )}
            </Col>

            {canPay && (
              <Col md={4} className="text-md-end">
                <div className="d-grid gap-2">
                  <Button
                    variant="success"
                    onClick={handleUpiPayment}
                    className="mb-2"
                  >
                    <i className="ti-mobile me-2"></i>
                    Pay with UPI
                  </Button>
                  <Button
                    variant="outline-warning"
                    size="sm"
                    onClick={handleCodOption}
                  >
                    <i className="ti-truck me-2"></i>
                    Cash on Delivery
                  </Button>
                </div>
              </Col>
            )}
          </Row>

          {canPay && (
            <Alert variant="info" className="mt-3 mb-0">
              <i className="ti-info-alt me-2"></i>
              <strong>Easy Payment:</strong> Pay now with UPI QR code or arrange
              Cash on Delivery with the seller.
            </Alert>
          )}

          {/* Amount Summary Section */}
          <div className="mt-3 p-3 bg-light rounded">
            <div className="d-flex justify-content-between align-items-center">
              <span className="text-muted">Order Total:</span>
              <div className="d-flex align-items-center">
                {!hasValidAmount ? (
                  <>
                    <span className="text-success fw-bold me-2">₹0.00</span>
                    <Badge bg="success" pill>
                      FREE
                    </Badge>
                  </>
                ) : (
                  <span className="text-primary fw-bold">
                    ₹{order.total_amount?.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
            {!hasValidAmount && (
              <div className="text-center mt-2">
                <small className="text-muted">
                  <i className="ti-info-circle me-1"></i>
                  This order is complimentary - no payment required
                </small>
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* UPI Payment Modal */}
      {showUpiPayment && (
        <UpiQrPayment
          show={showUpiPayment}
          onHide={() => setShowUpiPayment(false)}
          orderData={{
            ...order,
            total_amount: order.total_amount || order.total || 0,
            seller_id: order.seller_id,
          }}
          orderType="regular"
          onPaymentComplete={handlePaymentSuccess}
        />
      )}
    </>
  );
}
