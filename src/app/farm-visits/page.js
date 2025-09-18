"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Badge,
  Spinner,
  Alert,
  Modal,
} from "react-bootstrap";
// Using Themify icons instead of lucide-react
import Link from "next/link";

export default function FarmVisitsPage() {
  const { data: session, status } = useSession();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    location: "",
    hasAvailability: true,
    visitType: "", // farm, garden, or "" for both
  });

  // Request form state
  const [requestForm, setRequestForm] = useState({
    availability_id: "",
    number_of_visitors: 1,
    visitor_name: "",
    visitor_phone: "",
    visitor_email: "",
    purpose: "",
    special_requirements: "",
    message_to_farmer: "",
  });

  useEffect(() => {
    fetchFarms();
  }, [searchFilters]);

  useEffect(() => {
    if (session?.user) {
      setRequestForm((prev) => ({
        ...prev,
        visitor_name: session.user.name || "",
        visitor_email: session.user.email || "",
        visitor_phone: session.user.phone || "",
      }));
    }
  }, [session]);

  const fetchFarms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchFilters.location)
        params.append("location", searchFilters.location);
      if (searchFilters.hasAvailability)
        params.append("hasAvailability", "true");
      if (searchFilters.visitType)
        params.append("visitType", searchFilters.visitType);

      const response = await fetch(`/api/farm-visits/farms?${params}`);
      const data = await response.json();

      if (response.ok) {
        setFarms(data.farms || []);
      } else {
        setError(data.error || "Failed to fetch farms");
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const fetchFarmDetails = async (farmId) => {
    try {
      const response = await fetch("/api/farm-visits/farms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farmId }),
      });
      const data = await response.json();

      if (response.ok) {
        setSelectedFarm(data.farm);
        setShowRequestModal(true);
      } else {
        setError(data.error || "Failed to fetch farm details");
      }
    } catch (err) {
      setError("Failed to connect to server");
    }
  };

  const submitRequest = async (e) => {
    e.preventDefault();

    if (!session) {
      setError("Please login to submit a visit request");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await fetch("/api/farm-visits/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...requestForm,
          seller_id: selectedFarm.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(
          "Farm visit request submitted successfully! The farmer will review and respond to your request."
        );
        setShowRequestModal(false);
        setRequestForm({
          availability_id: "",
          number_of_visitors: 1,
          visitor_name: session.user.name || "",
          visitor_phone: session.user.phone || "",
          visitor_email: session.user.email || "",
          purpose: "",
          special_requirements: "",
          message_to_farmer: "",
        });
      } else {
        setError(data.error || "Failed to submit request");
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
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

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start">
            <div className="flex-grow-1 mb-3 mb-lg-0">
              <h1 className="text-success mb-3">
                <i
                  className="ti-calendar me-2"
                  style={{ fontSize: "32px" }}
                ></i>
                Farm & Garden Visits
              </h1>
              <p className="lead text-muted">
                Connect with local farmers and gardeners to visit their farms,
                home gardens, terrace gardens, and urban growing spaces. Learn
                about natural farming practices, see crops in their environment,
                and build relationships with your food producers.
              </p>
            </div>
            {session && (
              <div className="d-flex justify-content-end align-self-stretch align-self-lg-start">
                <Button
                  as={Link}
                  href="/my-visits"
                  variant="outline-success"
                  className="d-flex align-items-center justify-content-center text-nowrap"
                  style={{ minWidth: "180px" }}
                >
                  <i className="ti-list me-2"></i>
                  <span className="d-none d-md-inline">My Visit Requests</span>
                  <span className="d-md-none">My Requests</span>
                </Button>
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* Search Filters */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Form onSubmit={(e) => e.preventDefault()}>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Location</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter city or area"
                        value={searchFilters.location}
                        onChange={(e) =>
                          setSearchFilters((prev) => ({
                            ...prev,
                            location: e.target.value,
                          }))
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Visit Type</Form.Label>
                      <Form.Select
                        value={searchFilters.visitType}
                        onChange={(e) =>
                          setSearchFilters((prev) => ({
                            ...prev,
                            visitType: e.target.value,
                          }))
                        }
                      >
                        <option value="">All Types</option>
                        <option value="farm">🚜 Farm Visits</option>
                        <option value="garden">🌱 Garden Visits</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        label="Show only available slots"
                        checked={searchFilters.hasAvailability}
                        onChange={(e) =>
                          setSearchFilters((prev) => ({
                            ...prev,
                            hasAvailability: e.target.checked,
                          }))
                        }
                        style={{ marginTop: "32px" }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Button
                      variant="success"
                      onClick={fetchFarms}
                      style={{ marginTop: "32px" }}
                      className="w-100"
                    >
                      Search
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
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
          <p className="mt-2 text-muted">Loading farms...</p>
        </div>
      )}

      {/* Farms Grid */}
      {!loading && (
        <Row>
          {farms.length === 0 ? (
            <Col>
              <Card className="text-center py-5">
                <Card.Body>
                  <h5>No farms found</h5>
                  <p className="text-muted">
                    Try adjusting your search filters or check back later as
                    more farmers join our community.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          ) : (
            farms.map((farm) => (
              <Col md={6} lg={4} key={farm.id} className="mb-4">
                <Card className="h-100 border-0 shadow-sm">
                  {farm.seller_farm_profiles?.[0]?.farm_gallery_urls?.[0] && (
                    <div
                      style={{
                        height: "200px",
                        backgroundImage: `url(${farm.seller_farm_profiles[0].farm_gallery_urls[0]})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                  )}

                  <Card.Body className="d-flex flex-column">
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="card-title text-success mb-0">
                          {farm.seller_farm_profiles?.[0]?.farm_name ||
                            farm.name}
                        </h5>
                        {farm.seller_farm_profiles?.[0]?.profile_verified && (
                          <Badge bg="success" className="ms-2">
                            <i className="ti-star me-1"></i>
                            Verified
                          </Badge>
                        )}
                      </div>

                      <div className="text-muted small mb-2">
                        <i className="ti-location-pin me-1"></i>
                        {farm.location}
                      </div>

                      {farm.seller_farm_profiles?.[0]?.farm_story && (
                        <p className="text-muted small">
                          {farm.seller_farm_profiles[0].farm_story.substring(
                            0,
                            120
                          )}
                          ...
                        </p>
                      )}
                    </div>

                    <div className="mb-3">
                      <Badge bg="light" text="dark" className="me-2">
                        <i className="ti-user me-1"></i>
                        {farm.available_slots_count || 0} available slots
                      </Badge>

                      {/* Visit Types Available */}
                      {farm.available_visit_types?.includes("farm") && (
                        <Badge bg="success" className="me-1">
                          🚜 Farm
                        </Badge>
                      )}
                      {farm.available_visit_types?.includes("garden") && (
                        <Badge bg="info" className="me-1">
                          🌱 Garden
                        </Badge>
                      )}

                      {farm.seller_farm_profiles?.[0]?.garden_type && (
                        <Badge bg="light" text="dark" className="me-1">
                          {farm.seller_farm_profiles[0].garden_type.replace(
                            "_",
                            " "
                          )}
                        </Badge>
                      )}

                      {farm.seller_farm_profiles?.[0]?.farm_type && (
                        <Badge bg="outline-success" className="me-1">
                          {farm.seller_farm_profiles[0].farm_type.replace(
                            "_",
                            " "
                          )}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-auto">
                      {session ? (
                        <Button
                          variant="success"
                          className="w-100"
                          onClick={() => fetchFarmDetails(farm.id)}
                          disabled={!farm.available_slots_count}
                        >
                          {farm.available_slots_count
                            ? "Request Visit"
                            : "No Slots Available"}
                        </Button>
                      ) : (
                        <Button
                          as={Link}
                          href="/login"
                          variant="outline-success"
                          className="w-100"
                        >
                          Login to Request Visit
                        </Button>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))
          )}
        </Row>
      )}

      {/* Request Modal */}
      <Modal
        show={showRequestModal}
        onHide={() => setShowRequestModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Request Farm Visit -{" "}
            {selectedFarm?.seller_farm_profiles?.[0]?.farm_name}
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={submitRequest}>
          <Modal.Body>
            {selectedFarm && (
              <>
                {/* Farm Info */}
                <div className="mb-4 p-3 bg-light rounded">
                  <h6>Farm Information</h6>
                  <p className="mb-1">
                    <strong>Farmer:</strong> {selectedFarm.name}
                  </p>
                  <p className="mb-1">
                    <strong>Location:</strong> {selectedFarm.location}
                  </p>
                  {selectedFarm.seller_farm_profiles?.[0]
                    ?.visit_contact_info && (
                    <p className="mb-0">
                      <strong>Visit Info:</strong>{" "}
                      {selectedFarm.seller_farm_profiles[0].visit_contact_info}
                    </p>
                  )}
                </div>

                {/* Available Slots */}
                <Form.Group className="mb-3">
                  <Form.Label>Select Time Slot *</Form.Label>
                  <Form.Select
                    required
                    value={requestForm.availability_id}
                    onChange={(e) => {
                      const availability = selectedFarm.availability.find(
                        (slot) => slot.id === e.target.value
                      );
                      setRequestForm((prev) => ({
                        ...prev,
                        availability_id: e.target.value,
                        requested_date: availability?.date || "",
                        requested_time_start: availability?.start_time || "",
                        requested_time_end: availability?.end_time || "",
                      }));
                    }}
                  >
                    <option value="">Choose an available time slot</option>
                    {selectedFarm.availability?.map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {formatDate(slot.date)} - {formatTime(slot.start_time)}{" "}
                        to {formatTime(slot.end_time)}(
                        {slot.max_visitors - slot.current_bookings} spots
                        available)
                        {slot.price_per_person > 0 &&
                          ` - ₹${slot.price_per_person}/person`}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Number of Visitors *</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        max="10"
                        required
                        value={requestForm.number_of_visitors}
                        onChange={(e) =>
                          setRequestForm((prev) => ({
                            ...prev,
                            number_of_visitors: parseInt(e.target.value),
                          }))
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Your Name *</Form.Label>
                      <Form.Control
                        type="text"
                        required
                        value={requestForm.visitor_name}
                        onChange={(e) =>
                          setRequestForm((prev) => ({
                            ...prev,
                            visitor_name: e.target.value,
                          }))
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number *</Form.Label>
                      <Form.Control
                        type="tel"
                        required
                        value={requestForm.visitor_phone}
                        onChange={(e) =>
                          setRequestForm((prev) => ({
                            ...prev,
                            visitor_phone: e.target.value,
                          }))
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        value={requestForm.visitor_email}
                        onChange={(e) =>
                          setRequestForm((prev) => ({
                            ...prev,
                            visitor_email: e.target.value,
                          }))
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Purpose of Visit</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Why do you want to visit this farm? (e.g., learning about natural farming, buying fresh produce, etc.)"
                    value={requestForm.purpose}
                    onChange={(e) =>
                      setRequestForm((prev) => ({
                        ...prev,
                        purpose: e.target.value,
                      }))
                    }
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Special Requirements</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Any special needs or accessibility requirements?"
                    value={requestForm.special_requirements}
                    onChange={(e) =>
                      setRequestForm((prev) => ({
                        ...prev,
                        special_requirements: e.target.value,
                      }))
                    }
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Message to Farmer</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Any additional message or questions for the farmer?"
                    value={requestForm.message_to_farmer}
                    onChange={(e) =>
                      setRequestForm((prev) => ({
                        ...prev,
                        message_to_farmer: e.target.value,
                      }))
                    }
                  />
                </Form.Group>
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
            <Button
              variant="success"
              type="submit"
              disabled={submitting || !requestForm.availability_id}
            >
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
