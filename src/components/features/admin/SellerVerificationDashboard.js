"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Modal,
  Form,
  Badge,
  Alert,
  Tab,
  Tabs,
  Carousel,
  ListGroup,
  ButtonGroup,
  InputGroup,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import toastService from "@/utils/toastService";
import AdminGuard from "@/components/common/AdminGuard";

const VERIFICATION_STATUSES = {
  pending: { label: "Pending Review", color: "warning", icon: "⏳" },
  documents_submitted: {
    label: "Documents Submitted",
    color: "info",
    icon: "📄",
  },
  under_review: { label: "Under Review", color: "primary", icon: "🔍" },
  basic_verified: { label: "Basic Verified", color: "success", icon: "✅" },
  farm_verified: { label: "Farm Verified", color: "success", icon: "🏡" },
  community_trusted: {
    label: "Community Trusted",
    color: "warning",
    icon: "⭐",
  },
  premium_verified: { label: "Premium Verified", color: "danger", icon: "👑" },
  rejected: { label: "Rejected", color: "danger", icon: "❌" },
};

const AVAILABLE_BADGES = [
  {
    type: "verified_natural",
    name: "Verified Natural Farmer",
    description: "Farm practices verified to be natural and chemical-free",
    icon: "🌱",
    color: "success",
    requirements: "Farm photos review, practice verification",
  },
  {
    type: "community_trusted",
    name: "Community Trusted",
    description: "Highly rated by the buyer community",
    icon: "⭐",
    color: "warning",
    requirements: "Minimum 10 reviews with 4+ average rating",
  },
  {
    type: "farm_visited",
    name: "Farm Verified",
    description: "Farm location and practices physically verified",
    icon: "🏡",
    color: "info",
    requirements: "Physical farm visit completed",
  },
  {
    type: "certified_organic",
    name: "Certified Organic",
    description: "Official organic certification verified",
    icon: "📜",
    color: "primary",
    requirements: "Valid organic certification documents",
  },
  {
    type: "eco_champion",
    name: "Eco Champion",
    description: "Outstanding commitment to sustainable practices",
    icon: "🌍",
    color: "success",
    requirements: "Exemplary environmental practices",
  },
  {
    type: "premium_verified",
    name: "Premium Seller",
    description: "Highest level of verification and quality",
    icon: "👑",
    color: "danger",
    requirements: "All verifications + exceptional track record",
  },
];

