"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Spinner,
  Alert,
  Modal,
  Form,
} from "react-bootstrap";
// Using Themify icons instead of lucide-react
import Link from "next/link";

export default function MyVisitsPage() {
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (session) {
      fetchRequests();
    }
  }, [session]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/farm-visits/requests");
      const data = await response.json();

      if (response.ok) {
        setRequests(data.requests || []);
      } else {
        setError(data.error || "Failed to fetch visit requests");
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId, status, reason = "") => {
    try {
      setActionLoading(true);
      const response = await fetch("/api/farm-visits/requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: requestId,
          status,
          rejection_reason: reason,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchRequests(); // Refresh the list
        setShowDetailModal(false);
        alert(`Request ${status} successfully!`);
      } else {
        setError(data.error || `Failed to ${status} request`);
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "approved":
        return "success";
      case "rejected":
        return "danger";
      case "cancelled":
        return "secondary";
      case "completed":
        return "primary";
      default:
        return "light";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <i className="ti-time"></i>;
      case "approved":
        return <i className="ti-check"></i>;
      case "rejected":
        return <i className="ti-close"></i>;
      case "cancelled":
        return <i className="ti-close"></i>;
      case "completed":
        return <i className="ti-check"></i>;
      default:
        return <i className="ti-time"></i>;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (status === "loading") {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <Spinner animation="border" />
      </Container>
    );
  }

  if (!session) {
    return (
      <Container className="py-5 text-center">
        <h3>Please log in to view your visit requests</h3>
        <Button as={Link} href="/login" variant="success" className="mt-3">
          Login
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start">
            <div className="flex-grow-1 mb-3 mb-lg-0">
              <h1 className="text-success mb-2">
                <i
                  className="ti-calendar me-2"
                  style={{ fontSize: "32px" }}
                ></i>
                My Farm Visit Requests
              </h1>
              <p className="text-muted">
                Track and manage your farm visit requests
              </p>
            </div>
            <div className="d-flex justify-content-end align-self-stretch align-self-lg-start">
              <Button
                as={Link}
                href="/farm-visits"
                variant="success"
                className="d-flex align-items-center justify-content-center text-nowrap"
                style={{ minWidth: "180px" }}
              >
                <i className="ti-plus me-2"></i>
                <span className="d-none d-md-inline">Request New Visit</span>
                <span className="d-md-none">New Visit</span>
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="success" />
          <p className="mt-2 text-muted">Loading your requests...</p>
        </div>
      )}

      {/* Requests List */}
      {!loading && (
        <>
          {requests.length === 0 ? (
            <Card className="text-center py-5">
              <Card.Body>
                <i
                  className="ti-calendar text-muted mb-3"
                  style={{ fontSize: "48px", display: "block" }}
                ></i>
                <h5>No visit requests yet</h5>
                <p className="text-muted mb-4">
                  You haven't submitted any farm visit requests yet. Start
                  exploring local farms and request a visit!
                </p>
                <Button as={Link} href="/farm-visits" variant="success">
                  Browse Farms
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <Row>
              {requests.map((request) => (
                <Col md={6} lg={4} key={request.id} className="mb-4">
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body className="d-flex flex-column">
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="card-title text-success mb-0">
                            {request.seller?.name || "Farm Visit"}
                          </h6>
                          <Badge
                            bg={getStatusColor(request.status)}
                            className="ms-2"
                          >
                            {getStatusIcon(request.status)}
                            <span className="ms-1">{request.status}</span>
                          </Badge>
                        </div>

                        <div className="text-muted small mb-2">
                          <i className="ti-calendar me-1"></i>
                          {formatDate(request.requested_date)}
                        </div>

                        <div className="text-muted small mb-2">
                          <i className="ti-time me-1"></i>
                          {formatTime(request.requested_time_start)} -{" "}
                          {formatTime(request.requested_time_end)}
                        </div>

                        <div className="text-muted small">
                          <i className="ti-user me-1"></i>
                          {request.number_of_visitors} visitor
                          {request.number_of_visitors > 1 ? "s" : ""}
                        </div>
                      </div>

                      {request.purpose && (
                        <p className="text-muted small mb-3">
                          <strong>Purpose:</strong>{" "}
                          {request.purpose.substring(0, 80)}
                          {request.purpose.length > 80 && "..."}
                        </p>
                      )}

                      {request.status === "rejected" &&
                        request.rejection_reason && (
                          <Alert variant="danger" className="py-2 small">
                            <strong>Rejected:</strong>{" "}
                            {request.rejection_reason}
                          </Alert>
                        )}

                      {request.status === "approved" && (
                        <Alert variant="success" className="py-2 small">
                          <strong>Approved!</strong> Contact the farmer for
                          final details.
                          {request.seller?.phone_number && (
                            <div className="mt-1">
                              <i className="ti-mobile me-1"></i>
                              {request.seller.phone_number}
                            </div>
                          )}
                        </Alert>
                      )}

                      <div className="mt-auto">
                        <Button
                          variant="outline-success"
                          size="sm"
                          className="w-100 mb-2"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetailModal(true);
                          }}
                        >
                          View Details
                        </Button>

                        {request.status === "pending" && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="w-100"
                            onClick={() =>
                              updateRequestStatus(request.id, "cancelled")
                            }
                            disabled={actionLoading}
                          >
                            Cancel Request
                          </Button>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </>
      )}

      {/* Detail Modal */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Visit Request Details</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selectedRequest && (
            <>
              {/* Status and Basic Info */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>Request Status</h5>
                  <Badge
                    bg={getStatusColor(selectedRequest.status)}
                    className="fs-6"
                  >
                    {getStatusIcon(selectedRequest.status)}
                    <span className="ms-2">
                      {selectedRequest.status.toUpperCase()}
                    </span>
                  </Badge>
                </div>

                <Row>
                  <Col md={6}>
                    <p>
                      <strong>Submitted:</strong>{" "}
                      {new Date(
                        selectedRequest.created_at
                      ).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Farmer:</strong> {selectedRequest.seller?.name}
                    </p>
                    <p>
                      <strong>Date:</strong>{" "}
                      {formatDate(selectedRequest.requested_date)}
                    </p>
                  </Col>
                  <Col md={6}>
                    <p>
                      <strong>Time:</strong>{" "}
                      {formatTime(selectedRequest.requested_time_start)} -{" "}
                      {formatTime(selectedRequest.requested_time_end)}
                    </p>
                    <p>
                      <strong>Visitors:</strong>{" "}
                      {selectedRequest.number_of_visitors}
                    </p>
                    {selectedRequest.seller?.phone_number && (
                      <p>
                        <strong>Farmer Phone:</strong>{" "}
                        {selectedRequest.seller.phone_number}
                      </p>
                    )}
                  </Col>
                </Row>
              </div>

              {/* Contact Details */}
              <div className="mb-4 p-3 bg-light rounded">
                <h6>Your Contact Details</h6>
                <p className="mb-1">
                  <strong>Name:</strong> {selectedRequest.visitor_name}
                </p>
                <p className="mb-1">
                  <strong>Phone:</strong> {selectedRequest.visitor_phone}
                </p>
                {selectedRequest.visitor_email && (
                  <p className="mb-0">
                    <strong>Email:</strong> {selectedRequest.visitor_email}
                  </p>
                )}
              </div>

              {/* Request Details */}
              {selectedRequest.purpose && (
                <div className="mb-3">
                  <h6>Purpose of Visit</h6>
                  <p className="text-muted">{selectedRequest.purpose}</p>
                </div>
              )}

              {selectedRequest.special_requirements && (
                <div className="mb-3">
                  <h6>Special Requirements</h6>
                  <p className="text-muted">
                    {selectedRequest.special_requirements}
                  </p>
                </div>
              )}

              {selectedRequest.message_to_farmer && (
                <div className="mb-3">
                  <h6>Message to Farmer</h6>
                  <p className="text-muted">
                    {selectedRequest.message_to_farmer}
                  </p>
                </div>
              )}

              {/* Admin Notes */}
              {selectedRequest.admin_notes && (
                <div className="mb-3">
                  <h6>Farmer's Notes</h6>
                  <Alert variant="info" className="py-2">
                    {selectedRequest.admin_notes}
                  </Alert>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedRequest.status === "rejected" &&
                selectedRequest.rejection_reason && (
                  <div className="mb-3">
                    <h6>Rejection Reason</h6>
                    <Alert variant="danger" className="py-2">
                      {selectedRequest.rejection_reason}
                    </Alert>
                  </div>
                )}

              {/* Review Section (for completed visits) */}
              {selectedRequest.status === "completed" && (
                <div className="mb-3">
                  <Alert variant="success">
                    <h6>Visit Completed!</h6>
                    <p className="mb-0">
                      We hope you had a great experience! Consider leaving a
                      review to help other visitors.
                    </p>
                  </Alert>
                </div>
              )}
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>

          {selectedRequest?.status === "pending" && (
            <Button
              variant="outline-danger"
              onClick={() =>
                updateRequestStatus(selectedRequest.id, "cancelled")
              }
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Cancelling...
                </>
              ) : (
                "Cancel Request"
              )}
            </Button>
          )}

          {selectedRequest?.status === "approved" &&
            selectedRequest?.seller?.phone_number && (
              <Button
                variant="success"
                onClick={() =>
                  window.open(`tel:${selectedRequest.seller.phone_number}`)
                }
              >
                <i className="ti-mobile me-1"></i>
                Call Farmer
              </Button>
            )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
