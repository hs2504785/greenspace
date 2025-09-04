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
import { isMapLink, getLocationDisplayText } from "@/utils/locationUtils";

export default function MyPreBookings() {
  const [activeView, setActiveView] = useState("active");
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
    setShowCancelModal(true);
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case "pending":
        return {
          bg: "warning",
          text: "⏳ Pending Review",
          progress: 20,
          description: "Waiting for seller confirmation",
        };
      case "accepted":
        return {
          bg: "info",
          text: "🌱 Growing",
          progress: 60,
          description: "Your vegetables are being grown",
        };
      case "ready":
        return {
          bg: "success",
          text: "✅ Ready",
          progress: 90,
          description: "Ready for harvest and delivery",
        };
      case "delivered":
        return {
          bg: "success",
          text: "🎉 Delivered",
          progress: 100,
          description: "Order completed successfully",
        };
      case "cancelled":
        return {
          bg: "danger",
          text: "❌ Cancelled",
          progress: 0,
          description: "Order was cancelled",
        };
      case "rejected":
        return {
          bg: "danger",
          text: "❌ Rejected",
          progress: 0,
          description: "Order was rejected by seller",
        };
      default:
        return {
          bg: "secondary",
          text: status,
          progress: 0,
          description: "Status unknown",
        };
    }
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
    if (!targetDate) return "N/A";

    const now = new Date();
    const target = new Date(targetDate);

    // Check if the date is valid
    if (isNaN(target.getTime())) return "Invalid Date";

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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString();
  };

  const renderContent = () => {
    const filteredData = filterPrebookings(activeView);

    return (
      <Card className="border-0 shadow-sm">
        <Card.Body>
          {filteredData.length === 0 ? (
            <div className="text-center text-muted py-5">
              {activeView === "active" && (
                <>
                  <i className="ti-time text-warning fs-1 d-block mb-3"></i>
                  <h5>No active prebookings</h5>
                  <p>
                    You don't have any active vegetable prebookings.
                    <br />
                    Browse vegetables and pre-book when items are out of stock.
                  </p>
                  <Button variant="primary" href="/vegetables" className="mt-3">
                    <i className="ti-leaf me-2"></i>
                    Browse Vegetables
                  </Button>
                </>
              )}
              {activeView === "completed" && (
                <>
                  <i className="ti-check text-success fs-1 d-block mb-3"></i>
                  <h5>No completed orders</h5>
                  <p>Your completed prebookings will appear here.</p>
                </>
              )}
              {activeView === "cancelled" && (
                <>
                  <i className="ti-close text-danger fs-1 d-block mb-3"></i>
                  <h5>No cancelled orders</h5>
                  <p>
                    Your cancelled or rejected prebookings will appear here.
                  </p>
                </>
              )}
            </div>
          ) : (
            <Row className="g-4">
              {filteredData.map((prebooking) => {
                if (activeView === "active") {
                  const statusInfo = getStatusInfo(prebooking.status);
                  const timeRemaining = getTimeRemaining(
                    prebooking.target_date
                  );

                  return (
                    <Col lg={6} key={prebooking.id}>
                      <Card
                        className="border shadow rounded-3 h-100"
                        style={{
                          borderColor: "#e3e6f0",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <Card.Body>
                          {/* Header with vegetable and seller */}
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <h6 className="mb-1">
                                {prebooking.vegetable_name}
                              </h6>
                              <div className="small text-muted">
                                <div className="d-flex align-items-center mb-1">
                                  <UserAvatar
                                    user={prebooking.seller}
                                    size={16}
                                    className="me-1"
                                  />
                                  <span>
                                    {prebooking.seller?.name || "Seller"}
                                  </span>
                                </div>
                                {prebooking.seller?.location && (
                                  <div className="d-flex align-items-start">
                                    <i className="ti-location-pin me-1 mt-1 flex-shrink-0"></i>
                                    <div
                                      className="flex-grow-1"
                                      style={{
                                        lineHeight: "1.3",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      {isMapLink(prebooking.seller.location) ? (
                                        <Button
                                          variant="link"
                                          size="sm"
                                          className="p-0 text-decoration-none text-success fw-medium text-start"
                                          style={{
                                            fontSize: "inherit",
                                            lineHeight: "inherit",
                                            whiteSpace: "normal",
                                            textAlign: "left",
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(
                                              prebooking.seller.location,
                                              "_blank"
                                            );
                                          }}
                                        >
                                          {getLocationDisplayText(
                                            prebooking.seller.location
                                          )}
                                          <i className="ti ti-external-link ms-1 small"></i>
                                        </Button>
                                      ) : (
                                        <span>
                                          {prebooking.seller.location}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
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
                                  Est. Price
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
                            <Col xs={6}>
                              <div className="text-center p-2 bg-light rounded">
                                <div className="small text-muted">
                                  Target Date
                                </div>
                                <div className="fw-medium">
                                  {formatDate(prebooking.target_date)}
                                </div>
                              </div>
                            </Col>
                            <Col xs={6}>
                              <div className="text-center p-2 bg-light rounded">
                                <div className="small text-muted">
                                  Time Left
                                </div>
                                <div
                                  className={`fw-medium ${
                                    timeRemaining === "Overdue"
                                      ? "text-danger"
                                      : ""
                                  }`}
                                >
                                  {timeRemaining}
                                </div>
                              </div>
                            </Col>
                          </Row>

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
                                } on ${formatDate(prebooking.target_date)}`}
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
                } else if (activeView === "completed") {
                  return (
                    <Col lg={6} key={prebooking.id}>
                      <Card
                        className="border shadow rounded-3 h-100"
                        style={{
                          borderColor: "#e3e6f0",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <h6 className="mb-1">
                                {prebooking.vegetable_name}
                              </h6>
                              <div className="small text-muted">
                                Delivered on{" "}
                                {prebooking.actual_delivery_date
                                  ? formatDate(prebooking.actual_delivery_date)
                                  : formatDate(prebooking.target_date)}
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
                                <div className="small text-muted">
                                  Total Paid
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
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                } else if (activeView === "cancelled") {
                  const statusInfo = getStatusInfo(prebooking.status);
                  return (
                    <Col lg={6} key={prebooking.id}>
                      <Card
                        className="border shadow rounded-3 h-100 opacity-75"
                        style={{
                          borderColor: "#e3e6f0",
                          transition: "all 0.2s ease",
                        }}
                      >
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
                }
                return null;
              })}
            </Row>
          )}
        </Card.Body>
      </Card>
    );
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
    <Container fluid className="pb-4">
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
          <Card
            className="border shadow-sm rounded-3 h-100"
            style={{ borderColor: "#e3e6f0", transition: "all 0.2s ease" }}
          >
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
          <Card
            className={`border shadow-sm rounded-3 h-100 ${
              activeView === "active" ? "border-warning" : ""
            }`}
            style={{
              borderColor: activeView === "active" ? "#ffc107" : "#e3e6f0",
              transition: "all 0.2s ease",
              cursor: "pointer",
              borderWidth: activeView === "active" ? "2px" : "1px",
            }}
            onClick={() => setActiveView("active")}
          >
            <Card.Body className="text-center">
              <div
                className="bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: "60px", height: "60px" }}
              >
                <i className="ti-time text-warning fs-4"></i>
              </div>
              <h5 className="mb-1">{filterPrebookings("active").length}</h5>
              <p className="text-muted mb-0 small">Active Orders</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card
            className={`border shadow-sm rounded-3 h-100 ${
              activeView === "completed" ? "border-success" : ""
            }`}
            style={{
              borderColor: activeView === "completed" ? "#198754" : "#e3e6f0",
              transition: "all 0.2s ease",
              cursor: "pointer",
              borderWidth: activeView === "completed" ? "2px" : "1px",
            }}
            onClick={() => setActiveView("completed")}
          >
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
          <Card
            className={`border shadow-sm rounded-3 h-100 ${
              activeView === "cancelled" ? "border-danger" : ""
            }`}
            style={{
              borderColor: activeView === "cancelled" ? "#dc3545" : "#e3e6f0",
              transition: "all 0.2s ease",
              cursor: "pointer",
              borderWidth: activeView === "cancelled" ? "2px" : "1px",
            }}
            onClick={() => setActiveView("cancelled")}
          >
            <Card.Body className="text-center">
              <div
                className="bg-danger bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: "60px", height: "60px" }}
              >
                <i className="ti-close text-danger fs-4"></i>
              </div>
              <h5 className="mb-1">{filterPrebookings("cancelled").length}</h5>
              <p className="text-muted mb-0 small">Cancelled</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Content based on selected tile */}
      {renderContent()}

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
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
            Keep Prebooking
          </Button>
          <Button variant="danger" onClick={handleCancelPrebooking}>
            Cancel Prebooking
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
