"use client";

import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Modal,
  Alert,
  Spinner,
  ProgressBar,
  Tabs,
  Tab,
} from "react-bootstrap";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import PreBookingService from "@/services/PreBookingService";
import toastService from "@/utils/toastService";
import UserAvatar from "../../common/UserAvatar";
import EmptyState from "../../common/EmptyState";

export default function MyPreBookings() {
  const [activeTab, setActiveTab] = useState("active");
  const [prebookings, setPrebookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedPrebooking, setSelectedPrebooking] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.id) {
      loadPrebookings();
    }
  }, [session]);

  const loadPrebookings = async () => {
    try {
      setLoading(true);
      const data = await PreBookingService.getPreBookingsByUser(
        session.user.id
      );
      setPrebookings(data);
    } catch (error) {
      console.error("Error loading prebookings:", error);
      toastService.error("Failed to load your prebookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPrebooking = async () => {
    if (!selectedPrebooking) return;

    try {
      await PreBookingService.cancelPreBooking(
        selectedPrebooking.id,
        session.user.id,
        cancelReason
      );

      toastService.success("Prebooking cancelled successfully");
      setShowCancelModal(false);
      setSelectedPrebooking(null);
      setCancelReason("");

      // Reload prebookings
      await loadPrebookings();
    } catch (error) {
      console.error("Error cancelling prebooking:", error);
      toastService.error("Failed to cancel prebooking");
    }
  };

  const openCancelModal = (prebooking) => {
    setSelectedPrebooking(prebooking);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: {
        bg: "warning",
        text: "⏳ Pending Review",
        description: "Waiting for seller confirmation",
        progress: 20,
      },
      accepted: {
        bg: "info",
        text: "✅ Accepted",
        description: "Seller has confirmed your order",
        progress: 40,
      },
      in_progress: {
        bg: "primary",
        text: "🌱 Growing",
        description: "Your vegetables are being grown",
        progress: 60,
      },
      ready: {
        bg: "success",
        text: "✅ Ready",
        description: "Ready for pickup or delivery",
        progress: 80,
      },
      delivered: {
        bg: "success",
        text: "📦 Delivered",
        description: "Order completed successfully",
        progress: 100,
      },
      rejected: {
        bg: "danger",
        text: "❌ Rejected",
        description: "Seller cannot fulfill this order",
        progress: 0,
      },
      cancelled: {
        bg: "secondary",
        text: "🚫 Cancelled",
        description: "Order was cancelled",
        progress: 0,
      },
    };

    return (
      statusMap[status] || {
        bg: "secondary",
        text: status,
        description: "Status unknown",
        progress: 0,
      }
    );
  };

  const filterPrebookings = (status) => {
    switch (status) {
      case "active":
        return prebookings.filter(
          (p) => !["delivered", "cancelled", "rejected"].includes(p.status)
        );
      case "completed":
        return prebookings.filter((p) => p.status === "delivered");
      case "cancelled":
        return prebookings.filter((p) =>
          ["cancelled", "rejected"].includes(p.status)
        );
      default:
        return prebookings;
    }
  };

  const getTimeRemaining = (targetDate) => {
    const now = new Date();
    const target = new Date(targetDate);
    const diffTime = target - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return `${diffDays} days`;
  };

  const canCancelPrebooking = (prebooking) => {
    return ["pending", "accepted"].includes(prebooking.status);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" className="mb-3" />
        <p className="text-muted">Loading your prebookings...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">🌱 My Pre-bookings</h1>
          <p className="text-muted mb-0">Track your advance vegetable orders</p>
        </div>
        <Button variant="outline-primary" onClick={loadPrebookings}>
          <i className="ti-refresh me-2"></i>
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div
                className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: "60px", height: "60px" }}
              >
                <i className="ti-shopping-cart text-primary fs-4"></i>
              </div>
              <h5 className="mb-1">{prebookings.length}</h5>
              <p className="text-muted mb-0 small">Total Prebookings</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div
                className="bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: "60px", height: "60px" }}
              >
                <i className="ti-clock text-warning fs-4"></i>
              </div>
              <h5 className="mb-1">{filterPrebookings("active").length}</h5>
              <p className="text-muted mb-0 small">Active Orders</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div
                className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: "60px", height: "60px" }}
              >
                <i className="ti-check text-success fs-4"></i>
              </div>
              <h5 className="mb-1">{filterPrebookings("completed").length}</h5>
              <p className="text-muted mb-0 small">Completed</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div
                className="bg-danger bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: "60px", height: "60px" }}
              >
                <i className="ti-x text-danger fs-4"></i>
              </div>
              <h5 className="mb-1">{filterPrebookings("cancelled").length}</h5>
              <p className="text-muted mb-0 small">Cancelled</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs for different prebooking states */}
      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
        <Tab
          eventKey="active"
          title={`🌱 Active (${filterPrebookings("active").length})`}
        >
          <div className="space-y-4">
            {filterPrebookings("active").length === 0 ? (
              <EmptyState
                icon="ti-shopping-cart"
                title="No active prebookings"
                description="You don't have any active vegetable prebookings.<br/>Browse vegetables and pre-book when items are out of stock."
                action={
                  <Button variant="primary" href="/vegetables">
                    <i className="ti-leaf me-2"></i>
                    Browse Vegetables
                  </Button>
                }
              />
            ) : (
              <Row className="g-4">
                {filterPrebookings("active").map((prebooking) => {
                  const statusInfo = getStatusInfo(prebooking.status);
                  const timeRemaining = getTimeRemaining(
                    prebooking.target_date
                  );

                  return (
                    <Col lg={6} key={prebooking.id}>
                      <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                          {/* Header with vegetable and seller */}
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <h6 className="mb-1">
                                {prebooking.vegetable_name}
                              </h6>
                              <div className="small text-muted d-flex align-items-center">
                                <UserAvatar
                                  user={prebooking.seller}
                                  size={16}
                                  className="me-1"
                                />
                                <span>
                                  {prebooking.seller?.name || "Seller"}
                                </span>
                                <span className="mx-2">•</span>
                                <i className="ti-location-pin me-1"></i>
                                <span>{prebooking.seller?.location}</span>
                              </div>
                            </div>
                            <Badge bg={statusInfo.bg}>{statusInfo.text}</Badge>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <small className="text-muted">Progress</small>
                              <small className="text-muted">
                                {statusInfo.progress}%
                              </small>
                            </div>
                            <ProgressBar
                              now={statusInfo.progress}
                              variant={
                                statusInfo.bg === "danger"
                                  ? "danger"
                                  : "success"
                              }
                              style={{ height: "6px" }}
                            />
                            <small className="text-muted mt-1 d-block">
                              {statusInfo.description}
                            </small>
                          </div>

                          {/* Order Details */}
                          <Row className="g-3 mb-3">
                            <Col xs={6}>
                              <div className="text-center p-2 bg-light rounded">
                                <div className="small text-muted">Quantity</div>
                                <div className="fw-medium">
                                  {prebooking.quantity}
                                  {prebooking.unit}
                                </div>
                              </div>
                            </Col>
                            <Col xs={6}>
                              <div className="text-center p-2 bg-light rounded">
                                <div className="small text-muted">
                                  Total Price
                                </div>
                                <div className="fw-medium text-success">
                                  ₹
                                  {(
                                    (prebooking.final_price ||
                                      prebooking.estimated_price ||
                                      0) * prebooking.quantity
                                  ).toFixed(2)}
                                </div>
                              </div>
                            </Col>
                          </Row>

                          {/* Target Date */}
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <div>
                              <div className="small text-muted">
                                Target Date
                              </div>
                              <div className="fw-medium">
                                {new Date(
                                  prebooking.target_date
                                ).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-end">
                              <div className="small text-muted">
                                Time Remaining
                              </div>
                              <div
                                className={`fw-medium ${
                                  timeRemaining === "Overdue"
                                    ? "text-danger"
                                    : "text-info"
                                }`}
                              >
                                {timeRemaining}
                              </div>
                            </div>
                          </div>

                          {/* Seller Notes */}
                          {prebooking.seller_notes && (
                            <Alert variant="info" className="mb-3">
                              <div className="small">
                                <strong>Seller's Note:</strong>
                                <br />
                                {prebooking.seller_notes}
                              </div>
                            </Alert>
                          )}

                          {/* Actions */}
                          <div className="d-flex gap-2">
                            {prebooking.seller?.whatsapp_number && (
                              <Button
                                variant="outline-success"
                                size="sm"
                                href={`https://wa.me/${
                                  prebooking.seller.whatsapp_number
                                }?text=Hi, I have a prebooking for ${
                                  prebooking.vegetable_name
                                } on ${new Date(
                                  prebooking.target_date
                                ).toLocaleDateString()}`}
                                target="_blank"
                                className="flex-fill"
                              >
                                <i className="ti-brand-whatsapp me-1"></i>
                                Contact Seller
                              </Button>
                            )}

                            {canCancelPrebooking(prebooking) && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => openCancelModal(prebooking)}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            )}
          </div>
        </Tab>

        <Tab
          eventKey="completed"
          title={`✅ Completed (${filterPrebookings("completed").length})`}
        >
          <div className="space-y-4">
            {filterPrebookings("completed").length === 0 ? (
              <EmptyState
                icon="ti-check-circle"
                title="No completed orders"
                description="Your completed prebookings will appear here."
                size="lg"
              />
            ) : (
              <Row className="g-4">
                {filterPrebookings("completed").map((prebooking) => (
                  <Col lg={6} key={prebooking.id}>
                    <Card className="border-0 shadow-sm">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <h6 className="mb-1">
                              {prebooking.vegetable_name}
                            </h6>
                            <div className="small text-muted">
                              Delivered on{" "}
                              {prebooking.actual_delivery_date
                                ? new Date(
                                    prebooking.actual_delivery_date
                                  ).toLocaleDateString()
                                : new Date(
                                    prebooking.target_date
                                  ).toLocaleDateString()}
                            </div>
                          </div>
                          <Badge bg="success">✅ Completed</Badge>
                        </div>

                        <div className="row g-3">
                          <div className="col-6">
                            <div className="text-center p-2 bg-light rounded">
                              <div className="small text-muted">Quantity</div>
                              <div className="fw-medium">
                                {prebooking.quantity}
                                {prebooking.unit}
                              </div>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="text-center p-2 bg-light rounded">
                              <div className="small text-muted">Total Paid</div>
                              <div className="fw-medium text-success">
                                ₹
                                {(
                                  (prebooking.final_price ||
                                    prebooking.estimated_price ||
                                    0) * prebooking.quantity
                                ).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </div>
        </Tab>

        <Tab
          eventKey="cancelled"
          title={`❌ Cancelled (${filterPrebookings("cancelled").length})`}
        >
          <div className="space-y-4">
            {filterPrebookings("cancelled").length === 0 ? (
              <EmptyState
                icon="ti-circle-x"
                title="No cancelled orders"
                description="Your cancelled or rejected prebookings will appear here."
                size="lg"
              />
            ) : (
              <Row className="g-4">
                {filterPrebookings("cancelled").map((prebooking) => {
                  const statusInfo = getStatusInfo(prebooking.status);

                  return (
                    <Col lg={6} key={prebooking.id}>
                      <Card className="border-0 shadow-sm opacity-75">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <h6 className="mb-1">
                                {prebooking.vegetable_name}
                              </h6>
                              <div className="small text-muted">
                                {prebooking.status === "cancelled"
                                  ? "Cancelled by you"
                                  : "Rejected by seller"}
                              </div>
                            </div>
                            <Badge bg={statusInfo.bg}>{statusInfo.text}</Badge>
                          </div>

                          {(prebooking.user_notes ||
                            prebooking.seller_notes) && (
                            <Alert variant="secondary" className="small mb-0">
                              <strong>Reason:</strong>
                              <br />
                              {prebooking.user_notes || prebooking.seller_notes}
                            </Alert>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            )}
          </div>
        </Tab>
      </Tabs>

      {/* Cancel Confirmation Modal */}
      <Modal
        show={showCancelModal}
        onHide={() => setShowCancelModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fs-5">Cancel Prebooking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPrebooking && (
            <>
              <Alert variant="warning">
                <i className="ti-alert-triangle me-2"></i>
                Are you sure you want to cancel your prebooking for{" "}
                <strong>{selectedPrebooking.vegetable_name}</strong>?
              </Alert>

              <div className="mb-3">
                <label className="form-label">
                  Reason for cancellation (optional)
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Let the seller know why you're cancelling..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  maxLength={200}
                />
                <div className="form-text">
                  {cancelReason.length}/200 characters
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowCancelModal(false)}
          >
            Keep Prebooking
          </Button>
          <Button variant="danger" onClick={handleCancelPrebooking}>
            Yes, Cancel Order
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
