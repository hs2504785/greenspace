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
  Dropdown,
  ButtonGroup,
  InputGroup,
  OverlayTrigger,
  Popover,
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
    category: "",
    season: "",
    years_to_fruit: "",
    mature_height: "",
    description: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedTree, setSelectedTree] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");

  // Tree category options - Enhanced with new categories
  const categoryOptions = [
    { value: "citrus", label: "Citrus", variant: "warning" },
    { value: "stone", label: "Stone Fruit", variant: "info" },
    { value: "tropical", label: "Tropical", variant: "success" },
    { value: "berry", label: "Berry", variant: "primary" },
    { value: "nut", label: "Nut", variant: "dark" },
    { value: "exotic", label: "Exotic", variant: "secondary" },
    { value: "spices", label: "Spices", variant: "danger" },
    { value: "herbs", label: "Herbs", variant: "success" },
    { value: "medicinal", label: "Medicinal", variant: "info" },
    { value: "roots", label: "Roots & Rhizomes", variant: "warning" },
  ];

  // Category structure with selectable items (same as EditTreeModal)
  const categoryStructure = {
    Citrus: {
      icon: "🍊",
      variant: "warning",
      items: [
        { value: "lemon", label: "Lemon" },
        { value: "orange", label: "Orange" },
        { value: "lime", label: "Lime" },
        { value: "grapefruit", label: "Grapefruit" },
        { value: "pampara-pansa", label: "Pampara Pansa" },
      ],
    },
    "Stone Fruit": {
      icon: "🍑",
      variant: "info",
      items: [
        { value: "mango", label: "Mango" },
        { value: "plum", label: "Plum" },
        { value: "peach", label: "Peach" },
        { value: "cherry", label: "Cherry" },
      ],
    },
    Tropical: {
      icon: "🥭",
      variant: "success",
      items: [
        { value: "papaya", label: "Papaya" },
        { value: "banana", label: "Banana" },
        { value: "jackfruit", label: "Jackfruit" },
        { value: "coconut", label: "Coconut" },
      ],
    },
    Berry: {
      icon: "🫐",
      variant: "primary",
      items: [
        { value: "strawberry", label: "Strawberry" },
        { value: "mulberry", label: "Mulberry" },
        { value: "blueberry", label: "Blueberry" },
        { value: "blackberry", label: "Blackberry" },
      ],
    },
    Nut: {
      icon: "🥥",
      variant: "secondary",
      items: [
        { value: "cashew", label: "Cashew" },
        { value: "almond", label: "Almond" },
        { value: "walnut", label: "Walnut" },
        { value: "pistachio", label: "Pistachio" },
      ],
    },
    Exotic: {
      icon: "🐲",
      variant: "danger",
      items: [
        { value: "dragon-fruit", label: "Dragon Fruit" },
        { value: "kiwi", label: "Kiwi" },
        { value: "rambutan", label: "Rambutan" },
        { value: "lychee", label: "Lychee" },
        { value: "miracle-fruit", label: "Miracle Fruit" },
      ],
    },
    Spices: {
      icon: "🌶️",
      variant: "warning",
      items: [
        { value: "allspice", label: "Allspice" },
        { value: "clove", label: "Clove" },
        { value: "cinnamon", label: "Cinnamon" },
        { value: "pepper", label: "Pepper" },
        { value: "cardamom", label: "Cardamom" },
        { value: "nutmeg", label: "Nutmeg" },
      ],
    },
    Herbs: {
      icon: "🌿",
      variant: "success",
      items: [
        { value: "tulsi", label: "Tulsi (Holy Basil)" },
        { value: "mint", label: "Mint" },
        { value: "curry-leaf", label: "Curry Leaf" },
        { value: "lemongrass", label: "Lemongrass" },
      ],
    },
    Medicinal: {
      icon: "💊",
      variant: "info",
      items: [
        { value: "aloe-vera", label: "Aloe Vera" },
        { value: "neem", label: "Neem" },
        { value: "ashwagandha", label: "Ashwagandha" },
        { value: "giloy", label: "Giloy" },
      ],
    },
    "Roots & Rhizomes": {
      icon: "🫚",
      variant: "secondary",
      items: [
        { value: "turmeric", label: "Turmeric" },
        { value: "ginger", label: "Ginger" },
        { value: "galangal", label: "Galangal" },
      ],
    },
  };

  // Get category display info
  const getCategoryInfo = (categoryValue) => {
    if (!categoryValue) {
      return {
        label: "Select Category",
        icon: "🌳",
        description: "Choose a category for this tree",
      };
    }

    // Find the category by converting categoryValue back to category name
    for (const [categoryName, categoryData] of Object.entries(
      categoryStructure
    )) {
      const categoryKey = categoryName.toLowerCase().replace(/\s+/g, "-");
      if (categoryKey === categoryValue) {
        return {
          label: categoryName,
          icon: categoryData.icon,
          variant: categoryData.variant,
          categoryName: categoryName,
          examples: categoryData.items.map((item) => item.label).join(", "),
        };
      }
    }

    return {
      label: "Unknown Category",
      icon: "🌳",
      description: "Category not found",
    };
  };

  // Season options
  const seasonOptions = [
    { value: "summer", label: "Summer", variant: "warning" },
    { value: "winter", label: "Winter", variant: "info" },
    { value: "monsoon", label: "Monsoon", variant: "success" },
    { value: "year-round", label: "Year-round", variant: "primary" },
  ];

  // Mature height options
  const heightOptions = [
    { value: "small", label: "Small (5-10 ft)", variant: "success" },
    { value: "medium", label: "Medium (10-20 ft)", variant: "warning" },
    { value: "large", label: "Large (20+ ft)", variant: "danger" },
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
      variety: tree.variety || "",
      category: tree.category || "",
      season: tree.season || "",
      years_to_fruit: tree.years_to_fruit || "",
      mature_height: tree.mature_height || "",
      description: tree.description || "",
    });
    setSelectedCategory(tree.category || "");
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
      variety: "",
      category: "",
      season: "",
      years_to_fruit: "",
      mature_height: "",
      description: "",
    });
    setSelectedCategory("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle category selection
  const handleCategorySelect = (categoryValue) => {
    setSelectedCategory(categoryValue);
    setFormData((prev) => ({
      ...prev,
      category: categoryValue,
    }));
  };

  // Filter trees based on search and category (updated after migration)
  const filteredTrees = trees.filter((tree) => {
    const matchesSearch =
      searchTerm === "" ||
      tree.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tree.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tree.category &&
        tree.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      filterCategory === "" || tree.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const getCategoryBadge = (category) => {
    const categoryOption = categoryOptions.find(
      (opt) => opt.value === category
    ) || {
      value: "unknown",
      label: "Unknown",
      variant: "secondary",
    };
    return <Badge bg={categoryOption.variant}>{categoryOption.label}</Badge>;
  };

  const getSeasonBadge = (season) => {
    const seasonOption = seasonOptions.find((opt) => opt.value === season) || {
      value: "unknown",
      label: "Unknown",
      variant: "secondary",
    };
    return <Badge bg={seasonOption.variant}>{seasonOption.label}</Badge>;
  };

  const getHeightBadge = (height) => {
    const heightOption = heightOptions.find((opt) => opt.value === height) || {
      value: "unknown",
      label: "Unknown",
      variant: "secondary",
    };
    return <Badge bg={heightOption.variant}>{heightOption.label}</Badge>;
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
                          placeholder="Search by name, code, variety, or category..."
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} lg={3}>
                      <Form.Group className="mb-0">
                        <Form.Label className="small fw-medium text-muted mb-2">
                          Filter by Category
                        </Form.Label>
                        <Form.Select
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                        >
                          <option value="">All Categories</option>
                          {categoryOptions.map((option) => (
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
                          setFilterCategory("");
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
                          <th className="border-0">Category</th>
                          <th className="border-0">Season</th>
                          <th className="border-0">Years to Fruit</th>
                          <th className="border-0">Mature Height</th>
                          <th className="border-0">Description</th>
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
                              <td>
                                {tree.category
                                  ? getCategoryBadge(tree.category)
                                  : "-"}
                              </td>
                              <td>
                                {tree.season
                                  ? getSeasonBadge(tree.season)
                                  : "-"}
                              </td>
                              <td className="text-muted">
                                {tree.years_to_fruit
                                  ? `${tree.years_to_fruit} years`
                                  : "-"}
                              </td>
                              <td>
                                {tree.mature_height
                                  ? getHeightBadge(tree.mature_height)
                                  : "-"}
                              </td>
                              <td className="text-muted small">
                                {tree.description
                                  ? tree.description.length > 50
                                    ? tree.description.substring(0, 50) + "..."
                                    : tree.description
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
                    <Form.Label className="d-flex align-items-center">
                      <strong>Category</strong>
                      <OverlayTrigger
                        placement="top"
                        overlay={
                          <Popover
                            id="category-help-popover"
                            style={{ maxWidth: "400px" }}
                          >
                            <Popover.Header className="bg-primary text-white">
                              <strong>🌳 Tree Categories</strong>
                            </Popover.Header>
                            <Popover.Body>
                              <div className="small">
                                <p className="mb-2">
                                  <strong>Choose the main category:</strong>
                                </p>
                                <ul className="mb-0 ps-3">
                                  <li>
                                    🍊 <strong>Citrus</strong> - Lemon, Orange,
                                    Lime
                                  </li>
                                  <li>
                                    🍑 <strong>Stone Fruit</strong> - Mango,
                                    Plum, Peach
                                  </li>
                                  <li>
                                    🥭 <strong>Tropical</strong> - Papaya,
                                    Banana, Jackfruit
                                  </li>
                                  <li>
                                    🫐 <strong>Berry</strong> - Strawberry,
                                    Mulberry
                                  </li>
                                  <li>
                                    🥥 <strong>Nut</strong> - Cashew, Almond,
                                    Walnut
                                  </li>
                                  <li>
                                    🐲 <strong>Exotic</strong> - Dragon Fruit,
                                    Kiwi
                                  </li>
                                  <li>
                                    🌶️ <strong>Spices</strong> - Clove,
                                    Cinnamon, Pepper
                                  </li>
                                  <li>
                                    🌿 <strong>Herbs</strong> - Tulsi, Mint,
                                    Curry Leaf
                                  </li>
                                  <li>
                                    💊 <strong>Medicinal</strong> - Aloe Vera,
                                    Neem
                                  </li>
                                  <li>
                                    🫚 <strong>Roots & Rhizomes</strong> -
                                    Turmeric, Ginger
                                  </li>
                                </ul>
                              </div>
                            </Popover.Body>
                          </Popover>
                        }
                      >
                        <span
                          className="ms-1 d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-25"
                          style={{
                            cursor: "help",
                            width: "16px",
                            height: "16px",
                            fontSize: "10px",
                          }}
                        >
                          <i className="ti-help text-primary"></i>
                        </span>
                      </OverlayTrigger>
                    </Form.Label>

                    <div className="position-relative">
                      <InputGroup className="custom-category-selector">
                        <Form.Control
                          type="text"
                          value={
                            selectedCategory
                              ? `${getCategoryInfo(selectedCategory).icon} ${
                                  getCategoryInfo(selectedCategory).label
                                }`
                              : "Select a category..."
                          }
                          readOnly
                          className={`fw-medium ${
                            selectedCategory ? "text-dark" : "text-muted"
                          }`}
                          style={{
                            backgroundColor: "#fff",
                            cursor: "pointer",
                            border: selectedCategory
                              ? "1px solid #198754"
                              : "1px solid #dee2e6",
                            fontSize: "0.95rem",
                          }}
                          onClick={() => {
                            /* Handled by dropdown toggle */
                          }}
                        />
                        <Dropdown as={ButtonGroup}>
                          <Dropdown.Toggle
                            variant={
                              selectedCategory
                                ? "outline-success"
                                : "outline-secondary"
                            }
                            id="category-dropdown"
                            title="Select category"
                            className="px-3"
                            style={{
                              borderLeftColor: selectedCategory
                                ? "#198754"
                                : "#dee2e6",
                            }}
                          >
                            <i className="ti-chevron-down"></i>
                          </Dropdown.Toggle>
                          <Dropdown.Menu
                            style={{
                              maxHeight: "400px",
                              overflowY: "auto",
                              minWidth: "320px",
                            }}
                          >
                            {Object.entries(categoryStructure).map(
                              ([categoryName, categoryData], categoryIndex) => (
                                <div key={categoryName}>
                                  {/* Category Header (Selectable) */}
                                  <Dropdown.Item
                                    onClick={() =>
                                      handleCategorySelect(
                                        categoryName
                                          .toLowerCase()
                                          .replace(/\s+/g, "-")
                                      )
                                    }
                                    className={`d-flex align-items-center py-2 px-3 fw-bold ${
                                      selectedCategory ===
                                      categoryName
                                        .toLowerCase()
                                        .replace(/\s+/g, "-")
                                        ? "active bg-success bg-opacity-10"
                                        : ""
                                    }`}
                                    style={{
                                      cursor: "pointer",
                                      backgroundColor:
                                        selectedCategory ===
                                        categoryName
                                          .toLowerCase()
                                          .replace(/\s+/g, "-")
                                          ? "rgba(25, 135, 84, 0.25)"
                                          : "rgba(248, 249, 250, 0.8)",
                                      borderRadius: "0.25rem",
                                      margin: "4px",
                                      ...(selectedCategory ===
                                      categoryName
                                        .toLowerCase()
                                        .replace(/\s+/g, "-")
                                        ? {
                                            color: "#000",
                                            borderLeft: "3px solid #198754",
                                          }
                                        : {}),
                                    }}
                                  >
                                    <div className="d-flex align-items-center justify-content-between w-100">
                                      <div className="d-flex align-items-center">
                                        <span
                                          className="me-2"
                                          style={{ fontSize: "1.2em" }}
                                        >
                                          {categoryData.icon}
                                        </span>
                                        <strong
                                          className={`text-${categoryData.variant}`}
                                          style={
                                            selectedCategory ===
                                            categoryName
                                              .toLowerCase()
                                              .replace(/\s+/g, "-")
                                              ? { color: "#000" }
                                              : {}
                                          }
                                        >
                                          {categoryName}
                                        </strong>
                                      </div>
                                      {selectedCategory ===
                                        categoryName
                                          .toLowerCase()
                                          .replace(/\s+/g, "-") && (
                                        <Badge bg="success" className="ms-2">
                                          Selected
                                        </Badge>
                                      )}
                                    </div>
                                  </Dropdown.Item>

                                  {/* Category Items (Read-only examples) */}
                                  <div
                                    className="px-3 pb-2"
                                    style={{
                                      pointerEvents: "none",
                                      userSelect: "none",
                                    }}
                                  >
                                    <small
                                      className="text-muted"
                                      style={{
                                        fontSize: "0.75rem",
                                        fontStyle: "italic",
                                      }}
                                    >
                                      Examples:{" "}
                                      {categoryData.items
                                        .map((item) => item.label)
                                        .join(", ")}
                                    </small>
                                  </div>

                                  {/* Add divider between categories (except last one) */}
                                  {categoryIndex <
                                    Object.keys(categoryStructure).length -
                                      1 && <Dropdown.Divider />}
                                </div>
                              )
                            )}
                            <Dropdown.Divider />
                            <Dropdown.Item
                              onClick={() => handleCategorySelect("")}
                              className="text-muted px-3 py-2 text-center"
                              style={{
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                              }}
                            >
                              <i className="ti-x me-2"></i>Clear selection
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </InputGroup>
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Season</Form.Label>
                    <Form.Select
                      name="season"
                      value={formData.season}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Season</option>
                      {seasonOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Years to Fruit</Form.Label>
                    <Form.Control
                      type="number"
                      name="years_to_fruit"
                      value={formData.years_to_fruit}
                      onChange={handleInputChange}
                      placeholder="e.g., 3-5"
                      min="1"
                      max="20"
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Mature Height</Form.Label>
                    <Form.Select
                      name="mature_height"
                      value={formData.mature_height}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Height</option>
                      {heightOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Form.Select>
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
