"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Badge,
  Button,
  Modal,
  Form,
  Alert,
  Table,
  Spinner,
  Row,
  Col,
  ListGroup,
} from "react-bootstrap";
import { useSession } from "next-auth/react";
import PaymentService from "@/services/PaymentService";
import toastService from "@/utils/toastService";
import AddPaymentMethod from "./AddPaymentMethod";

export default function PaymentVerification({ sellerId = null }) {
  const { data: session } = useSession();
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);

  useEffect(() => {
    loadPendingPayments();
  }, [sellerId]);

  const loadPendingPayments = async () => {
    setLoading(true);
    try {
      const payments = await PaymentService.getPendingPaymentVerifications(
        sellerId
      );
      setPendingPayments(payments);
    } catch (error) {
      console.error("Error loading pending payments:", error);

      // Check if it's a payment system setup issue
      if (
        error.message?.includes("payment transactions") ||
        error.message?.includes("payment system")
      ) {
        toastService.warning(
          "Payment system is not set up yet. Please contact administrator."
        );
      } else {
        toastService.error("Failed to load pending payments");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationClick = (payment) => {
    setSelectedPayment(payment);
    setVerificationNotes("");
    setShowVerificationModal(true);
  };

  const handleVerifyPayment = async (isApproved) => {
    if (!selectedPayment || !session?.user?.id) return;

    setVerificationLoading(true);
    try {
      await PaymentService.verifyPayment(
        selectedPayment.id,
        isApproved,
        session.user.id,
        verificationNotes
      );

      toastService.success(
        isApproved ? "Payment approved successfully!" : "Payment rejected"
      );

      // Refresh the list
      await loadPendingPayments();
      setShowVerificationModal(false);
      setSelectedPayment(null);
    } catch (error) {
      console.error("Error verifying payment:", error);
      toastService.error("Failed to verify payment");
    } finally {
      setVerificationLoading(false);
    }
  };

  const handlePaymentMethodAdded = (paymentMethod) => {
    toastService.success(
      `UPI payment method "${paymentMethod.display_name}" added successfully!`
    );
    // Could refresh any payment methods list here if needed
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getOrderDetails = (payment) => {
    return payment.orders || payment.guest_orders;
  };

  const getOrderType = (payment) => {
    return payment.orders ? "Regular Order" : "Guest Order";
  };

  const getCustomerInfo = (payment) => {
    const order = getOrderDetails(payment);
    if (payment.orders) {
      return {
        name: order.users?.name || "Unknown User",
        email: order.users?.email || "",
        phone: order.contact_number || "",
      };
    } else {
      return {
        name: order.guest_name || "Unknown Guest",
        email: order.guest_email || "",
        phone: order.guest_phone || "",
      };
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status" className="mb-3" />
        <div>Loading pending payment verifications...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>
          <i className="ti-credit-card me-2"></i>
          Payment Verification
        </h4>
        <div className="d-flex gap-2">
          <Button
            variant="success"
            onClick={() => setShowAddPaymentMethod(true)}
            size="sm"
          >
            <i className="ti-plus me-1"></i>
            Add UPI Method
          </Button>
          <Button
            variant="outline-primary"
            onClick={loadPendingPayments}
            size="sm"
          >
            <i className="ti-reload me-1"></i>
            Refresh
          </Button>
        </div>
      </div>

      {pendingPayments.length === 0 ? (
        <Alert variant="info" className="text-center">
          <i className="ti-info-alt me-2"></i>
          No pending payment verifications at this time.
          <div className="mt-2">
            <small className="text-muted">
              If you're expecting payments to verify, make sure the payment
              system is properly set up in the database.
            </small>
          </div>
        </Alert>
      ) : (
        <div className="row">
          {pendingPayments.map((payment) => {
            const order = getOrderDetails(payment);
            const customer = getCustomerInfo(payment);

            return (
              <div key={payment.id} className="col-lg-6 col-xl-4 mb-4">
                <Card className="h-100 border-warning">
                  <Card.Header className="bg-warning bg-opacity-10">
                    <div className="d-flex justify-content-between align-items-center">
                      <Badge bg="warning" text="dark">
                        <i className="ti-clock me-1"></i>
                        Pending Verification
                      </Badge>
                      <small className="text-muted">
                        {getOrderType(payment)}
                      </small>
                    </div>
                  </Card.Header>

                  <Card.Body>
                    <div className="mb-3">
                      <strong>Order ID:</strong>
                      <br />
                      <code>#{order.id.slice(-8)}</code>
                    </div>

                    <div className="mb-3">
                      <strong>Customer:</strong>
                      <br />
                      <span>{customer.name}</span>
                      {customer.phone && (
                        <>
                          <br />
                          <small className="text-muted">{customer.phone}</small>
                        </>
                      )}
                    </div>

                    <div className="mb-3">
                      <strong>Amount:</strong>
                      <br />
                      <span className="fs-5 text-success fw-bold">
                        {formatCurrency(order.total_amount)}
                      </span>
                    </div>

                    <div className="mb-3">
                      <strong>Payment Method:</strong>
                      <br />
                      <Badge bg="primary">UPI QR Code</Badge>
                    </div>

                    <div className="mb-3">
                      <strong>Submitted:</strong>
                      <br />
                      <small className="text-muted">
                        {formatDate(payment.created_at)}
                      </small>
                    </div>

                    {payment.screenshot_url && (
                      <div className="mb-3">
                        <strong>Payment Screenshot:</strong>
                        <br />
                        <img
                          src={payment.screenshot_url}
                          alt="Payment Screenshot"
                          className="img-thumbnail mt-2"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "200px",
                            cursor: "pointer",
                          }}
                          onClick={() =>
                            window.open(payment.screenshot_url, "_blank")
                          }
                        />
                        <br />
                        <small className="text-muted">
                          Click to view full size
                        </small>
                      </div>
                    )}
                  </Card.Body>

                  <Card.Footer className="bg-transparent">
                    <div className="d-grid">
                      <Button
                        variant="primary"
                        onClick={() => handleVerificationClick(payment)}
                      >
                        <i className="ti-check me-2"></i>
                        Verify Payment
                      </Button>
                    </div>
                  </Card.Footer>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Verification Modal */}
      <Modal
        show={showVerificationModal}
        onHide={() => setShowVerificationModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="ti-check-box me-2"></i>
            Verify Payment
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selectedPayment && (
            <>
              {/* Order Summary */}
              <Card className="mb-4">
                <Card.Body>
                  <h6 className="card-title">Order Details</h6>
                  <Row>
                    <Col md={6}>
                      <strong>Order ID:</strong>
                      <br />
                      <code>
                        #{getOrderDetails(selectedPayment).id.slice(-8)}
                      </code>
                    </Col>
                    <Col md={6}>
                      <strong>Amount:</strong>
                      <br />
                      <span className="fs-5 text-success fw-bold">
                        {formatCurrency(
                          getOrderDetails(selectedPayment).total_amount
                        )}
                      </span>
                    </Col>
                  </Row>

                  <hr />

                  <div className="row">
                    <Col md={6}>
                      <strong>Customer:</strong>
                      <br />
                      {getCustomerInfo(selectedPayment).name}
                      {getCustomerInfo(selectedPayment).phone && (
                        <>
                          <br />
                          <small className="text-muted">
                            {getCustomerInfo(selectedPayment).phone}
                          </small>
                        </>
                      )}
                    </Col>
                    <Col md={6}>
                      <strong>Order Type:</strong>
                      <br />
                      <Badge bg="info">{getOrderType(selectedPayment)}</Badge>
                    </Col>
                  </div>
                </Card.Body>
              </Card>

              {/* Payment Screenshot */}
              {selectedPayment.screenshot_url && (
                <Card className="mb-4">
                  <Card.Body>
                    <h6 className="card-title">Payment Screenshot</h6>
                    <div className="text-center">
                      <img
                        src={selectedPayment.screenshot_url}
                        alt="Payment Screenshot"
                        className="img-fluid rounded border"
                        style={{ maxHeight: "400px", cursor: "pointer" }}
                        onClick={() =>
                          window.open(selectedPayment.screenshot_url, "_blank")
                        }
                      />
                      <br />
                      <small className="text-muted mt-2 d-block">
                        Click image to view in full size
                      </small>
                    </div>
                  </Card.Body>
                </Card>
              )}

              {/* Verification Notes */}
              <Form.Group className="mb-4">
                <Form.Label>Verification Notes (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Add any notes about this payment verification..."
                  disabled={verificationLoading}
                />
              </Form.Group>

              <Alert variant="warning" className="mb-0">
                <i className="ti-alert-triangle me-2"></i>
                <strong>Important:</strong> Please verify the payment amount and
                screenshot carefully before approving. This action cannot be
                undone.
              </Alert>
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowVerificationModal(false)}
            disabled={verificationLoading}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => handleVerifyPayment(false)}
            disabled={verificationLoading}
            className="me-2"
          >
            {verificationLoading ? (
              <Spinner animation="border" size="sm" className="me-2" />
            ) : (
              <i className="ti-close me-2"></i>
            )}
            Reject Payment
          </Button>
          <Button
            variant="success"
            onClick={() => handleVerifyPayment(true)}
            disabled={verificationLoading}
          >
            {verificationLoading ? (
              <Spinner animation="border" size="sm" className="me-2" />
            ) : (
              <i className="ti-check me-2"></i>
            )}
            Approve Payment
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Payment Method Modal */}
      <AddPaymentMethod
        show={showAddPaymentMethod}
        onHide={() => setShowAddPaymentMethod(false)}
        onSuccess={handlePaymentMethodAdded}
      />
    </div>
  );
}
