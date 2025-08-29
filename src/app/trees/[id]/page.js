"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Table,
  Form,
  Modal,
  Alert,
  Spinner,
} from "react-bootstrap";
import { toast } from "react-hot-toast";

export default function TreeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [tree, setTree] = useState(null);
  const [careLogs, setCareLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCareModal, setShowCareModal] = useState(false);
  const [careFormData, setCareFormData] = useState({
    activity_type: "",
    description: "",
    notes: "",
  });

  const activityTypes = [
    "Watering",
    "Fertilizing",
    "Pruning",
    "Pest Control",
    "Disease Treatment",
    "Harvesting",
    "Soil Testing",
    "Mulching",
    "Transplanting",
    "General Inspection",
  ];

  useEffect(() => {
    if (params.id) {
      fetchTreeDetails();
      fetchCareLogs();
    }
  }, [params.id]);

  const fetchTreeDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/trees?id=${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch tree details");

      const trees = await response.json();
      const treeData = trees.find((t) => t.id === params.id);

      if (!treeData) {
        throw new Error("Tree not found");
      }

      setTree(treeData);
    } catch (error) {
      console.error("Error fetching tree details:", error);
      toast.error(error.message);
      router.push("/trees");
    } finally {
      setLoading(false);
    }
  };

  const fetchCareLogs = async () => {
    try {
      const response = await fetch(`/api/tree-care-logs?treeId=${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setCareLogs(data);
      }
    } catch (error) {
      console.error("Error fetching care logs:", error);
    }
  };

  const handleAddCareLog = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/tree-care-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tree_id: params.id,
          ...careFormData,
        }),
      });

      if (!response.ok) throw new Error("Failed to add care log");

      toast.success("Care log added successfully!");
      setShowCareModal(false);
      setCareFormData({
        activity_type: "",
        description: "",
        notes: "",
      });
      fetchCareLogs();
    } catch (error) {
      console.error("Error adding care log:", error);
      toast.error(error.message);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      const response = await fetch("/api/trees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: tree.id,
          status: newStatus,
        }),
      });

      if (!response.ok) throw new Error("Failed to update tree status");

      setTree((prev) => ({ ...prev, status: newStatus }));
      toast.success("Tree status updated successfully!");
    } catch (error) {
      console.error("Error updating tree status:", error);
      toast.error(error.message);
    }
  };

  const getStatusBadgeVariant = (status) => {
    const variants = {
      healthy: "success",
      growing: "info",
      flowering: "warning",
      fruiting: "primary",
      diseased: "danger",
      dormant: "secondary",
    };
    return variants[status] || "secondary";
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" />
          <p className="mt-2">Loading tree details...</p>
        </div>
      </Container>
    );
  }

  if (!tree) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Tree Not Found</Alert.Heading>
          <p>The requested tree could not be found.</p>
          <Button variant="primary" onClick={() => router.push("/trees")}>
            Back to Trees
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row>
        <Col>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <Button
                variant="outline-secondary"
                onClick={() => router.back()}
                className="me-3"
              >
                <i className="bi bi-arrow-left"></i> Back
              </Button>
              <span className="h2">{tree.name}</span>
              <Badge bg="secondary" className="ms-2 fs-6">
                {tree.code}
              </Badge>
            </div>
            <div className="d-flex gap-2">
              <Button variant="success" onClick={() => setShowCareModal(true)}>
                <i className="bi bi-plus-circle"></i> Add Care Log
              </Button>
              <Button variant="outline-primary" href={`/trees`}>
                Edit Tree
              </Button>
            </div>
          </div>

          <Row>
            {/* Tree Information */}
            <Col lg={4}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Tree Information</h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <strong>Status:</strong>
                    <div className="mt-1">
                      <Badge
                        bg={getStatusBadgeVariant(tree.status)}
                        className="me-2"
                      >
                        {tree.status}
                      </Badge>
                      <Form.Select
                        size="sm"
                        style={{ width: "auto", display: "inline-block" }}
                        value={tree.status}
                        onChange={(e) => handleStatusUpdate(e.target.value)}
                      >
                        <option value="healthy">Healthy</option>
                        <option value="growing">Growing</option>
                        <option value="flowering">Flowering</option>
                        <option value="fruiting">Fruiting</option>
                        <option value="diseased">Diseased</option>
                        <option value="dormant">Dormant</option>
                      </Form.Select>
                    </div>
                  </div>

                  {tree.scientific_name && (
                    <div className="mb-3">
                      <strong>Scientific Name:</strong>
                      <div className="text-muted">{tree.scientific_name}</div>
                    </div>
                  )}

                  {tree.variety && (
                    <div className="mb-3">
                      <strong>Variety:</strong>
                      <div>{tree.variety}</div>
                    </div>
                  )}

                  {tree.planting_date && (
                    <div className="mb-3">
                      <strong>Planting Date:</strong>
                      <div>
                        {new Date(tree.planting_date).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  {tree.expected_harvest_date && (
                    <div className="mb-3">
                      <strong>Expected Harvest:</strong>
                      <div>
                        {new Date(
                          tree.expected_harvest_date
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  {tree.description && (
                    <div className="mb-3">
                      <strong>Description:</strong>
                      <div className="text-muted">{tree.description}</div>
                    </div>
                  )}

                  <div className="mb-3">
                    <strong>Created:</strong>
                    <div className="text-muted">
                      {new Date(tree.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {tree.tree_positions && tree.tree_positions.length > 0 && (
                    <div className="mb-3">
                      <strong>Farm Position:</strong>
                      {tree.tree_positions.map((pos, index) => (
                        <div key={index} className="text-muted">
                          Block {pos.block_index + 1}, Grid ({pos.grid_x},{" "}
                          {pos.grid_y})
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Care Logs */}
            <Col lg={8}>
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Care History</h5>
                  <Badge bg="info">{careLogs.length} records</Badge>
                </Card.Header>
                <Card.Body>
                  {careLogs.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted">No care logs recorded yet.</p>
                      <Button
                        variant="success"
                        onClick={() => setShowCareModal(true)}
                      >
                        Add First Care Log
                      </Button>
                    </div>
                  ) : (
                    <div style={{ maxHeight: "600px", overflowY: "auto" }}>
                      {careLogs.map((log) => (
                        <Card
                          key={log.id}
                          className="mb-3 border-start border-4 border-success"
                        >
                          <Card.Body className="py-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <Badge bg="outline-primary" className="me-2">
                                  {log.activity_type}
                                </Badge>
                                <small className="text-muted">
                                  {new Date(
                                    log.performed_at
                                  ).toLocaleDateString()}{" "}
                                  at{" "}
                                  {new Date(
                                    log.performed_at
                                  ).toLocaleTimeString()}
                                </small>
                              </div>
                            </div>
                            {log.description && (
                              <div className="mb-2">
                                <strong>Activity:</strong> {log.description}
                              </div>
                            )}
                            {log.notes && (
                              <div className="text-muted">
                                <strong>Notes:</strong> {log.notes}
                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Add Care Log Modal */}
      <Modal
        show={showCareModal}
        onHide={() => setShowCareModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Care Log</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddCareLog}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Activity Type *</Form.Label>
                  <Form.Select
                    value={careFormData.activity_type}
                    onChange={(e) =>
                      setCareFormData((prev) => ({
                        ...prev,
                        activity_type: e.target.value,
                      }))
                    }
                    required
                  >
                    <option value="">Select activity type...</option>
                    {activityTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Description *</Form.Label>
                  <Form.Control
                    type="text"
                    value={careFormData.description}
                    onChange={(e) =>
                      setCareFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Brief description of the activity"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Additional Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={careFormData.notes}
                onChange={(e) =>
                  setCareFormData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Any additional observations, measurements, or notes..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCareModal(false)}>
              Cancel
            </Button>
            <Button variant="success" type="submit">
              Add Care Log
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

