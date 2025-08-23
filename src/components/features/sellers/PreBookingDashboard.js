"use client";

import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Table,
  Modal,
  Form,
  Alert,
  Spinner,
} from "react-bootstrap";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import PreBookingService from "@/services/PreBookingService";
import toastService from "@/utils/toastService";
import UserAvatar from "../../common/UserAvatar";

export default function PreBookingDashboard() {
  const [activeView, setActiveView] = useState("pending");
  const [prebookings, setPrebookings] = useState([]);
  const [stats, setStats] = useState({
    totalPrebookings: 0,
    pendingPrebookings: 0,
    acceptedPrebookings: 0,
    completedPrebookings: 0,
    totalQuantity: 0,
    totalValue: 0,
    fulfillmentRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedPrebooking, setSelectedPrebooking] = useState(null);
  const [updateData, setUpdateData] = useState({
    status: "",
    seller_notes: "",
    final_price: "",
    estimated_harvest_date: "",
  });
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.id) {
      loadDashboardData();
    }
  }, [session]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [prebookingsData, statsData] = await Promise.all([
        PreBookingService.getPreBookingsBySeller(session.user.id),
        PreBookingService.getSellerPrebookingStats(session.user.id),
      ]);

      setPrebookings(prebookingsData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toastService.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrebooking = async () => {
    if (!selectedPrebooking) return;

    try {
      const updates = {
        status: updateData.status,
        seller_notes: updateData.seller_notes || null,
        final_price: updateData.final_price
          ? parseFloat(updateData.final_price)
          : null,
        estimated_harvest_date: updateData.estimated_harvest_date || null,
      };

      await PreBookingService.updatePreBookingStatus(
        selectedPrebooking.id,
        updates
      );

      toastService.success("Prebooking updated successfully!");
      setShowUpdateModal(false);
      setSelectedPrebooking(null);
      setUpdateData({
        status: "",
        seller_notes: "",
        final_price: "",
        estimated_harvest_date: "",
      });

      // Reload data
      await loadDashboardData();
    } catch (error) {
      console.error("Error updating prebooking:", error);
      toastService.error("Failed to update prebooking");
    }
  };

  const openUpdateModal = (prebooking) => {
    setSelectedPrebooking(prebooking);
    setUpdateData({
      status: prebooking.status,
      seller_notes: prebooking.seller_notes || "",
      final_price: prebooking.final_price || prebooking.estimated_price || "",
      estimated_harvest_date: prebooking.estimated_harvest_date || "",
    });
    setShowUpdateModal(true);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { bg: "warning", text: "⏳ Pending Review" },
      accepted: { bg: "info", text: "✅ Accepted" },
      in_progress: { bg: "primary", text: "🌱 Growing" },
      ready: { bg: "success", text: "✅ Ready" },
      delivered: { bg: "success", text: "📦 Delivered" },
      rejected: { bg: "danger", text: "❌ Rejected" },
      cancelled: { bg: "secondary", text: "🚫 Cancelled" },
    };

    const badgeInfo = statusMap[status] || { bg: "secondary", text: status };
    return <Badge bg={badgeInfo.bg}>{badgeInfo.text}</Badge>;
  };

  const filterPrebookings = (status) => {
    switch (status) {
      case "pending":
        return prebookings.filter((p) => p.status === "pending");
      case "active":
        return prebookings.filter((p) =>
          ["accepted", "in_progress", "ready"].includes(p.status)
        );
      case "completed":
        return prebookings.filter((p) => p.status === "delivered");
      case "rejected":
        return prebookings.filter((p) =>
          ["cancelled", "rejected"].includes(p.status)
        );
      default:
        return prebookings;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString();
  };

  const getTimeRemaining = (targetDate) => {
    if (!targetDate) return "N/A";

    const now = new Date();
    const target = new Date(targetDate);

    if (isNaN(target.getTime())) return "Invalid Date";

    const diffTime = target - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return `${diffDays} days`;
  };

  const renderContent = () => {
    const filteredData = filterPrebookings(activeView);

    return (
      <Card className="border-0 shadow-sm">
        <Card.Body>
          {filteredData.length === 0 ? (
            <div className="text-center text-muted py-5">
              {activeView === "pending" && (
                <>
                  <i className="ti-time text-warning fs-1 d-block mb-3"></i>
                  <h5>No pending prebookings</h5>
                  <p>
                    New customer prebookings requiring review will appear here.
                  </p>
                </>
              )}
              {activeView === "active" && (
                <>
                  <i className="ti-pulse text-success fs-1 d-block mb-3"></i>
                  <h5>No active orders</h5>
                  <p>Accepted and in-progress prebookings will show here.</p>
                </>
              )}
              {activeView === "completed" && (
                <>
                  <i className="ti-check text-success fs-1 d-block mb-3"></i>
                  <h5>No completed orders</h5>
                  <p>Successfully delivered prebookings will appear here.</p>
                </>
              )}
              {activeView === "rejected" && (
                <>
                  <i className="ti-close text-danger fs-1 d-block mb-3"></i>
                  <h5>No rejected orders</h5>
                  <p>Cancelled or rejected prebookings will appear here.</p>
                </>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead className="bg-light">
                  <tr>
                    <th>Customer</th>
                    <th>Vegetable</th>
                    <th>Quantity</th>
                    <th>Target Date</th>
                    <th>Status</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((prebooking) => (
                    <tr key={prebooking.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <UserAvatar
                            user={prebooking.user}
                            size={32}
                            className="me-2"
                          />
                          <div>
                            <div className="fw-medium">
                              {prebooking.user?.name || "Unknown"}
                            </div>
                            <small className="text-muted">
                              {prebooking.user?.phone}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="fw-medium">
                            {prebooking.vegetable_name}
                          </div>
                          <small className="text-muted">
                            {prebooking.category}
                          </small>
                        </div>
                      </td>
                      <td>
                        {prebooking.quantity}
                        {prebooking.unit}
                      </td>
                      <td>
                        <div>{formatDate(prebooking.target_date)}</div>
                        <small className="text-muted">
                          {getTimeRemaining(prebooking.target_date)}
                        </small>
                      </td>
                      <td>{getStatusBadge(prebooking.status)}</td>
                      <td>
                        <div>
                          ₹
                          {(
                            prebooking.final_price ||
                            prebooking.estimated_price ||
                            0
                          ).toFixed(2)}
                        </div>
                        <small className="text-muted">per kg</small>
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => openUpdateModal(prebooking)}
                        >
                          Update
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    );
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" className="mb-3" />
        <p className="text-muted">Loading your prebooking dashboard...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="pb-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">🌱 Prebooking Dashboard</h1>
          <p className="text-muted mb-0">Manage customer advance orders</p>
        </div>
        <Button variant="outline-primary" onClick={loadDashboardData}>
          <i className="ti-reload me-2"></i>
          Refresh
        </Button>
      </div>

      {/* Summary Tiles - Clickable */}
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
              <h5 className="mb-1">{stats.totalPrebookings}</h5>
              <p className="text-muted mb-0 small">Total Prebookings</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card
            className={`border shadow-sm rounded-3 h-100 ${
              activeView === "pending" ? "border-warning" : ""
            }`}
            style={{
              borderColor: activeView === "pending" ? "#ffc107" : "#e3e6f0",
              transition: "all 0.2s ease",
              cursor: "pointer",
              borderWidth: activeView === "pending" ? "2px" : "1px",
            }}
            onClick={() => setActiveView("pending")}
          >
            <Card.Body className="text-center">
              <div
                className="bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: "60px", height: "60px" }}
              >
                <i className="ti-time text-warning fs-4"></i>
              </div>
              <h5 className="mb-1">{filterPrebookings("pending").length}</h5>
              <p className="text-muted mb-0 small">Pending Review</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card
            className={`border shadow-sm rounded-3 h-100 ${
              activeView === "active" ? "border-success" : ""
            }`}
            style={{
              borderColor: activeView === "active" ? "#198754" : "#e3e6f0",
              transition: "all 0.2s ease",
              cursor: "pointer",
              borderWidth: activeView === "active" ? "2px" : "1px",
            }}
            onClick={() => setActiveView("active")}
          >
            <Card.Body className="text-center">
              <div
                className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: "60px", height: "60px" }}
              >
                <i className="ti-pulse text-success fs-4"></i>
              </div>
              <h5 className="mb-1">{filterPrebookings("active").length}</h5>
              <p className="text-muted mb-0 small">Active Orders</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card
            className={`border shadow-sm rounded-3 h-100 ${
              activeView === "completed" ? "border-info" : ""
            }`}
            style={{
              borderColor: activeView === "completed" ? "#0dcaf0" : "#e3e6f0",
              transition: "all 0.2s ease",
              cursor: "pointer",
              borderWidth: activeView === "completed" ? "2px" : "1px",
            }}
            onClick={() => setActiveView("completed")}
          >
            <Card.Body className="text-center">
              <div
                className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: "60px", height: "60px" }}
              >
                <i className="ti-check text-info fs-4"></i>
              </div>
              <h5 className="mb-1">{filterPrebookings("completed").length}</h5>
              <p className="text-muted mb-0 small">Completed</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Content based on selected tile */}
      {renderContent()}

      {/* Update Prebooking Modal */}
      <Modal
        show={showUpdateModal}
        onHide={() => setShowUpdateModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fs-5">Update Prebooking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPrebooking && (
            <>
              <div className="mb-3 p-3 bg-light rounded">
                <div className="row">
                  <div className="col-6">
                    <strong>{selectedPrebooking.vegetable_name}</strong>
                    <br />
                    <small className="text-muted">
                      {selectedPrebooking.quantity}
                      {selectedPrebooking.unit}
                    </small>
                  </div>
                  <div className="col-6 text-end">
                    <strong>{selectedPrebooking.user?.name}</strong>
                    <br />
                    <small className="text-muted">
                      Target:{" "}
                      {new Date(
                        selectedPrebooking.target_date
                      ).toLocaleDateString()}
                    </small>
                  </div>
                </div>
              </div>

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={updateData.status}
                    onChange={(e) =>
                      setUpdateData({ ...updateData, status: e.target.value })
                    }
                  >
                    <option value="pending">⏳ Pending Review</option>
                    <option value="accepted">✅ Accepted</option>
                    <option value="in_progress">🌱 Growing</option>
                    <option value="ready">✅ Ready for Pickup</option>
                    <option value="delivered">📦 Delivered</option>
                    <option value="rejected">❌ Cannot Fulfill</option>
                  </Form.Select>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Final Price (₹/kg)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.50"
                        placeholder="Enter final price"
                        value={updateData.final_price}
                        onChange={(e) =>
                          setUpdateData({
                            ...updateData,
                            final_price: e.target.value,
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Est. Harvest Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={updateData.estimated_harvest_date}
                        onChange={(e) =>
                          setUpdateData({
                            ...updateData,
                            estimated_harvest_date: e.target.value,
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Notes for Customer</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Add any notes or special instructions..."
                    value={updateData.seller_notes}
                    onChange={(e) =>
                      setUpdateData({
                        ...updateData,
                        seller_notes: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowUpdateModal(false)}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdatePrebooking}>
            Update Prebooking
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
