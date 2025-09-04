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
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { useSession } from "next-auth/react";
import toastService from "@/utils/toastService";
import vegetableService from "@/services/VegetableService";
import SearchInput from "@/components/common/SearchInput";
import ClearFiltersButton from "@/components/common/ClearFiltersButton";
import VegetableForm from "./VegetableForm";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import { useRouter } from "next/navigation";
import {
  isMapLink,
  getLocationDisplayText,
  openMapLink,
} from "@/utils/locationUtils";

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
    <Container fluid className="px-3 px-md-4 pt-2 pb-4">
      {/* Clean Header Section */}
      <div className="mb-4 pb-3 border-bottom">
        {/* Desktop Layout */}
        <div className="d-none d-lg-flex justify-content-between align-items-start">
          <div>
            <div className="d-flex align-items-center gap-3 mb-2">
              <h1 className="h2 mb-0 text-dark fw-bold">
                <i className="ti ti-package me-2 text-success"></i>
                My Products
              </h1>
              {vegetables.length > 0 && (
                <div className="d-flex align-items-center gap-2">
                  <Badge
                    bg="primary"
                    className="px-3 py-2 rounded-pill fw-medium"
                  >
                    {vegetables.length} Total
                  </Badge>
                  {filteredVegetables.length !== vegetables.length && (
                    <Badge
                      bg="success"
                      className="px-3 py-2 rounded-pill fw-medium"
                    >
                      {filteredVegetables.length} Shown
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <p className="text-muted mb-0">
              {vegetables.length === 0
                ? "Start your natural farming business by adding your first product"
                : "Manage and track your product listings"}
            </p>
          </div>

          {/* Desktop Action Buttons */}
          <div className="d-flex gap-2 flex-shrink-0">
            <Button
              variant="outline-success"
              onClick={() => router.push("/add-prebooking-product")}
              className="px-3 py-2 fw-medium border-2"
              title="Create advance order products"
            >
              <i className="ti ti-calendar-plus me-2"></i>
              Pre-booking
            </Button>
            <Button
              variant="success"
              onClick={() => setShowForm(true)}
              className="px-4 py-2 fw-medium shadow-sm"
            >
              <i className="ti ti-plus me-2"></i>
              {vegetables.length === 0 ? "Add First Product" : "Add Product"}
            </Button>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="d-lg-none">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h1 className="h3 mb-0 text-dark fw-bold">
              <i className="ti ti-package me-2 text-success"></i>
              My Products
            </h1>
            {vegetables.length > 0 && (
              <Badge
                bg="primary"
                className="px-2 py-1 rounded-pill fw-medium small"
              >
                {vegetables.length}
              </Badge>
            )}
          </div>

          <p className="text-muted mb-3 small">
            {vegetables.length === 0
              ? "Start your natural farming business"
              : "Manage your product listings"}
          </p>

          {/* Mobile Action Buttons */}
          <div className="d-flex gap-2">
            <Button
              variant="outline-success"
              onClick={() => router.push("/add-prebooking-product")}
              className="px-3 py-2 fw-medium border-2 flex-fill"
              title="Create advance order products"
            >
              <i className="ti ti-calendar-plus me-1"></i>
              Pre-book
            </Button>
            <Button
              variant="success"
              onClick={() => setShowForm(true)}
              className="px-3 py-2 fw-medium shadow-sm flex-fill"
            >
              <i className="ti ti-plus me-1"></i>
              {vegetables.length === 0 ? "Add First" : "Add New"}
            </Button>
          </div>
        </div>
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
                    <td style={{ maxWidth: "200px" }}>
                      {vegetable.location ? (
                        <div
                          className="d-flex align-items-center"
                          style={{ minWidth: 0 }}
                        >
                          <i className="ti ti-map-pin me-1 text-muted flex-shrink-0"></i>
                          <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            {isMapLink(vegetable.location) ? (
                              <OverlayTrigger
                                placement="top"
                                overlay={
                                  <Tooltip
                                    id={`location-tooltip-${vegetable.id}`}
                                  >
                                    Click to open location in map:{" "}
                                    {vegetable.location}
                                  </Tooltip>
                                }
                              >
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 text-decoration-none text-success fw-medium text-start"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openMapLink(vegetable.location);
                                  }}
                                  style={{
                                    fontSize: "0.875rem",
                                    lineHeight: "1.2",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    maxWidth: "100%",
                                  }}
                                >
                                  {getLocationDisplayText(
                                    vegetable.location,
                                    true
                                  )}
                                  <i className="ti ti-external-link ms-1 small"></i>
                                </Button>
                              </OverlayTrigger>
                            ) : (
                              <OverlayTrigger
                                placement="top"
                                overlay={
                                  <Tooltip
                                    id={`location-text-tooltip-${vegetable.id}`}
                                  >
                                    {vegetable.location}
                                  </Tooltip>
                                }
                              >
                                <span
                                  className="text-muted"
                                  style={{
                                    fontSize: "0.875rem",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    display: "block",
                                    cursor: "help",
                                  }}
                                >
                                  {vegetable.location}
                                </span>
                              </OverlayTrigger>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center">
                          <i className="ti ti-map-pin me-1 text-muted"></i>
                          <span className="text-muted">Not specified</span>
                        </div>
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
        <Card className="shadow-sm border-0">
          <Card.Body className="text-center py-5 px-4">
            <div className="mb-4">
              <div
                className="bg-success bg-opacity-10 rounded-circle mx-auto d-flex align-items-center justify-content-center mb-4"
                style={{ width: "100px", height: "100px" }}
              >
                <i
                  className="ti ti-package text-success"
                  style={{ fontSize: "3rem" }}
                ></i>
              </div>
            </div>
            <h4 className="text-dark mb-3 fw-bold">No products added yet</h4>
            <p
              className="text-muted mb-4 mx-auto lead"
              style={{ maxWidth: "500px" }}
            >
              Start selling your fresh, natural products by adding your first
              item to the marketplace. It only takes a few minutes to get
              started!
            </p>
            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center mb-4">
              <Button
                variant="success"
                size="lg"
                onClick={() => setShowForm(true)}
                className="px-5 py-3 fw-medium shadow-sm"
              >
                <i className="ti ti-plus me-2"></i>
                Add Your First Product
              </Button>
              <Button
                variant="outline-primary"
                size="lg"
                className="px-4 py-3 fw-medium border-2"
              >
                <i className="ti ti-help me-2"></i>
                How it works
              </Button>
            </div>
            <div className="mt-5 pt-4 border-top">
              <div className="row g-4 text-start">
                <div className="col-md-4">
                  <div className="d-flex align-items-start">
                    <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3 flex-shrink-0">
                      <i className="ti ti-camera text-primary"></i>
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold">Quality Photos</h6>
                      <small className="text-muted">
                        Add clear, high-quality images
                      </small>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex align-items-start">
                    <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-3 flex-shrink-0">
                      <i className="ti ti-file-text text-warning"></i>
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold">Detailed Info</h6>
                      <small className="text-muted">
                        Write compelling descriptions
                      </small>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex align-items-start">
                    <div className="bg-success bg-opacity-10 rounded-circle p-2 me-3 flex-shrink-0">
                      <i className="ti ti-currency-rupee text-success"></i>
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold">Fair Pricing</h6>
                      <small className="text-muted">
                        Set competitive market prices
                      </small>
                    </div>
                  </div>
                </div>
              </div>
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
