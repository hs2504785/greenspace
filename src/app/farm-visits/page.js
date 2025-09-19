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
import toastService from "@/utils/toastService";

export default function FarmVisitsPage() {
  const { data: session, status } = useSession();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    location: "",
    hasAvailability: true,
    visitType: "", // farm, garden, or "" for both - default to all types
  });

  // Request form state
  const [requestForm, setRequestForm] = useState({
    availability_id: "",
    number_of_visitors: 1,
    visitor_name: "",
    visitor_phone: "",
    visitor_email: "",
    message_to_farmer:
      "Hi! I'm interested in learning about organic farming practices and would love to see your composting setup.",
  });

  useEffect(() => {
    fetchFarms();
  }, [searchFilters]);

  // Fetch user profile data (with caching)
  useEffect(() => {
    const fetchAndFillUserData = async () => {
      if (session?.user && !profileLoaded) {
        try {
          console.log("🔍 Fetching fresh profile data...");
          const response = await fetch("/api/users/profile");
          if (response.ok) {
            const data = await response.json();
            console.log("🔍 Profile API response:", data);

            setUserProfile(data.user);
            setProfileLoaded(true);

            const phoneNumber =
              data.user?.whatsapp_number ||
              session.user.phone ||
              session.user.whatsappNumber ||
              session.user.whatsapp_number ||
              "";

            console.log(
              "🔍 Phone number from profile:",
              data.user?.whatsapp_number
            );
            console.log("🔍 Final phone number used:", phoneNumber);

            setRequestForm((prev) => ({
              ...prev,
              visitor_name: session.user.name || "",
              visitor_email: session.user.email || "",
              visitor_phone: phoneNumber,
            }));
          } else {
            console.log("🔍 Profile API failed, using session fallback");
            // Fallback to session data
            const phoneNumber =
              session.user.phone ||
              session.user.whatsappNumber ||
              session.user.whatsapp_number ||
              "";

            setRequestForm((prev) => ({
              ...prev,
              visitor_name: session.user.name || "",
              visitor_email: session.user.email || "",
              visitor_phone: phoneNumber,
            }));
            setProfileLoaded(true);
          }
        } catch (error) {
          console.error("🔍 Error fetching profile:", error);
          // Fallback to session data
          const phoneNumber =
            session.user.phone ||
            session.user.whatsappNumber ||
            session.user.whatsapp_number ||
            "";

          setRequestForm((prev) => ({
            ...prev,
            visitor_name: session.user.name || "",
            visitor_email: session.user.email || "",
            visitor_phone: phoneNumber,
          }));
          setProfileLoaded(true);
        }
      }
    };

    fetchAndFillUserData();
  }, [session, profileLoaded]);

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

        // Auto-select first garden visit if available
        if (data.farm?.availability?.length > 0) {
          const gardenSlot = data.farm.availability.find(
            (slot) => slot.visit_type === "garden"
          );
          const firstSlot = gardenSlot || data.farm.availability[0]; // Fallback to first slot if no garden

          if (firstSlot) {
            setRequestForm((prev) => ({
              ...prev,
              availability_id: firstSlot.id,
              requested_date: firstSlot.date,
              requested_time_start: firstSlot.start_time,
              requested_time_end: firstSlot.end_time,
            }));
          }
        }

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
        toastService.success(
          "Farm visit request submitted successfully! The farmer will review and respond to your request."
        );
        setShowRequestModal(false);
        const phoneNumber =
          userProfile?.whatsapp_number ||
          session.user.phone ||
          session.user.whatsappNumber ||
          session.user.whatsapp_number ||
          "";

        setRequestForm({
          availability_id: "",
          number_of_visitors: 1,
          visitor_name: session.user.name || "",
          visitor_phone: phoneNumber,
          visitor_email: session.user.email || "",
          message_to_farmer:
            "Hi! I'm interested in learning about organic farming practices and would love to see your composting setup.",
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

  const formatDateWithoutWeekday = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
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
    <Container>
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
                Connect with local farmers and gardeners to visit their farms
                and growing spaces. Learn about natural farming practices and
                build relationships with your food producers.
              </p>
            </div>
            {session && (
              <div className="d-flex justify-content-start justify-content-lg-end align-self-stretch align-self-lg-start">
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
        <Row className="farms-section">
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
                        <div className="d-flex align-items-center flex-wrap">
                          <h5 className="card-title text-success mb-0 me-2">
                            {farm.seller_farm_profiles?.[0]?.farm_name ||
                              farm.name}
                          </h5>
                          {farm.location && (
                            <div className="text-muted small">
                              <i className="ti-location-pin me-1"></i>
                              {farm.location.startsWith("http") ? (
                                <a
                                  href={farm.location}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted text-decoration-none"
                                >
                                  View Location
                                </a>
                              ) : (
                                <span>{farm.location}</span>
                              )}
                            </div>
                          )}
                        </div>
                        {farm.seller_farm_profiles?.[0]?.profile_verified && (
                          <Badge bg="success" className="ms-2">
                            <i className="ti-star me-1"></i>
                            Verified
                          </Badge>
                        )}
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
                      {/* Availability Summary */}
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <Badge bg="light" text="dark" className="px-3 py-2">
                          <i className="ti-calendar me-1"></i>
                          <strong>
                            {farm.available_slots_count || 0}
                          </strong>{" "}
                          available slots
                        </Badge>
                        <div>
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
                        </div>
                      </div>

                      {/* Quick Availability Preview */}
                      {farm.available_slots_count > 0 && (
                        <div className="bg-light rounded p-2 mb-2">
                          <small className="text-muted d-block mb-1">
                            <i className="ti-clock me-1"></i>
                            <strong>Available Times:</strong>
                          </small>
                          <div className="d-flex flex-wrap gap-1">
                            <Badge
                              bg="outline-success"
                              text="success"
                              className="border border-success"
                            >
                              Today & upcoming
                            </Badge>
                            <Badge
                              bg="outline-info"
                              text="info"
                              className="border border-info"
                            >
                              Multiple slots
                            </Badge>
                          </div>
                        </div>
                      )}

                      {/* Farm Type Badges */}
                      <div className="d-flex flex-wrap gap-1">
                        {farm.seller_farm_profiles?.[0]?.farm_type && (
                          <Badge
                            bg="outline-success"
                            className="text-capitalize"
                          >
                            {farm.seller_farm_profiles[0].farm_type.replace(
                              "_",
                              " "
                            )}
                          </Badge>
                        )}
                        {farm.seller_farm_profiles?.[0]?.garden_type && (
                          <Badge bg="outline-info" className="text-capitalize">
                            {farm.seller_farm_profiles[0].garden_type.replace(
                              "_",
                              " "
                            )}
                          </Badge>
                        )}
                      </div>
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
        onHide={() => {
          setShowRequestModal(false);
          // Clear selection when modal closes
          setRequestForm((prev) => ({
            ...prev,
            availability_id: "",
            requested_date: "",
            requested_time_start: "",
            requested_time_end: "",
          }));
        }}
        size="xl"
      >
        <Modal.Header closeButton>
          <div className="d-flex justify-content-between align-items-center w-100">
            <Modal.Title>
              <span className="text-muted">Request Visit</span>
              <span className="mx-2">-</span>
              <span className="text-success fw-bold">
                {selectedFarm?.seller_farm_profiles?.[0]?.farm_name ||
                  selectedFarm?.name}
              </span>
            </Modal.Title>
            {selectedFarm?.location && (
              <div className="me-3">
                {selectedFarm.location.startsWith("http") ? (
                  <a
                    href={selectedFarm.location}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted text-decoration-none small"
                  >
                    <i className="ti-location-pin me-1"></i>
                    View Location
                  </a>
                ) : (
                  <small className="text-muted">
                    <i className="ti-location-pin me-1"></i>
                    {selectedFarm.location}
                  </small>
                )}
              </div>
            )}
          </div>
        </Modal.Header>

        <Form onSubmit={submitRequest}>
          <Modal.Body>
            {selectedFarm && (
              <>
                {/* Available Slots Table */}
                <div className="mb-3">
                  <div className="table-responsive">
                    <table className="table table-hover table-sm">
                      <thead className="table-light">
                        <tr>
                          <th width="10%">Select</th>
                          <th width="20%">Date</th>
                          <th width="20%">Time</th>
                          <th width="15%">Type</th>
                          <th width="15%">Capacity</th>
                          <th width="10%">Price</th>
                          <th width="10%">Activity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedFarm.availability?.length > 0 ? (
                          selectedFarm.availability.map((slot) => (
                            <tr
                              key={slot.id}
                              className={
                                requestForm.availability_id === slot.id
                                  ? "table-success"
                                  : ""
                              }
                              style={{ cursor: "pointer" }}
                              onClick={() => {
                                setRequestForm((prev) => ({
                                  ...prev,
                                  availability_id: slot.id,
                                  requested_date: slot.date,
                                  requested_time_start: slot.start_time,
                                  requested_time_end: slot.end_time,
                                }));
                              }}
                            >
                              <td className="text-center align-middle">
                                <Form.Check
                                  type="radio"
                                  name="availability_slot"
                                  className="form-check-sm"
                                  style={{
                                    display: "inline-block",
                                    margin: "0",
                                  }}
                                  checked={
                                    requestForm.availability_id === slot.id
                                  }
                                  readOnly
                                />
                              </td>
                              <td>
                                <div>
                                  <strong>
                                    {formatDateWithoutWeekday(slot.date)}
                                  </strong>
                                  <br />
                                  <small className="text-muted">
                                    {new Date(slot.date).toLocaleDateString(
                                      "en-US",
                                      { weekday: "short" }
                                    )}
                                  </small>
                                </div>
                              </td>
                              <td>
                                <strong>
                                  {formatTime(slot.start_time)} -{" "}
                                  {formatTime(slot.end_time)}
                                </strong>
                              </td>
                              <td>
                                <span
                                  className={`fw-bold ${
                                    slot.visit_type === "farm"
                                      ? "text-success"
                                      : "text-info"
                                  }`}
                                >
                                  {slot.visit_type === "farm"
                                    ? "🚜 Farm"
                                    : "🌱 Garden"}
                                </span>
                              </td>
                              <td>
                                <div>
                                  <strong
                                    className={
                                      slot.current_bookings >= slot.max_visitors
                                        ? "text-danger"
                                        : "text-success"
                                    }
                                  >
                                    {slot.current_bookings}/{slot.max_visitors}
                                  </strong>
                                  <br />
                                  <small className="text-muted">
                                    {slot.max_visitors - slot.current_bookings}{" "}
                                    spots left
                                  </small>
                                </div>
                              </td>
                              <td>
                                <strong>
                                  {slot.price_per_person > 0
                                    ? `₹${slot.price_per_person}`
                                    : "Free"}
                                </strong>
                              </td>
                              <td>
                                <Badge bg="info" className="text-wrap">
                                  {slot.activity_type?.replace("_", " ") ||
                                    "Tour"}
                                </Badge>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="7"
                              className="text-center text-muted py-3"
                            >
                              No available slots found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label
                        className="fw-semibold text-dark mb-2"
                        style={{ fontSize: "14px", letterSpacing: "0.5px" }}
                      >
                        Number of Visitors *
                      </Form.Label>
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
                      <Form.Label
                        className="fw-semibold text-dark mb-2"
                        style={{ fontSize: "14px", letterSpacing: "0.5px" }}
                      >
                        Your Name *
                      </Form.Label>
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
                      <Form.Label
                        className="fw-semibold text-dark mb-2"
                        style={{ fontSize: "14px", letterSpacing: "0.5px" }}
                      >
                        Phone Number *
                      </Form.Label>
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
                      <Form.Label
                        className="fw-semibold text-dark mb-2"
                        style={{ fontSize: "14px", letterSpacing: "0.5px" }}
                      >
                        Email
                      </Form.Label>
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
                  <Form.Label
                    className="fw-semibold text-dark mb-2"
                    style={{ fontSize: "14px", letterSpacing: "0.5px" }}
                  >
                    Message to Farmer
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    maxLength={500}
                    placeholder="Tell the farmer about your visit purpose, special needs, and any questions..."
                    value={requestForm.message_to_farmer}
                    onChange={(e) =>
                      setRequestForm((prev) => ({
                        ...prev,
                        message_to_farmer: e.target.value,
                      }))
                    }
                  />
                  <div className="d-flex justify-content-between align-items-start">
                    <Form.Text className="text-muted">
                      <i className="ti-info-circle me-1"></i>
                      Share your visit purpose and any special needs
                    </Form.Text>
                    <small className="text-muted">
                      {requestForm.message_to_farmer.length}/500 characters
                    </small>
                  </div>
                </Form.Group>
              </>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setShowRequestModal(false);
                // Clear selection when modal closes
                setRequestForm((prev) => ({
                  ...prev,
                  availability_id: "",
                  requested_date: "",
                  requested_time_start: "",
                  requested_time_end: "",
                }));
              }}
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
