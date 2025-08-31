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
import AdminGuard from "@/components/common/AdminGuard";
import SearchInput from "@/components/common/SearchInput";
import ClearFiltersButton from "@/components/common/ClearFiltersButton";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedTree, setSelectedTree] = useState(null);

  // Tree status options
  const statusOptions = [
    { value: "healthy", label: "Healthy", variant: "success" },
    { value: "growing", label: "Growing", variant: "info" },
    { value: "flowering", label: "Flowering", variant: "warning" },
    { value: "fruiting", label: "Fruiting", variant: "primary" },
    { value: "diseased", label: "Diseased", variant: "danger" },
    { value: "dormant", label: "Dormant", variant: "secondary" },
  ];

  // Predefined tree codes for quick selection - matches PlantTreeModal
  const treeCodeOptions = [
    "M", // Mango
    "L", // Lemon
    "AS", // All Spices
    "A", // Apple
    "CA", // Custard Apple
    "G", // Guava
    "AN", // Anjeer
    "P", // Pomegranate
    "MB", // Mulberry
    "JA", // Jackfruit
    "BC", // Barbadoos Cherry
    "AV", // Avocado
    "SF", // Starfruit
    "C", // Cashew
    "PR", // Pear
    "PC", // Peach
    "SP", // Sapota
    "MR", // Moringa
    "BB", // Black Berry
    "LC", // Lychee
    "MF", // Miracle Fruit
    "KR", // Karoda
    "AB", // Apple Ber
    "BA", // Banana
    "PA", // Papaya
    "GR", // Grape
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

  const handleDelete = (tree) => {
    setSelectedTree(tree);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/trees?id=${selectedTree.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete tree");

      toast.success("Tree deleted successfully!");
      fetchTrees();
    } catch (error) {
      console.error("Error deleting tree:", error);
      toast.error("Failed to delete tree");
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setSelectedTree(null);
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
    <AdminGuard requiredRole="admin">
      <Container fluid className="pb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
          <div className="d-flex align-items-center gap-3">
            <h1 className="h3 mb-0">
              <i className="ti-package me-2 text-success"></i>
              Tree Management
            </h1>
            <Badge bg="light" text="dark" className="fs-6">
              {trees.length} Trees
            </Badge>
          </div>
          <Button
            variant="success"
            onClick={() => setShowModal(true)}
            className="d-flex align-items-center flex-shrink-0"
          >
            <i className="ti-plus me-2"></i>
            <span className="d-none d-sm-inline">Add New Tree</span>
            <span className="d-sm-none">Add</span>
          </Button>
        </div>

        <Row>
          <Col>
            <Card className="shadow-sm">
              <Card.Body>
                {/* Search and Filter Controls */}
                <div className="mb-4">
                  <Row className="g-3 align-items-end">
                    <Col xs={12} lg={6}>
                      <Form.Group className="mb-0">
                        <Form.Label className="small fw-medium text-muted mb-2">
                          Search Trees
                        </Form.Label>
                        <SearchInput
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onClear={() => setSearchTerm("")}
                          placeholder="Search by name, code, or scientific name..."
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} lg={3}>
                      <Form.Group className="mb-0">
                        <Form.Label className="small fw-medium text-muted mb-2">
                          Filter by Status
                        </Form.Label>
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
                      </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} lg={3}>
                      <ClearFiltersButton
                        onClick={() => {
                          setSearchTerm("");
                          setFilterStatus("");
                        }}
                      />
                    </Col>
                  </Row>
                </div>

                {/* Trees Table */}
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="success" />
                    <p className="mt-3 text-muted">Loading trees...</p>
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
                          <th className="border-0 ps-3">Code</th>
                          <th className="border-0">Name</th>
                          <th className="border-0">Scientific Name</th>
                          <th className="border-0">Variety</th>
                          <th className="border-0">Status</th>
                          <th className="border-0">Planting Date</th>
                          <th className="border-0">Expected Harvest</th>
                          <th
                            className="border-0 text-center"
                            style={{ width: "120px" }}
                          >
                            Actions
                          </th>
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
                            <tr key={tree.id} className="align-middle">
                              <td className="ps-3">
                                <Badge
                                  bg="secondary"
                                  className="fs-6 fw-normal"
                                >
                                  {tree.code}
                                </Badge>
                              </td>
                              <td>
                                <div className="fw-medium">{tree.name}</div>
                              </td>
                              <td className="text-muted">
                                {tree.scientific_name || "-"}
                              </td>
                              <td className="text-muted">
                                {tree.variety || "-"}
                              </td>
                              <td>{getStatusBadge(tree.status)}</td>
                              <td className="text-muted">
                                {tree.planting_date
                                  ? new Date(
                                      tree.planting_date
                                    ).toLocaleDateString()
                                  : "-"}
                              </td>
                              <td className="text-muted">
                                {tree.expected_harvest_date
                                  ? new Date(
                                      tree.expected_harvest_date
                                    ).toLocaleDateString()
                                  : "-"}
                              </td>
                              <td>
                                <div className="d-flex gap-1 justify-content-center">
                                  <button
                                    type="button"
                                    className="btn btn-link text-primary p-1 border-0"
                                    onClick={() => handleEdit(tree)}
                                    title="Edit tree"
                                    style={{ width: "32px", height: "32px" }}
                                  >
                                    <i className="ti ti-pencil"></i>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-link text-danger p-1 border-0"
                                    onClick={() => handleDelete(tree)}
                                    title="Delete tree"
                                    style={{ width: "32px", height: "32px" }}
                                  >
                                    <i className="ti ti-trash"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
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

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          show={showDeleteModal}
          onHide={() => {
            setShowDeleteModal(false);
            setSelectedTree(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Delete Tree"
          message={
            selectedTree
              ? `Are you sure you want to delete "${selectedTree.name}" (${selectedTree.code})? This action cannot be undone.`
              : "Are you sure you want to delete this tree?"
          }
          loading={deleteLoading}
        />
      </Container>
    </AdminGuard>
  );
}
