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
  Badge,
} from "react-bootstrap";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import vegetableService from "@/services/VegetableService";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import SearchInput from "@/components/common/SearchInput";
import VegetableForm from "./VegetableForm";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";

export default function VegetableManagement() {
  const { data: session } = useSession();
  const [vegetables, setVegetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedVegetable, setSelectedVegetable] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Filter vegetables based on search term and category filter
  const filteredVegetables = vegetables.filter((vegetable) => {
    const matchesSearch =
      vegetable.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vegetable.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || vegetable.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadge = (category) => {
    const variants = {
      leafy: "success",
      root: "warning",
      fruit: "danger",
      exotic: "info",
      seasonal: "primary",
      organic: "dark",
    };
    const icons = {
      leafy: "ti-leaf",
      root: "ti-git-branch",
      fruit: "ti-apple",
      exotic: "ti-star",
      seasonal: "ti-calendar",
      organic: "ti-heart",
    };
    return (
      <Badge bg={variants[category] || "secondary"}>
        <i className={`ti ${icons[category] || "ti-package"} me-1`}></i>
        {category}
      </Badge>
    );
  };

  const handleEdit = (vegetable) => {
    setSelectedVegetable(vegetable);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedVegetable(null);
  };

  const handleDelete = (vegetable) => {
    setSelectedVegetable(vegetable);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await vegetableService.deleteVegetable(selectedVegetable.id);
      toast.success("Product deleted successfully");
      loadVegetables();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setSelectedVegetable(null);
    }
  };

  const loadVegetables = async () => {
    try {
      if (!session?.user?.id) {
        console.warn("No user ID in session");
        setVegetables([]);
        setLoading(false);
        return;
      }

      console.log("Loading vegetables for user:", {
        id: session.user.id,
        email: session.user.email,
      });

      // Always use the session user ID
      const data = await vegetableService.getVegetablesByOwner(session.user.id);
      console.log("Loaded vegetables:", data);
      setVegetables(data || []);
    } catch (error) {
      toast.error("Failed to load products");
      console.error("Error loading products:", error);
      setVegetables([]); // Reset vegetables on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session === null) {
      setLoading(false);
      return;
    }

    if (session?.user?.id) {
      loadVegetables();
    } else if (session) {
      console.warn("Session exists but no user ID, session:", session);
      setLoading(false);
    }
  }, [session]);

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-3">
      <Row className="mb-3 align-items-center">
        <Col>
          <div className="d-flex align-items-center gap-3">
            <div>
              <h1 className="h3 mb-1">My Products</h1>
              <p className="text-muted mb-0 small">
                {vegetables.length === 0
                  ? "Start your natural farming business"
                  : "Manage your product listings"}
              </p>
            </div>
            {vegetables.length > 0 && (
              <div className="d-flex align-items-center gap-2">
                <Badge bg="info" className="small">
                  <i className="ti ti-package me-1"></i>
                  {vegetables.length} Products
                </Badge>
                <Badge bg="success" className="small">
                  <i className="ti ti-check me-1"></i>
                  {filteredVegetables.length} Shown
                </Badge>
              </div>
            )}
          </div>
        </Col>
        <Col xs="auto">
          <Button variant="success" onClick={() => setShowForm(true)}>
            <i className="ti ti-plus me-2"></i>
            {vegetables.length === 0
              ? "Add Your First Product"
              : "Add New Product"}
          </Button>
        </Col>
      </Row>

      <Card>
        <Card.Body>
          {/* Search and Filter Controls - Only show when there are products */}
          {vegetables.length > 0 && (
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Search Products</Form.Label>
                  <SearchInput
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClear={() => setSearchTerm("")}
                    placeholder="Search by name or description..."
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Filter by Category</Form.Label>
                  <Form.Select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    <option value="leafy">Leafy</option>
                    <option value="root">Root</option>
                    <option value="fruit">Fruit</option>
                    <option value="exotic">Exotic</option>
                    <option value="seasonal">Seasonal</option>
                    <option value="organic">Organic</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3} className="d-flex align-items-end">
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setSearchTerm("");
                    setCategoryFilter("all");
                  }}
                >
                  <i className="ti ti-refresh me-2"></i>
                  Clear Filters
                </Button>
              </Col>
            </Row>
          )}

          {vegetables.length > 0 ? (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="border-0">Product</th>
                    <th className="border-0">Price</th>
                    <th className="border-0">Quantity</th>
                    <th className="border-0">Category</th>
                    <th className="border-0">Location</th>
                    <th className="border-0">Created</th>
                    <th className="border-0">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVegetables.length > 0 ? (
                    filteredVegetables.map((vegetable) => (
                      <tr key={vegetable.id} className="align-middle">
                        <td>
                          <div className="d-flex align-items-center">
                            {vegetable.images?.[0] ? (
                              <img
                                src={vegetable.images[0]}
                                alt={vegetable.name}
                                className="rounded me-3"
                                style={{
                                  width: 40,
                                  height: 40,
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <div
                                className="bg-light rounded me-3 d-flex align-items-center justify-content-center"
                                style={{ width: 40, height: 40 }}
                              >
                                <i className="ti ti-package text-muted"></i>
                              </div>
                            )}
                            <div>
                              <div className="fw-bold">{vegetable.name}</div>
                              {vegetable.description && (
                                <small className="text-muted">
                                  {vegetable.description.length > 50
                                    ? `${vegetable.description.substring(
                                        0,
                                        50
                                      )}...`
                                    : vegetable.description}
                                </small>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="fw-bold text-success">
                            ₹{vegetable.price}
                          </span>
                          <small className="text-muted d-block">per kg</small>
                        </td>
                        <td>
                          <span className="fw-bold">{vegetable.quantity}</span>
                          <small className="text-muted d-block">
                            kg available
                          </small>
                        </td>
                        <td>{getCategoryBadge(vegetable.category)}</td>
                        <td>
                          <i className="ti ti-map-pin me-1 text-muted"></i>
                          {vegetable.location || (
                            <span className="text-muted">Not specified</span>
                          )}
                        </td>
                        <td>
                          <small className="text-muted">
                            {new Date(
                              vegetable.created_at
                            ).toLocaleDateString()}
                          </small>
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <button
                              type="button"
                              className="btn btn-link text-primary p-0 me-3 text-decoration-none"
                              onClick={() => handleEdit(vegetable)}
                              title="Edit product"
                            >
                              <i className="ti ti-pencil fs-5"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-link text-danger p-0 text-decoration-none"
                              onClick={() => handleDelete(vegetable)}
                              title="Delete product"
                            >
                              <i className="ti ti-trash fs-5"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
                        <div className="text-muted">
                          <i
                            className="ti ti-search"
                            style={{ fontSize: "2rem" }}
                          ></i>
                          <p className="mt-2 mb-0">
                            No products found matching your criteria
                          </p>
                          <small>
                            Try adjusting your search terms or filters
                          </small>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-5">
              <div className="mb-4">
                <div
                  className="bg-light rounded-circle mx-auto d-flex align-items-center justify-content-center mb-3"
                  style={{ width: "80px", height: "80px" }}
                >
                  <i
                    className="ti ti-package text-success"
                    style={{ fontSize: "2.5rem" }}
                  ></i>
                </div>
              </div>
              <h5 className="text-dark mb-2">No products added yet</h5>
              <p
                className="text-muted mb-4 mx-auto"
                style={{ maxWidth: "400px" }}
              >
                Start selling your fresh, natural products by adding your first
                item to the marketplace. It only takes a few minutes!
              </p>
              <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                <Button
                  variant="success"
                  size="lg"
                  onClick={() => setShowForm(true)}
                  className="px-4"
                >
                  <i className="ti ti-plus me-2"></i>
                  Add Your First Product
                </Button>
                <Button variant="outline-primary" size="lg" className="px-4">
                  <i className="ti ti-help me-2"></i>
                  How it works
                </Button>
              </div>
              <div className="mt-4">
                <small className="text-muted">
                  💡 <strong>Tips:</strong> Add high-quality photos, detailed
                  descriptions, and competitive pricing to attract more buyers
                </small>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      <VegetableForm
        show={showForm}
        onHide={handleCloseForm}
        onSuccess={loadVegetables}
        vegetable={selectedVegetable}
      />

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete ${selectedVegetable?.name}? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </Container>
  );
}
