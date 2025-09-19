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
  Modal,
  Form,
  Nav,
  Tab,
  Table,
} from "react-bootstrap";
// Using Themify icons instead of lucide-react
import Link from "next/link";
import toastService from "@/utils/toastService";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import FarmVisitWhatsAppActions from "@/components/features/farm-visits/WhatsAppActions";

export default function ManageFarmVisitsPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("requests");
  const [requests, setRequests] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedAvailability, setSelectedAvailability] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState(null);
  const [farmDetails, setFarmDetails] = useState(null);

  // Form states
  const [requestForm, setRequestForm] = useState({
    status: "",
    admin_notes: "",
    rejection_reason: "",
  });

  const [availabilityForm, setAvailabilityForm] = useState({
    date: "",
    start_time: "",
    end_time: "",
    max_visitors: 5,
    price_per_person: 0,
    is_available: true,
    visit_type: "farm",
    location_type: "farm",
    space_description: "",
    activity_type: "farm_tour",
    special_notes: "",
  });

  useEffect(() => {
    if (session) {
      fetchRequests();
      fetchAvailability();
      fetchFarmDetails();
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
        toastService.error(data.error || "Failed to fetch requests");
      }
    } catch (err) {
      toastService.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      const params = new URLSearchParams();
      if (session?.user?.role === "seller") {
        params.append("sellerId", session.user.id);
      }

      const response = await fetch(`/api/farm-visits/availability?${params}`);
      const data = await response.json();

      if (response.ok) {
        setAvailability(data.availability || []);
      } else {
        toastService.error(data.error || "Failed to fetch availability");
      }
    } catch (err) {
      toastService.error("Failed to connect to server");
    }
  };

  const fetchFarmDetails = async () => {
    try {
      if (session?.user?.role === "seller") {
        // Fetch seller's farm profile
        const response = await fetch(`/api/sellers/${session.user.id}/profile`);
        const data = await response.json();

        if (response.ok) {
          setFarmDetails(data.profile);
        }
      } else if (
        session?.user?.role === "admin" ||
        session?.user?.role === "superadmin"
      ) {
        // For admins, we'll fetch farm details when viewing specific requests
        // This will be handled in the openRequestModal function
      }
    } catch (err) {
      console.error("Failed to fetch farm details:", err);
    }
  };

  const updateRequest = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const response = await fetch("/api/farm-visits/requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedRequest.id,
          ...requestForm,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toastService.success("Request updated successfully!");

        // WhatsApp messages are now sent automatically by the server
        if (
          requestForm.status === "approved" ||
          requestForm.status === "rejected"
        ) {
          toastService.success(
            `WhatsApp ${requestForm.status} message sent automatically to visitor`
          );
        }

        setShowRequestModal(false);
        await fetchRequests();
        resetRequestForm();
      } else {
        toastService.error(data.error || "Failed to update request");
      }
    } catch (err) {
      toastService.error("Failed to connect to server");
    } finally {
      setActionLoading(false);
    }
  };

  const createAvailability = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const response = await fetch("/api/farm-visits/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(availabilityForm),
      });

      const data = await response.json();

      if (response.ok) {
        toastService.success("Availability slot created successfully!");
        setShowAvailabilityModal(false);
        await fetchAvailability();
        resetAvailabilityForm();
      } else {
        toastService.error(data.error || "Failed to create availability slot");
      }
    } catch (err) {
      toastService.error("Failed to connect to server");
    } finally {
      setActionLoading(false);
    }
  };

  const updateAvailability = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const response = await fetch("/api/farm-visits/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedAvailability.id,
          ...availabilityForm,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toastService.success("Availability slot updated successfully!");
        setShowAvailabilityModal(false);
        await fetchAvailability();
        resetAvailabilityForm();
      } else {
        toastService.error(data.error || "Failed to update availability slot");
      }
    } catch (err) {
      toastService.error("Failed to connect to server");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSlot = (slot) => {
    setSlotToDelete(slot);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!slotToDelete) return;

    try {
      setDeleteLoading(true);
      const response = await fetch(
        `/api/farm-visits/availability?id=${slotToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toastService.success("Availability slot deleted successfully!");
        await fetchAvailability();
        setShowDeleteModal(false);
        setSlotToDelete(null);
      } else {
        const data = await response.json();
        toastService.error(data.error || "Failed to delete availability slot");
      }
    } catch (err) {
      toastService.error("Failed to connect to server");
    } finally {
      setDeleteLoading(false);
    }
  };

  const resetRequestForm = () => {
    setRequestForm({
      status: "",
      admin_notes: "",
      rejection_reason: "",
    });
    setSelectedRequest(null);
  };

  const resetAvailabilityForm = () => {
    setAvailabilityForm({
      date: "",
      start_time: "",
      end_time: "",
      max_visitors: 5,
      price_per_person: 0,
      is_available: true,
      visit_type: "farm",
      location_type: "farm",
      space_description: "",
      activity_type: "farm_tour",
      special_notes: "",
    });
    setSelectedAvailability(null);
  };

  const openRequestModal = async (request) => {
    setSelectedRequest(request);
    setRequestForm({
      status: request.status,
      admin_notes: request.admin_notes || "",
      rejection_reason: request.rejection_reason || "",
    });

    // Fetch farm details for admin users
    if (
      (session?.user?.role === "admin" ||
        session?.user?.role === "superadmin") &&
      request.seller_id
    ) {
      try {
        const response = await fetch(
          `/api/sellers/${request.seller_id}/profile`
        );
        const data = await response.json();

        if (response.ok) {
          setFarmDetails(data.profile);
        }
      } catch (err) {
        console.error("Failed to fetch seller farm details:", err);
      }
    }

    setShowRequestModal(true);
  };

  const openAvailabilityModal = (slot = null) => {
    if (slot) {
      setSelectedAvailability(slot);
      setAvailabilityForm({
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        max_visitors: slot.max_visitors,
        price_per_person: slot.price_per_person || 0,
        is_available: slot.is_available,
        visit_type: slot.visit_type || "farm",
        location_type: slot.location_type || "farm",
        space_description: slot.space_description || "",
        activity_type: slot.activity_type || "farm_tour",
        special_notes: slot.special_notes || "",
      });
    } else {
      resetAvailabilityForm();
    }
    setShowAvailabilityModal(true);
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
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

  if (
    !session ||
    !["seller", "admin", "superadmin"].includes(session.user.role)
  ) {
    return (
      <Container className="py-5 text-center">
        <h3>Access Denied</h3>
        <p>You need to be a seller or admin to access this page.</p>
        <Button as={Link} href="/" variant="success">
          Go Home
        </Button>
      </Container>
    );
  }

  return (
    <>
      <Container>
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <h1 className="text-success mb-3">
              <i className="ti-calendar me-2" style={{ fontSize: "32px" }}></i>
              Manage Farm Visits
            </h1>
            <p className="text-muted">
              {session.user.role === "seller"
                ? "Manage your farm visit requests and availability"
                : "Manage all farm visit requests and availability across the platform"}
            </p>
          </Col>
        </Row>

        {/* Tabs */}
        <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
          <Nav variant="tabs" className="mb-4">
            <Nav.Item>
              <Nav.Link eventKey="requests">
                <i className="ti-comment me-2"></i>
                Visit Requests
                {requests.filter((r) => r.status === "pending").length > 0 && (
                  <Badge bg="warning" className="ms-2">
                    {requests.filter((r) => r.status === "pending").length}
                  </Badge>
                )}
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="availability">
                <i className="ti-calendar me-2"></i>
                Availability Management
              </Nav.Link>
            </Nav.Item>
          </Nav>

          <Tab.Content>
            {/* Requests Tab */}
            <Tab.Pane eventKey="requests">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="success" />
                </div>
              ) : (
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">Visit Requests</h5>
                  </Card.Header>
                  <Card.Body>
                    {requests.length === 0 ? (
                      <div className="text-center py-4">
                        <i
                          className="ti-comment text-muted mb-3"
                          style={{ fontSize: "48px", display: "block" }}
                        ></i>
                        <h6>No visit requests yet</h6>
                        <p className="text-muted">
                          Visit requests will appear here when customers submit
                          them.
                        </p>
                      </div>
                    ) : (
                      <div
                        className="table-responsive"
                        style={{ overflow: "visible" }}
                      >
                        <Table
                          hover
                          className="mb-0 bg-white rounded-3 shadow-sm"
                          style={{
                            "--bs-table-hover-bg": "rgba(0, 0, 0, 0.075)",
                            minWidth: "1200px", // Ensure horizontal scroll when needed
                          }}
                        >
                          <thead className="table-light">
                            <tr>
                              <th
                                className="border-0 ps-3"
                                style={{ minWidth: "180px" }}
                              >
                                Visitor
                              </th>
                              <th
                                className="border-0"
                                style={{ minWidth: "160px" }}
                              >
                                Date & Time
                              </th>
                              <th
                                className="border-0 text-center"
                                style={{ minWidth: "80px" }}
                              >
                                Guests
                              </th>
                              <th
                                className="border-0 text-center"
                                style={{ minWidth: "100px" }}
                              >
                                Status
                              </th>
                              <th
                                className="border-0"
                                style={{ minWidth: "200px" }}
                              >
                                Purpose
                              </th>
                              <th
                                className="border-0"
                                style={{ minWidth: "120px" }}
                              >
                                Phone
                              </th>
                              {session.user.role === "admin" && (
                                <th
                                  className="border-0"
                                  style={{ minWidth: "120px" }}
                                >
                                  User
                                </th>
                              )}
                              <th
                                className="border-0 text-center"
                                style={{ minWidth: "200px" }}
                              >
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {requests.map((request) => (
                              <tr key={request.id} className="align-middle">
                                <td className="text-nowrap">
                                  <strong>{request.visitor_name}</strong>
                                </td>
                                <td className="text-nowrap">
                                  <div>
                                    {formatDate(request.requested_date)}
                                  </div>
                                  <small className="text-muted">
                                    {formatTime(request.requested_time_start)} -{" "}
                                    {formatTime(request.requested_time_end)}
                                  </small>
                                </td>
                                <td className="text-center">
                                  <Badge bg="light" text="dark">
                                    <i className="ti-user me-1"></i>
                                    {request.number_of_visitors}
                                  </Badge>
                                </td>
                                <td className="text-center">
                                  <Badge bg={getStatusColor(request.status)}>
                                    {request.status}
                                  </Badge>
                                </td>
                                <td>
                                  <div
                                    className="text-truncate"
                                    style={{ maxWidth: "180px" }}
                                    title={
                                      request.purpose || "No purpose specified"
                                    }
                                  >
                                    {request.purpose || (
                                      <span className="text-muted">-</span>
                                    )}
                                  </div>
                                </td>
                                <td className="text-nowrap">
                                  <small className="text-muted d-flex align-items-center">
                                    <img
                                      src="/images/WhatsApp.svg"
                                      alt="WhatsApp"
                                      width="14"
                                      height="14"
                                      className="me-1"
                                    />
                                    {request.visitor_phone}
                                  </small>
                                </td>
                                {session.user.role === "admin" && (
                                  <td className="text-nowrap">
                                    {request.user?.name ? (
                                      <small className="text-info">
                                        {request.user.name}
                                      </small>
                                    ) : (
                                      <span className="text-muted">-</span>
                                    )}
                                  </td>
                                )}
                                <td>
                                  <div className="d-flex gap-1 justify-content-center align-items-center flex-nowrap">
                                    <button
                                      type="button"
                                      className="btn btn-outline-info btn-sm"
                                      onClick={() => openRequestModal(request)}
                                      title="View request details"
                                    >
                                      <i className="ti-eye"></i>
                                    </button>

                                    {/* WhatsApp Actions for approved/rejected requests */}
                                    {(request.status === "approved" ||
                                      request.status === "rejected" ||
                                      request.status === "completed") &&
                                      request.visitor_phone && (
                                        <FarmVisitWhatsAppActions
                                          request={request}
                                          farmDetails={farmDetails}
                                          userRole={session?.user?.role}
                                          onMessageSent={(type, phone) => {
                                            toastService.success(
                                              `WhatsApp ${type} message sent`
                                            );
                                          }}
                                        />
                                      )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              )}
            </Tab.Pane>

            {/* Availability Tab */}
            <Tab.Pane eventKey="availability">
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Availability Slots</h5>
                  <Button
                    variant="success"
                    onClick={() => openAvailabilityModal()}
                  >
                    <i className="ti-plus me-1"></i>
                    Add Slot
                  </Button>
                </Card.Header>
                <Card.Body>
                  {availability.length === 0 ? (
                    <div className="text-center py-4">
                      <i
                        className="ti-calendar text-muted mb-3"
                        style={{ fontSize: "48px", display: "block" }}
                      ></i>
                      <h6>No availability slots set</h6>
                      <p className="text-muted">
                        Create availability slots to allow visitors to book farm
                        visits.
                      </p>
                      <Button
                        variant="success"
                        onClick={() => openAvailabilityModal()}
                      >
                        <i className="ti-plus me-1"></i>
                        Create First Slot
                      </Button>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table
                        hover
                        className="mb-0 bg-white rounded-3 shadow-sm overflow-hidden"
                        style={{
                          "--bs-table-hover-bg": "rgba(0, 0, 0, 0.075)",
                        }}
                      >
                        <thead className="table-light">
                          <tr>
                            <th className="border-0 ps-3">Date</th>
                            <th className="border-0">Time</th>
                            <th className="border-0">Type</th>
                            <th className="border-0">Capacity</th>
                            <th className="border-0">Price</th>
                            <th className="border-0">Activity</th>
                            <th className="border-0">Available</th>
                            <th
                              className="border-0 text-center"
                              style={{ width: "120px" }}
                            >
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {availability.map((slot) => (
                            <tr key={slot.id} className="align-middle">
                              <td>{formatDate(slot.date)}</td>
                              <td>
                                {formatTime(slot.start_time)} -{" "}
                                {formatTime(slot.end_time)}
                              </td>
                              <td>
                                <Badge
                                  bg={
                                    slot.visit_type === "farm"
                                      ? "success"
                                      : "info"
                                  }
                                >
                                  {slot.visit_type === "farm"
                                    ? "🚜 Farm"
                                    : "🌱 Garden"}
                                </Badge>
                              </td>
                              <td>
                                <Badge
                                  bg={
                                    slot.current_bookings >= slot.max_visitors
                                      ? "danger"
                                      : "success"
                                  }
                                >
                                  {slot.current_bookings}/{slot.max_visitors}
                                </Badge>
                              </td>
                              <td>
                                {slot.price_per_person > 0
                                  ? `₹${slot.price_per_person}`
                                  : "Free"}
                              </td>
                              <td>
                                <Badge bg="info">
                                  {slot.activity_type.replace("_", " ")}
                                </Badge>
                              </td>
                              <td>
                                <Badge
                                  bg={
                                    slot.is_available ? "success" : "secondary"
                                  }
                                >
                                  {slot.is_available ? "Yes" : "No"}
                                </Badge>
                              </td>
                              <td>
                                <div className="d-flex gap-1 justify-content-center">
                                  <button
                                    type="button"
                                    className="btn btn-link text-primary p-1 border-0"
                                    onClick={() => openAvailabilityModal(slot)}
                                    title="Edit slot"
                                    style={{ width: "32px", height: "32px" }}
                                  >
                                    <i className="ti ti-pencil"></i>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-link text-danger p-1 border-0"
                                    onClick={() => handleDeleteSlot(slot)}
                                    disabled={slot.current_bookings > 0}
                                    title={
                                      slot.current_bookings > 0
                                        ? "Cannot delete slot with bookings"
                                        : "Delete slot"
                                    }
                                    style={{ width: "32px", height: "32px" }}
                                  >
                                    <i className="ti ti-trash"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>

        {/* Request Detail Modal */}
        <Modal
          show={showRequestModal}
          onHide={() => setShowRequestModal(false)}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Manage Visit Request</Modal.Title>
          </Modal.Header>

          <Form onSubmit={updateRequest}>
            <Modal.Body>
              {selectedRequest && (
                <>
                  {/* Request Info */}
                  <div className="mb-4 p-3 bg-light rounded">
                    <Row>
                      <Col md={6}>
                        <p>
                          <strong>Visitor:</strong>{" "}
                          {selectedRequest.visitor_name}
                        </p>
                        <p>
                          <strong>Phone:</strong>{" "}
                          {selectedRequest.visitor_phone}
                        </p>
                        <p>
                          <strong>Email:</strong>{" "}
                          {selectedRequest.visitor_email || "Not provided"}
                        </p>
                      </Col>
                      <Col md={6}>
                        <p>
                          <strong>Date:</strong>{" "}
                          {formatDate(selectedRequest.requested_date)}
                        </p>
                        <p>
                          <strong>Time:</strong>{" "}
                          {formatTime(selectedRequest.requested_time_start)} -{" "}
                          {formatTime(selectedRequest.requested_time_end)}
                        </p>
                        <p>
                          <strong>Guests:</strong>{" "}
                          {selectedRequest.number_of_visitors}
                        </p>
                      </Col>
                    </Row>

                    {selectedRequest.purpose && (
                      <div className="mt-3">
                        <strong>Purpose:</strong>
                        <p className="mb-0">{selectedRequest.purpose}</p>
                      </div>
                    )}

                    {selectedRequest.special_requirements && (
                      <div className="mt-3">
                        <strong>Special Requirements:</strong>
                        <p className="mb-0">
                          {selectedRequest.special_requirements}
                        </p>
                      </div>
                    )}

                    {selectedRequest.message_to_farmer && (
                      <div className="mt-3">
                        <strong>Message:</strong>
                        <p className="mb-0">
                          {selectedRequest.message_to_farmer}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Status Update */}
                  <Form.Group className="mb-3">
                    <Form.Label>Status *</Form.Label>
                    <Form.Select
                      required
                      value={requestForm.status}
                      onChange={(e) =>
                        setRequestForm((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="completed">Completed</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Notes to Visitor</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Add any notes or instructions for the visitor..."
                      value={requestForm.admin_notes}
                      onChange={(e) =>
                        setRequestForm((prev) => ({
                          ...prev,
                          admin_notes: e.target.value,
                        }))
                      }
                    />
                  </Form.Group>

                  {requestForm.status === "rejected" && (
                    <Form.Group className="mb-3">
                      <Form.Label>Rejection Reason *</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        required
                        placeholder="Please provide a reason for rejection..."
                        value={requestForm.rejection_reason}
                        onChange={(e) =>
                          setRequestForm((prev) => ({
                            ...prev,
                            rejection_reason: e.target.value,
                          }))
                        }
                      />
                    </Form.Group>
                  )}

                  {/* WhatsApp Messaging Info */}
                  {(requestForm.status === "approved" ||
                    requestForm.status === "rejected") &&
                    selectedRequest?.visitor_phone && (
                      <div className="mt-4 p-3 bg-success bg-opacity-10 border border-success border-opacity-25 rounded">
                        <div className="d-flex align-items-center mb-2">
                          <i className="ti-check-box text-success me-2"></i>
                          <strong className="text-success">
                            Automatic WhatsApp Notification
                          </strong>
                        </div>
                        <small className="text-muted d-block d-flex align-items-start">
                          <img
                            src="/images/WhatsApp.svg"
                            alt="WhatsApp"
                            width="14"
                            height="14"
                            className="me-1 mt-1"
                          />
                          <span>
                            A WhatsApp {requestForm.status} message with
                            complete location details, contact information, and
                            Google Maps link will be sent automatically to:{" "}
                            {selectedRequest.visitor_phone}
                          </span>
                        </small>
                      </div>
                    )}
                </>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowRequestModal(false)}
              >
                Cancel
              </Button>
              <Button variant="success" type="submit" disabled={actionLoading}>
                {actionLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Updating...
                  </>
                ) : (
                  "Update Request"
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Availability Modal */}
        <Modal
          show={showAvailabilityModal}
          onHide={() => setShowAvailabilityModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {selectedAvailability
                ? "Edit Availability Slot"
                : "Create Availability Slot"}
            </Modal.Title>
          </Modal.Header>

          <Form
            onSubmit={
              selectedAvailability ? updateAvailability : createAvailability
            }
          >
            <Modal.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date *</Form.Label>
                    <Form.Control
                      type="date"
                      required
                      value={availabilityForm.date}
                      onChange={(e) =>
                        setAvailabilityForm((prev) => ({
                          ...prev,
                          date: e.target.value,
                        }))
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Max Visitors *</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      max="20"
                      required
                      value={availabilityForm.max_visitors}
                      onChange={(e) =>
                        setAvailabilityForm((prev) => ({
                          ...prev,
                          max_visitors: parseInt(e.target.value),
                        }))
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Start Time *</Form.Label>
                    <Form.Control
                      type="time"
                      required
                      value={availabilityForm.start_time}
                      onChange={(e) =>
                        setAvailabilityForm((prev) => ({
                          ...prev,
                          start_time: e.target.value,
                        }))
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>End Time *</Form.Label>
                    <Form.Control
                      type="time"
                      required
                      value={availabilityForm.end_time}
                      onChange={(e) =>
                        setAvailabilityForm((prev) => ({
                          ...prev,
                          end_time: e.target.value,
                        }))
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Visit Type *</Form.Label>
                    <Form.Select
                      required
                      value={availabilityForm.visit_type}
                      onChange={(e) => {
                        const visitType = e.target.value;
                        setAvailabilityForm((prev) => ({
                          ...prev,
                          visit_type: visitType,
                          max_visitors: visitType === "garden" ? 3 : 5,
                          activity_type:
                            visitType === "garden"
                              ? "garden_tour"
                              : "farm_tour",
                        }));
                      }}
                    >
                      <option value="farm">🚜 Farm Visit</option>
                      <option value="garden">🌱 Garden Visit</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Location Type</Form.Label>
                    <Form.Select
                      value={availabilityForm.location_type}
                      onChange={(e) =>
                        setAvailabilityForm((prev) => ({
                          ...prev,
                          location_type: e.target.value,
                        }))
                      }
                    >
                      <option value="farm">Farm</option>
                      <option value="home_garden">Home Garden</option>
                      <option value="terrace_garden">Terrace Garden</option>
                      <option value="rooftop_garden">Rooftop Garden</option>
                      <option value="community_garden">Community Garden</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Price per Person (₹)</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      value={availabilityForm.price_per_person}
                      onChange={(e) =>
                        setAvailabilityForm((prev) => ({
                          ...prev,
                          price_per_person: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Activity Type</Form.Label>
                    <Form.Select
                      value={availabilityForm.activity_type}
                      onChange={(e) =>
                        setAvailabilityForm((prev) => ({
                          ...prev,
                          activity_type: e.target.value,
                        }))
                      }
                    >
                      <option value="farm_tour">Farm Tour</option>
                      <option value="garden_tour">Garden Tour</option>
                      <option value="harvesting">Harvesting Experience</option>
                      <option value="workshop">Workshop</option>
                      <option value="consultation">Consultation</option>
                      <option value="other">Other</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Space Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Describe the space where the visit will take place..."
                  value={availabilityForm.space_description}
                  onChange={(e) =>
                    setAvailabilityForm((prev) => ({
                      ...prev,
                      space_description: e.target.value,
                    }))
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Available for booking"
                  checked={availabilityForm.is_available}
                  onChange={(e) =>
                    setAvailabilityForm((prev) => ({
                      ...prev,
                      is_available: e.target.checked,
                    }))
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Special Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Any special instructions or requirements for this time slot..."
                  value={availabilityForm.special_notes}
                  onChange={(e) =>
                    setAvailabilityForm((prev) => ({
                      ...prev,
                      special_notes: e.target.value,
                    }))
                  }
                />
              </Form.Group>
            </Modal.Body>

            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowAvailabilityModal(false)}
              >
                Cancel
              </Button>
              <Button variant="success" type="submit" disabled={actionLoading}>
                {actionLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    {selectedAvailability ? "Updating..." : "Creating..."}
                  </>
                ) : selectedAvailability ? (
                  "Update Slot"
                ) : (
                  "Create Slot"
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          show={showDeleteModal}
          onHide={() => {
            setShowDeleteModal(false);
            setSlotToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Delete Availability Slot"
          message={
            slotToDelete
              ? `Are you sure you want to delete the availability slot for ${formatDate(
                  slotToDelete.date
                )} at ${formatTime(slotToDelete.start_time)} - ${formatTime(
                  slotToDelete.end_time
                )}? This action cannot be undone.`
              : "Are you sure you want to delete this availability slot?"
          }
          loading={deleteLoading}
        />
      </Container>
    </>
  );
}