export default function SellerVerificationDashboard() {
  const [activeTab, setActiveTab] = useState("pending");
  const [sellerRequests, setSellerRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [reviewForm, setReviewForm] = useState({
    verification_level: "",
    review_notes: "",
    approved: null,
  });

  const [badgeForm, setBadgeForm] = useState({
    badge_type: "",
    verification_notes: "",
  });

  useEffect(() => {
    loadSellerRequests();
  }, []);

  const loadSellerRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/seller-requests");
      if (response.ok) {
        const data = await response.json();
        setSellerRequests(data);
      }
    } catch (error) {
      console.error("Error loading seller requests:", error);
      toastService.error("Failed to load seller requests");
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (request) => {
    setSelectedRequest(request);
    setReviewForm({
      verification_level: request.verification_level || "basic_verified",
      review_notes: request.review_notes || "",
      approved: null,
    });
    setShowReviewModal(true);
  };

  const openBadgeModal = (request) => {
    setSelectedRequest(request);
    setBadgeForm({
      badge_type: "",
      verification_notes: "",
    });
    setShowBadgeModal(true);
  };

  const submitReview = async () => {
    if (!selectedRequest || reviewForm.approved === null) {
      toastService.error("Please make a decision on the application");
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/seller-requests/${selectedRequest.id}/review`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: reviewForm.approved
              ? reviewForm.verification_level
              : "rejected",
            review_notes: reviewForm.review_notes,
            approved: reviewForm.approved,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to submit review");

      toastService.success(
        reviewForm.approved
          ? "Seller application approved!"
          : "Seller application rejected"
      );

      setShowReviewModal(false);
      loadSellerRequests();
    } catch (error) {
      console.error("Error submitting review:", error);
      toastService.error("Failed to submit review");
    }
  };

  const awardBadge = async () => {
    if (!badgeForm.badge_type) {
      toastService.error("Please select a badge to award");
      return;
    }

    try {
      const badgeData = AVAILABLE_BADGES.find(
        (b) => b.type === badgeForm.badge_type
      );

      const response = await fetch("/api/admin/seller-badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seller_id: selectedRequest.user_id,
          badge_type: badgeForm.badge_type,
          badge_name: badgeData.name,
          badge_description: badgeData.description,
          verification_notes: badgeForm.verification_notes,
        }),
      });

      if (!response.ok) throw new Error("Failed to award badge");

      toastService.success(`${badgeData.name} badge awarded successfully!`);
      setShowBadgeModal(false);
      loadSellerRequests();
    } catch (error) {
      console.error("Error awarding badge:", error);
      toastService.error("Failed to award badge");
    }
  };

  const filteredRequests = sellerRequests.filter((request) => {
    const matchesSearch =
      request.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.farm_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || request.status === filterStatus;
    const matchesTab = activeTab === "all" || request.status === activeTab;

    return matchesSearch && matchesStatus && matchesTab;
  });

  const renderRequestCard = (request) => (
    <Card key={request.id} className="mb-4">
      <Card.Header>
        <Row className="align-items-center">
          <Col md={8}>
            <h5 className="mb-1">
              {request.farm_name || request.business_name}
              <Badge
                bg={VERIFICATION_STATUSES[request.status]?.color || "secondary"}
                className="ms-2"
              >
                {VERIFICATION_STATUSES[request.status]?.icon}{" "}
                {VERIFICATION_STATUSES[request.status]?.label}
              </Badge>
            </h5>
            <div className="text-muted">
              <strong>Applicant:</strong> {request.user?.name} •
              <strong> Applied:</strong>{" "}
              {new Date(request.created_at).toLocaleDateString()}
            </div>
          </Col>
          <Col md={4} className="text-end">
            <ButtonGroup size="sm">
              <Button
                variant="outline-primary"
                onClick={() => openReviewModal(request)}
              >
                <i className="ti ti-eye me-1"></i>
                Review
              </Button>
              {request.status !== "pending" && (
                <Button
                  variant="outline-success"
                  onClick={() => openBadgeModal(request)}
                >
                  <i className="ti ti-award me-1"></i>
                  Award Badge
                </Button>
              )}
            </ButtonGroup>
          </Col>
        </Row>
      </Card.Header>

      <Card.Body>
        <Row>
          <Col md={6}>
            <h6>🏢 Business Details</h6>
            <ListGroup variant="flush">
              <ListGroup.Item className="px-0 py-2">
                <strong>Location:</strong> {request.location}
              </ListGroup.Item>
              <ListGroup.Item className="px-0 py-2">
                <strong>Years Farming:</strong>{" "}
                {request.years_farming || "Not specified"}
              </ListGroup.Item>
              <ListGroup.Item className="px-0 py-2">
                <strong>Farm Size:</strong>{" "}
                {request.farm_size_acres
                  ? `${request.farm_size_acres} acres`
                  : "Not specified"}
              </ListGroup.Item>
              <ListGroup.Item className="px-0 py-2">
                <strong>Contact:</strong>{" "}
                {request.whatsapp_number || request.contact_number}
              </ListGroup.Item>
            </ListGroup>
          </Col>

          <Col md={6}>
            <h6>🌱 Farming Methods</h6>
            {request.farming_methods && request.farming_methods.length > 0 ? (
              <div className="mb-3">
                {request.farming_methods.map((method) => (
                  <Badge key={method} bg="success" className="me-1 mb-1">
                    {method.replace("_", " ").toUpperCase()}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted">No methods specified</p>
            )}

            {request.certifications && request.certifications.length > 0 && (
              <>
                <h6>📜 Certifications</h6>
                <div className="mb-3">
                  {request.certifications.map((cert) => (
                    <Badge key={cert} bg="primary" className="me-1 mb-1">
                      {cert.replace("_", " ").toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </>
            )}

            {request.farm_visit_available && (
              <Alert variant="info" className="py-2">
                <i className="ti ti-home me-2"></i>
                <strong>Farm visits welcome!</strong>
              </Alert>
            )}
          </Col>
        </Row>

        {request.business_description && (
          <div className="mt-3">
            <h6>📝 Description</h6>
            <p className="text-muted">{request.business_description}</p>
          </div>
        )}
      </Card.Body>
    </Card>
  );

  const renderReviewModal = () => (
    <Modal
      show={showReviewModal}
      onHide={() => setShowReviewModal(false)}
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title>🔍 Review Seller Application</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedRequest && (
          <>
            <Alert variant="info">
              <Alert.Heading>
                {selectedRequest.farm_name || selectedRequest.business_name}
              </Alert.Heading>
              <p className="mb-0">
                <strong>Applicant:</strong> {selectedRequest.user?.name} •
                <strong>Applied:</strong>{" "}
                {new Date(selectedRequest.created_at).toLocaleDateString()}
              </p>
            </Alert>

            <Tabs defaultActiveKey="details" className="mb-4">
              <Tab eventKey="details" title="📋 Details">
                <Row>
                  <Col md={6}>
                    <h6>Business Information</h6>
                    <p>
                      <strong>Business Name:</strong>{" "}
                      {selectedRequest.business_name}
                    </p>
                    <p>
                      <strong>Farm Name:</strong> {selectedRequest.farm_name}
                    </p>
                    <p>
                      <strong>Location:</strong> {selectedRequest.location}
                    </p>
                    <p>
                      <strong>Years Farming:</strong>{" "}
                      {selectedRequest.years_farming}
                    </p>
                    <p>
                      <strong>Farm Size:</strong>{" "}
                      {selectedRequest.farm_size_acres} acres
                    </p>
                  </Col>
                  <Col md={6}>
                    <h6>Contact Information</h6>
                    <p>
                      <strong>Phone:</strong> {selectedRequest.contact_number}
                    </p>
                    <p>
                      <strong>WhatsApp:</strong>{" "}
                      {selectedRequest.whatsapp_number}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedRequest.user?.email}
                    </p>
                  </Col>
                </Row>
              </Tab>

              <Tab eventKey="practices" title="🌱 Practices">
                <div className="mb-4">
                  <h6>Growing Practices</h6>
                  <p>{selectedRequest.growing_practices || "Not provided"}</p>
                </div>

                <div className="mb-4">
                  <h6>Pest Management</h6>
                  <p>{selectedRequest.pest_management || "Not provided"}</p>
                </div>

                <div className="mb-4">
                  <h6>Soil Management</h6>
                  <p>{selectedRequest.soil_management || "Not provided"}</p>
                </div>
              </Tab>

              <Tab eventKey="photos" title="📸 Photos">
                {selectedRequest.farm_photos &&
                selectedRequest.farm_photos.length > 0 ? (
                  <Carousel>
                    {selectedRequest.farm_photos.map((photo, index) => (
                      <Carousel.Item key={index}>
                        <div className="d-flex justify-content-center">
                          <img
                            src={photo}
                            alt={`Farm photo ${index + 1}`}
                            style={{ maxHeight: "400px", objectFit: "contain" }}
                            className="d-block"
                          />
                        </div>
                        <Carousel.Caption>
                          <h5>Farm Photo {index + 1}</h5>
                        </Carousel.Caption>
                      </Carousel.Item>
                    ))}
                  </Carousel>
                ) : (
                  <Alert variant="warning">No farm photos provided</Alert>
                )}
              </Tab>
            </Tabs>

            <Card>
              <Card.Header>
                <h6 className="mb-0">📝 Review Decision</h6>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Decision *</Form.Label>
                  <ButtonGroup className="d-block">
                    <Button
                      variant={
                        reviewForm.approved === true
                          ? "success"
                          : "outline-success"
                      }
                      onClick={() =>
                        setReviewForm((prev) => ({ ...prev, approved: true }))
                      }
                      className="me-2"
                    >
                      ✅ Approve
                    </Button>
                    <Button
                      variant={
                        reviewForm.approved === false
                          ? "danger"
                          : "outline-danger"
                      }
                      onClick={() =>
                        setReviewForm((prev) => ({ ...prev, approved: false }))
                      }
                    >
                      ❌ Reject
                    </Button>
                  </ButtonGroup>
                </Form.Group>

                {reviewForm.approved === true && (
                  <Form.Group className="mb-3">
                    <Form.Label>Verification Level</Form.Label>
                    <Form.Select
                      value={reviewForm.verification_level}
                      onChange={(e) =>
                        setReviewForm((prev) => ({
                          ...prev,
                          verification_level: e.target.value,
                        }))
                      }
                    >
                      <option value="basic_verified">Basic Verified</option>
                      <option value="farm_verified">Farm Verified</option>
                      <option value="community_trusted">
                        Community Trusted
                      </option>
                      <option value="premium_verified">Premium Verified</option>
                    </Form.Select>
                  </Form.Group>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Review Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={reviewForm.review_notes}
                    onChange={(e) =>
                      setReviewForm((prev) => ({
                        ...prev,
                        review_notes: e.target.value,
                      }))
                    }
                    placeholder="Add notes about your decision, feedback for the seller, or areas for improvement..."
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowReviewModal(false)}>
          Cancel
        </Button>
        <Button
          variant={reviewForm.approved ? "success" : "danger"}
          onClick={submitReview}
          disabled={reviewForm.approved === null}
        >
          {reviewForm.approved
            ? "✅ Approve Application"
            : "❌ Reject Application"}
        </Button>
      </Modal.Footer>
    </Modal>
  );

  const renderBadgeModal = () => (
    <Modal
      show={showBadgeModal}
      onHide={() => setShowBadgeModal(false)}
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title>🏆 Award Verification Badge</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedRequest && (
          <>
            <Alert variant="success">
              <Alert.Heading>
                Award Badge to{" "}
                {selectedRequest.farm_name || selectedRequest.business_name}
              </Alert.Heading>
              <p className="mb-0">
                Select an appropriate verification badge based on their
                qualifications and performance.
              </p>
            </Alert>

            <Row className="g-3 mb-4">
              {AVAILABLE_BADGES.map((badge) => (
                <Col md={6} key={badge.type}>
                  <Card
                    className={`h-100 cursor-pointer ${
                      badgeForm.badge_type === badge.type
                        ? "border-primary bg-light"
                        : "border-secondary"
                    }`}
                    onClick={() =>
                      setBadgeForm((prev) => ({
                        ...prev,
                        badge_type: badge.type,
                      }))
                    }
                  >
                    <Card.Body className="text-center p-3">
                      <div style={{ fontSize: "2.5rem" }}>{badge.icon}</div>
                      <h6 className="mt-2 mb-1">{badge.name}</h6>
                      <p className="small text-muted mb-2">
                        {badge.description}
                      </p>
                      <small className="text-muted">
                        <strong>Requirements:</strong> {badge.requirements}
                      </small>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            <Form.Group>
              <Form.Label>Verification Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={badgeForm.verification_notes}
                onChange={(e) =>
                  setBadgeForm((prev) => ({
                    ...prev,
                    verification_notes: e.target.value,
                  }))
                }
                placeholder="Add notes about why this badge was awarded and any verification details..."
              />
            </Form.Group>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowBadgeModal(false)}>
          Cancel
        </Button>
        <Button
          variant="success"
          onClick={awardBadge}
          disabled={!badgeForm.badge_type}
        >
          🏆 Award Badge
        </Button>
      </Modal.Footer>
    </Modal>
  );

  return (
    <AdminGuard>
      <Container className="pb-4">
        <Card className="shadow-sm">
          <Card.Header className="bg-primary text-white">
            <h4 className="mb-0">
              🌱 Natural Farming Seller Verification Dashboard
            </h4>
          </Card.Header>

          <Card.Body className="p-0">
            {/* Search and Filters */}
            <div className="p-4 border-bottom">
              <Row className="align-items-center">
                <Col md={6}>
                  <InputGroup>
                    <InputGroup.Text>
                      <i className="ti ti-search"></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search by business name, farm name, or applicant..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={6}>
                  <Form.Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    {Object.entries(VERIFICATION_STATUSES).map(
                      ([key, status]) => (
                        <option key={key} value={key}>
                          {status.icon} {status.label}
                        </option>
                      )
                    )}
                  </Form.Select>
                </Col>
              </Row>
            </div>

            {/* Tabs */}
            <Tabs
              activeKey={activeTab}
              onSelect={(key) => setActiveTab(key)}
              className="px-4"
            >
              <Tab
                eventKey="pending"
                title={`⏳ Pending (${
                  sellerRequests.filter((r) => r.status === "pending").length
                })`}
              >
                <div className="p-4">
                  {loading ? (
                    <div className="text-center py-5">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : filteredRequests.length > 0 ? (
                    filteredRequests.map(renderRequestCard)
                  ) : (
                    <Alert variant="info">No pending applications found.</Alert>
                  )}
                </div>
              </Tab>

              <Tab
                eventKey="under_review"
                title={`🔍 Under Review (${
                  sellerRequests.filter((r) => r.status === "under_review")
                    .length
                })`}
              >
                <div className="p-4">
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map(renderRequestCard)
                  ) : (
                    <Alert variant="info">No applications under review.</Alert>
                  )}
                </div>
              </Tab>

              <Tab
                eventKey="basic_verified"
                title={`✅ Verified (${
                  sellerRequests.filter((r) =>
                    [
                      "basic_verified",
                      "farm_verified",
                      "community_trusted",
                      "premium_verified",
                    ].includes(r.status)
                  ).length
                })`}
              >
                <div className="p-4">
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map(renderRequestCard)
                  ) : (
                    <Alert variant="success">No verified sellers yet.</Alert>
                  )}
                </div>
              </Tab>

              <Tab eventKey="all" title={`📋 All (${sellerRequests.length})`}>
                <div className="p-4">
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map(renderRequestCard)
                  ) : (
                    <Alert variant="info">
                      No applications found matching your criteria.
                    </Alert>
                  )}
                </div>
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>

        {renderReviewModal()}
        {renderBadgeModal()}
      </Container>
    </AdminGuard>
  );
}
