"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Form,
  Modal,
  Alert,
  Badge,
  Spinner,
} from "react-bootstrap";
import { toast } from "react-hot-toast";

export default function TreesPage() {
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTree, setEditingTree] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    scientific_name: "",
    variety: "",
    description: "",
    planting_date: "",
    expected_harvest_date: "",
    status: "healthy",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Tree status options
  const statusOptions = [
    { value: "healthy", label: "Healthy", variant: "success" },
    { value: "growing", label: "Growing", variant: "info" },
    { value: "flowering", label: "Flowering", variant: "warning" },
    { value: "fruiting", label: "Fruiting", variant: "primary" },
    { value: "diseased", label: "Diseased", variant: "danger" },
    { value: "dormant", label: "Dormant", variant: "secondary" },
  ];

  // Predefined tree codes for quick selection
  const treeCodeOptions = [
    "M",
    "L",
    "P",
    "G",
    "AN",
    "CA",
    "A",
    "MB",
    "PR",
    "JA",
    "MU",
    "O",
    "B",
    "AV",
    "SF",
    "C",
    "AM",
    "MR",
    "SL",
    "KR",
    "BA",
    "PA",
    "GRP",
  ];

  useEffect(() => {
    fetchTrees();
  }, []);

  const fetchTrees = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/trees");
      if (!response.ok) throw new Error("Failed to fetch trees");
      const data = await response.json();
      setTrees(data);
    } catch (error) {
      console.error("Error fetching trees:", error);
      toast.error("Failed to load trees");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingTree ? "/api/trees" : "/api/trees";
      const method = editingTree ? "PUT" : "POST";
      const payload = editingTree
        ? { ...formData, id: editingTree.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save tree");
      }

      toast.success(
        editingTree
          ? "Tree updated successfully!"
          : "Tree created successfully!"
      );
      handleCloseModal();
      fetchTrees();
    } catch (error) {
      console.error("Error saving tree:", error);
      toast.error(error.message);
    }
  };

  const handleEdit = (tree) => {
    setEditingTree(tree);
    setFormData({
      code: tree.code || "",
      name: tree.name || "",
      scientific_name: tree.scientific_name || "",
      variety: tree.variety || "",
      description: tree.description || "",
      planting_date: tree.planting_date || "",
      expected_harvest_date: tree.expected_harvest_date || "",
      status: tree.status || "healthy",
    });
    setShowModal(true);
  };

  const handleDelete = async (treeId) => {
    if (!confirm("Are you sure you want to delete this tree?")) return;

    try {
      const response = await fetch(`/api/trees?id=${treeId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete tree");

      toast.success("Tree deleted successfully!");
      fetchTrees();
    } catch (error) {
      console.error("Error deleting tree:", error);
      toast.error("Failed to delete tree");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTree(null);
    setFormData({
      code: "",
      name: "",
      scientific_name: "",
      variety: "",
      description: "",
      planting_date: "",
      expected_harvest_date: "",
      status: "healthy",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Filter trees based on search and status
  const filteredTrees = trees.filter((tree) => {
    const matchesSearch =
      searchTerm === "" ||
      tree.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tree.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tree.scientific_name &&
        tree.scientific_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filterStatus === "" || tree.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const statusOption =
      statusOptions.find((opt) => opt.value === status) || statusOptions[0];
    return <Badge bg={statusOption.variant}>{statusOption.label}</Badge>;
  };

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h3 className="mb-0">Tree Management</h3>
              <Button
                variant="success"
                onClick={() => setShowModal(true)}
                className="d-flex align-items-center gap-2"
              >
                <i className="bi bi-plus-circle"></i>
                Add New Tree
              </Button>
            </Card.Header>

            <Card.Body>
              {/* Filters */}
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Control
                    type="text"
                    placeholder="Search trees by name, code, or scientific name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">All Status</option>
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Button
                    variant="outline-secondary"
                    onClick={() => {
                      setSearchTerm("");
                      setFilterStatus("");
                    }}
                    className="w-100"
                  >
                    Clear Filters
                  </Button>
                </Col>
              </Row>

              {/* Trees Table */}
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                  <p className="mt-2">Loading trees...</p>
                </div>
              ) : (
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Scientific Name</th>
                      <th>Variety</th>
                      <th>Status</th>
                      <th>Planting Date</th>
                      <th>Expected Harvest</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrees.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-4">
                          {trees.length === 0
                            ? "No trees found. Add your first tree!"
                            : "No trees match your filters."}
                        </td>
                      </tr>
                    ) : (
                      filteredTrees.map((tree) => (
                        <tr key={tree.id}>
                          <td>
                            <Badge bg="secondary" className="fs-6">
                              {tree.code}
                            </Badge>
                          </td>
                          <td>{tree.name}</td>
                          <td className="text-muted">
                            {tree.scientific_name || "-"}
                          </td>
                          <td>{tree.variety || "-"}</td>
                          <td>{getStatusBadge(tree.status)}</td>
                          <td>
                            {tree.planting_date
                              ? new Date(
                                  tree.planting_date
                                ).toLocaleDateString()
                              : "-"}
                          </td>
                          <td>
                            {tree.expected_harvest_date
                              ? new Date(
                                  tree.expected_harvest_date
                                ).toLocaleDateString()
                              : "-"}
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() => handleEdit(tree)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => handleDelete(tree.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add/Edit Tree Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingTree ? "Edit Tree" : "Add New Tree"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tree Code *</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      required
                      maxLength={10}
                      placeholder="e.g., M, L, P"
                    />
                    <Form.Select
                      value=""
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          code: e.target.value,
                        }))
                      }
                      style={{ maxWidth: "120px" }}
                    >
                      <option value="">Quick Select</option>
                      {treeCodeOptions.map((code) => (
                        <option key={code} value={code}>
                          {code}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tree Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Mango"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Scientific Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="scientific_name"
                    value={formData.scientific_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Mangifera indica"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Variety</Form.Label>
                  <Form.Control
                    type="text"
                    name="variety"
                    value={formData.variety}
                    onChange={handleInputChange}
                    placeholder="e.g., Alphonso"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Planting Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="planting_date"
                    value={formData.planting_date}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Expected Harvest Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="expected_harvest_date"
                    value={formData.expected_harvest_date}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Additional details about this tree..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="success" type="submit">
              {editingTree ? "Update Tree" : "Add Tree"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

