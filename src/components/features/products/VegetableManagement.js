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
import toastService from "@/utils/toastService";
import vegetableService from "@/services/VegetableService";
import SearchInput from "@/components/common/SearchInput";
import ClearFiltersButton from "@/components/common/ClearFiltersButton";
import VegetableForm from "./VegetableForm";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import { useRouter } from "next/navigation";

// Helper function removed - using direct logic for better debugging

export default function VegetableManagement() {
  const { data: session } = useSession();
  const router = useRouter();
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
      toastService.presets.deleteSuccess();
      loadVegetables();
    } catch (error) {
      console.error("Error deleting product:", error);
      toastService.presets.deleteError();
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
      toastService.error("Failed to load products");
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
    <Container className="py-3 py-md-4">
      {/* Header Section with Improved Mobile Layout */}
      <div className="mb-4">
        <Row className="g-3 align-items-start">
          <Col xs={12} lg={8}>
            <div className="mb-3 mb-lg-0">
              <div className="d-flex align-items-center flex-wrap gap-3 mb-2">
                <h1 className="h3 mb-0 lh-1">My Products</h1>
                {vegetables.length > 0 && (
                  <div className="d-flex align-items-center flex-wrap gap-2">
                    <Badge
                      bg="info"
                      className="small px-2 py-1 d-flex align-items-center"
                    >
                      <i className="ti ti-package me-1"></i>
                      {vegetables.length} Products
                    </Badge>
                    <Badge
                      bg="success"
                      className="small px-2 py-1 d-flex align-items-center"
                    >
                      <i className="ti ti-check me-1"></i>
                      {filteredVegetables.length} Shown
                    </Badge>
                  </div>
                )}
              </div>
              <p className="text-muted mb-0 small">
                {vegetables.length === 0
                  ? "Start your natural farming business"
                  : "Manage your product listings"}
              </p>
            </div>
          </Col>
          <Col xs={12} lg={4}>
            <div className="d-grid d-lg-flex justify-content-lg-end gap-2">
              <Button
                variant="outline-success"
                onClick={() => router.push("/add-prebooking-product")}
                className="px-3 py-2 fw-semibold shadow-sm"
                title="Create advance order products"
              >
                <i className="ti ti-calendar-plus me-2"></i>
                <span className="d-none d-md-inline">🌱 Pre-booking</span>
                <span className="d-md-none">🌱 Pre-book</span>
              </Button>
              <Button
                variant="success"
                onClick={() => setShowForm(true)}
                className="px-4 py-2 fw-semibold shadow-sm"
              >
                <i className="ti ti-plus me-2"></i>
                <span className="d-none d-sm-inline">
                  {vegetables.length === 0
                    ? "Add Your First Product"
                    : "Add New Product"}
                </span>
                <span className="d-sm-none">
                  {vegetables.length === 0 ? "Add First" : "Add New"}
                </span>
              </Button>
            </div>
          </Col>
        </Row>
      </div>

      {/* Search and Filter Controls - Only show when there are products */}
      {vegetables.length > 0 && (
        <div className="mb-4">
          <Row className="g-3 align-items-end">
            <Col xs={12} lg={6}>
              <Form.Group className="mb-0">
                <Form.Label className="small fw-medium text-muted mb-2">
                  Search Products
                </Form.Label>
                <SearchInput
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClear={() => setSearchTerm("")}
                  placeholder="Search by name or description..."
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} lg={3}>
              <Form.Group className="mb-0">
                <Form.Label className="small fw-medium text-muted mb-2">
                  Filter by Category
                </Form.Label>
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
            <Col xs={12} sm={6} lg={3}>
              <ClearFiltersButton
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("all");
                }}
              />
            </Col>
          </Row>
        </div>
      )}

      {vegetables.length > 0 ? (
        <div className="table-responsive">
          <Table
            hover
            className="mb-0 bg-white rounded-3 shadow-sm overflow-hidden"
          >
            <thead className="table-light">
              <tr>
                <th className="border-0 ps-3">Product</th>
                <th className="border-0">Price</th>
                <th className="border-0">Quantity</th>
                <th className="border-0">Category</th>
                <th className="border-0">Location</th>
                <th className="border-0">Created</th>
                <th className="border-0 text-center" style={{ width: "100px" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredVegetables.length > 0 ? (
                filteredVegetables.map((vegetable) => (
                  <tr key={vegetable.id} className="align-middle">
                    <td className="ps-3">
                      <div className="d-flex align-items-center">
                        {vegetable.images?.[0] ? (
                          <img
                            src={(() => {
                              // Find the smallest thumbnail variant from any image
                              const thumbnailImage = vegetable.images.find(
                                (img) =>
                                  typeof img === "string" &&
                                  img.includes("_thumbnail.webp")
                              );

                              return thumbnailImage || vegetable.images[0];
                            })()}
                            alt={vegetable.name}
                            className="rounded me-3 flex-shrink-0"
                            style={{
                              width: 40,
                              height: 40,
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            className="bg-light rounded me-3 d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: 40, height: 40 }}
                          >
                            <i className="ti ti-package text-muted"></i>
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="fw-bold text-truncate">
                            {vegetable.name}
                          </div>
                          {vegetable.description && (
                            <small className="text-muted d-block text-truncate">
                              {vegetable.description.length > 40
                                ? `${vegetable.description.substring(0, 40)}...`
                                : vegetable.description}
                            </small>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-nowrap">
                        <span className="fw-bold text-success">
                          ₹{vegetable.price}
                        </span>
                        <small className="text-muted d-block">
                          per {vegetable.unit || "kg"}
                        </small>
                      </div>
                    </td>
                    <td>
                      <span className="fw-bold">{vegetable.quantity}</span>
                      <small className="text-muted d-block">
                        {vegetable.unit || "kg"} available
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
                        {new Date(vegetable.created_at).toLocaleDateString()}
                      </small>
                    </td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          type="button"
                          className="btn btn-link text-primary p-1 border-0"
                          onClick={() => handleEdit(vegetable)}
                          title="Edit product"
                          style={{ width: "32px", height: "32px" }}
                        >
                          <i className="ti ti-pencil"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-link text-danger p-1 border-0"
                          onClick={() => handleDelete(vegetable)}
                          title="Delete product"
                          style={{ width: "32px", height: "32px" }}
                        >
                          <i className="ti ti-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="text-muted">
                      <i
                        className="ti ti-search mb-3"
                        style={{ fontSize: "2.5rem" }}
                      ></i>
                      <h6 className="mb-2">
                        No products found matching your criteria
                      </h6>
                      <p className="small mb-0">
                        Try adjusting your search terms or filters
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      ) : (
        <Card className="shadow-sm">
          <Card.Body className="text-center py-5 px-3">
            <div className="mb-4">
              <div
                className="bg-light rounded-circle mx-auto d-flex align-items-center justify-content-center mb-4"
                style={{ width: "80px", height: "80px" }}
              >
                <i
                  className="ti ti-package text-success"
                  style={{ fontSize: "2.5rem" }}
                ></i>
              </div>
            </div>
            <h5 className="text-dark mb-3">No products added yet</h5>
            <p
              className="text-muted mb-4 mx-auto"
              style={{ maxWidth: "400px" }}
            >
              Start selling your fresh, natural products by adding your first
              item to the marketplace. It only takes a few minutes!
            </p>
            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center mb-4">
              <Button
                variant="success"
                size="lg"
                onClick={() => setShowForm(true)}
                className="px-4 py-2"
              >
                <i className="ti ti-plus me-2"></i>
                Add Your First Product
              </Button>
              <Button variant="outline-primary" size="lg" className="px-4 py-2">
                <i className="ti ti-help me-2"></i>
                How it works
              </Button>
            </div>
            <div className="mt-4 pt-3 border-top">
              <small className="text-muted px-3">
                💡 <strong>Tips:</strong> Add high-quality photos, detailed
                descriptions, and competitive pricing to attract more buyers
              </small>
            </div>
          </Card.Body>
        </Card>
      )}

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
