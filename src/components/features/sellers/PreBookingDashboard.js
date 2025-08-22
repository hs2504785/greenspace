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
  ProgressBar,
  Tabs,
  Tab,
} from "react-bootstrap";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import PreBookingService from "@/services/PreBookingService";
import toastService from "@/utils/toastService";
import UserAvatar from "../../common/UserAvatar";

export default function PreBookingDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [prebookings, setPrebookings] = useState([]);
  const [demandAnalytics, setDemandAnalytics] = useState([]);
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

      const [prebookingsData, analyticsData, statsData] = await Promise.all([
        PreBookingService.getPreBookingsBySeller(session.user.id),
        PreBookingService.getDemandAnalytics({ sellerId: session.user.id }),
        PreBookingService.getSellerPrebookingStats(session.user.id),
      ]);

      setPrebookings(prebookingsData);
      setDemandAnalytics(analyticsData);
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

  const getDemandBadge = (level, count) => {
    if (level === "high" || count >= 20)
      return { bg: "danger", text: "🔥 High", count };
    if (level === "medium" || count >= 5)
      return { bg: "warning", text: "⭐ Popular", count };
    if (level === "low" || count >= 1)
      return { bg: "info", text: "🌱 Requested", count };
    return { bg: "outline-secondary", text: "✨ New", count: 0 };
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
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">🌱 Prebooking Dashboard</h1>
          <p className="text-muted mb-0">
            Manage advance orders and track demand
          </p>
        </div>
        <Button variant="outline-primary" onClick={loadDashboardData}>
          <i className="ti-refresh me-2"></i>
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <Row className="g-4 mb-4">
        <Col xl={3} md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0 me-3">
                  <div className="bg-primary bg-opacity-10 rounded p-3">
                    <i className="ti-shopping-cart text-primary"></i>
                  </div>
                </div>
                <div>
                  <h5 className="mb-1">{stats.totalPrebookings}</h5>
                  <p className="text-muted mb-0 small">Total Prebookings</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0 me-3">
                  <div className="bg-warning bg-opacity-10 rounded p-3">
                    <i className="ti-clock text-warning"></i>
                  </div>
                </div>
                <div>
                  <h5 className="mb-1">{stats.pendingPrebookings}</h5>
                  <p className="text-muted mb-0 small">Pending Review</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0 me-3">
                  <div className="bg-success bg-opacity-10 rounded p-3">
                    <i className="ti-package text-success"></i>
                  </div>
                </div>
                <div>
                  <h5 className="mb-1">{stats.totalQuantity.toFixed(1)}kg</h5>
                  <p className="text-muted mb-0 small">Total Quantity</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0 me-3">
                  <div className="bg-info bg-opacity-10 rounded p-3">
                    <i className="ti-trending-up text-info"></i>
                  </div>
                </div>
                <div>
                  <h5 className="mb-1">{stats.fulfillmentRate}%</h5>
                  <p className="text-muted mb-0 small">Fulfillment Rate</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs Navigation */}
      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
        {/* Overview Tab */}
        <Tab eventKey="overview" title="📊 Overview">
          <Row className="g-4">
            {/* High Demand Vegetables */}
            <Col lg={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white border-0 pb-0">
                  <h6 className="mb-0">🔥 High Demand Vegetables</h6>
                  <small className="text-muted">
                    Items with 5+ prebookings
                  </small>
                </Card.Header>
                <Card.Body className="pt-3">
                  {demandAnalytics.filter((item) => item.total_prebookings >= 5)
                    .length === 0 ? (
                    <div className="text-center text-muted py-4">
                      <i className="ti-info-circle fs-1 d-block mb-2"></i>
                      <p>No high-demand items yet</p>
                      <small>Items with 5+ prebookings will appear here</small>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {demandAnalytics
                        .filter((item) => item.total_prebookings >= 5)
                        .slice(0, 5)
                        .map((item, index) => {
                          const demand = getDemandBadge(
                            item.demand_level,
                            item.total_prebookings
                          );
                          return (
                            <div
                              key={index}
                              className="d-flex justify-content-between align-items-center py-2 border-bottom"
                            >
                              <div>
                                <div className="fw-medium">
                                  {item.vegetable_name}
                                </div>
                                <small className="text-muted">
                                  {item.category}
                                </small>
                              </div>
                              <div className="text-end">
                                <Badge bg={demand.bg} className="mb-1">
                                  {demand.text}
                                </Badge>
                                <div className="small text-muted">
                                  {item.total_prebookings} orders
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Recent Prebookings */}
            <Col lg={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white border-0 pb-0">
                  <h6 className="mb-0">📋 Recent Prebookings</h6>
                  <small className="text-muted">
                    Latest orders requiring attention
                  </small>
                </Card.Header>
                <Card.Body className="pt-3">
                  {prebookings.filter((p) => p.status === "pending").length ===
                  0 ? (
                    <div className="text-center text-muted py-4">
                      <i className="ti-check-circle fs-1 d-block mb-2"></i>
                      <p>All caught up!</p>
                      <small>No pending prebookings to review</small>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {prebookings
                        .filter((p) => p.status === "pending")
                        .slice(0, 5)
                        .map((prebooking) => (
                          <div
                            key={prebooking.id}
                            className="d-flex justify-content-between align-items-center py-2 border-bottom"
                          >
                            <div className="flex-grow-1">
                              <div className="fw-medium">
                                {prebooking.vegetable_name}
                              </div>
                              <div className="small text-muted d-flex align-items-center">
                                <UserAvatar
                                  user={prebooking.user}
                                  size={16}
                                  className="me-1"
                                />
                                {prebooking.user?.name} • {prebooking.quantity}
                                kg
                              </div>
                            </div>
                            <div className="text-end">
                              <div className="small text-muted mb-1">
                                {new Date(
                                  prebooking.target_date
                                ).toLocaleDateString()}
                              </div>
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() => openUpdateModal(prebooking)}
                              >
                                Review
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        {/* Prebookings Tab */}
        <Tab eventKey="prebookings" title="📝 All Prebookings">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              {prebookings.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <i className="ti-shopping-cart fs-1 d-block mb-3"></i>
                  <h5>No prebookings yet</h5>
                  <p>
                    Customer prebookings will appear here when they start
                    ordering from you.
                  </p>
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
                      {prebookings.map((prebooking) => (
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
                            <div>
                              {new Date(
                                prebooking.target_date
                              ).toLocaleDateString()}
                            </div>
                            <small className="text-muted">
                              {Math.ceil(
                                (new Date(prebooking.target_date) -
                                  new Date()) /
                                  (1000 * 60 * 60 * 24)
                              )}{" "}
                              days
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
        </Tab>

        {/* Demand Analytics Tab */}
        <Tab eventKey="analytics" title="📈 Demand Analytics">
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
              <h6 className="mb-0">Vegetable Demand Analytics</h6>
              <small className="text-muted">
                Track what customers are requesting
              </small>
            </Card.Header>
            <Card.Body>
              {demandAnalytics.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <i className="ti-chart-line fs-1 d-block mb-3"></i>
                  <h5>No demand data yet</h5>
                  <p>
                    Analytics will appear when customers start making
                    prebookings.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="align-middle">
                    <thead className="bg-light">
                      <tr>
                        <th>Vegetable</th>
                        <th>Category</th>
                        <th>Total Demand</th>
                        <th>Unique Customers</th>
                        <th>Avg. Price</th>
                        <th>Earliest Needed</th>
                        <th>Demand Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {demandAnalytics.map((item, index) => {
                        const demand = getDemandBadge(
                          item.demand_level,
                          item.total_prebookings
                        );
                        return (
                          <tr key={index}>
                            <td className="fw-medium">{item.vegetable_name}</td>
                            <td>
                              <Badge bg="outline-secondary" className="small">
                                {item.category}
                              </Badge>
                            </td>
                            <td>
                              <div>{item.total_quantity_demanded || 0}kg</div>
                              <small className="text-muted">
                                {item.total_prebookings} orders
                              </small>
                            </td>
                            <td>{item.unique_customers || 0}</td>
                            <td>
                              ₹{(item.avg_estimated_price || 0).toFixed(2)}
                            </td>
                            <td>
                              {item.earliest_needed_date
                                ? new Date(
                                    item.earliest_needed_date
                                  ).toLocaleDateString()
                                : "No date set"}
                            </td>
                            <td>
                              <Badge bg={demand.bg}>{demand.text}</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

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
