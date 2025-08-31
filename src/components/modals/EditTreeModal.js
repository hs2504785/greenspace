"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Button,
  Badge,
  Row,
  Col,
  Alert,
  OverlayTrigger,
  Tooltip,
  Popover,
  Dropdown,
  ButtonGroup,
  InputGroup,
} from "react-bootstrap";
import { toast } from "react-hot-toast";

const EditTreeModal = ({
  show,
  onHide,
  selectedTree,
  selectedPosition,
  onTreeUpdated,
  layoutId,
}) => {
  const [editData, setEditData] = useState({
    variety: "",
    status: "healthy",
    planting_date: "",
    notes: "",
    category: "", // Add category to edit data
  });
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  const statusOptions = [
    { value: "healthy", label: "Healthy", variant: "success" },
    { value: "diseased", label: "Diseased", variant: "danger" },
    { value: "fruiting", label: "Fruiting", variant: "warning" },
    { value: "dormant", label: "Dormant", variant: "secondary" },
    { value: "dead", label: "Dead", variant: "dark" },
  ];

  // Category structure with selectable items
  const categoryStructure = {
    Citrus: {
      icon: "🍊",
      variant: "warning",
      items: [
        { value: "lemon", label: "Lemon" },
        { value: "orange", label: "Orange" },
        { value: "lime", label: "Lime" },
        { value: "grapefruit", label: "Grapefruit" },
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
        { value: "guava", label: "Guava" },
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
      variant: "dark",
      items: [
        { value: "cashew", label: "Cashew" },
        { value: "almond", label: "Almond" },
        { value: "walnut", label: "Walnut" },
        { value: "coconut", label: "Coconut" },
      ],
    },
    Exotic: {
      icon: "🐉",
      variant: "secondary",
      items: [
        { value: "dragon-fruit", label: "Dragon Fruit" },
        { value: "kiwi", label: "Kiwi" },
        { value: "rambutan", label: "Rambutan" },
        { value: "passion-fruit", label: "Passion Fruit" },
      ],
    },
    Spices: {
      icon: "🌶️",
      variant: "danger",
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
      icon: "🌱",
      variant: "warning",
      items: [
        { value: "turmeric", label: "Turmeric" },
        { value: "ginger", label: "Ginger" },
        { value: "galangal", label: "Galangal" },
      ],
    },
  };

  useEffect(() => {
    if (selectedTree && show) {
      // Initialize edit data with current tree position data
      setEditData({
        variety: selectedTree.variety || "",
        status: selectedTree.status || "healthy",
        planting_date: selectedTree.planting_date || "",
        notes: selectedTree.notes || "",
        category: selectedTree.category || "",
      });
      setSelectedCategory(selectedTree.category || "");
    }
  }, [selectedTree, show]);

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!selectedTree?.id || !layoutId) return;

    console.log("EditTreeModal - selectedTree:", selectedTree);
    console.log("EditTreeModal - selectedTree.id:", selectedTree.id);
    console.log("EditTreeModal - layoutId:", layoutId);

    setLoading(true);
    try {
      const response = await fetch(`/api/tree-positions/${selectedTree.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          variety: editData.variety,
          status: editData.status,
          planting_date: editData.planting_date,
          notes: editData.notes,
          category: editData.category,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update tree");
      }

      toast.success("Tree updated successfully!");
      if (onTreeUpdated) {
        // Close edit modal and trigger update
        onHide();
        // Small delay to ensure database update is committed
        setTimeout(() => {
          onTreeUpdated();
        }, 100);
      } else {
        onHide();
      }
    } catch (error) {
      console.error("Error updating tree:", error);

      // Check if it's a database schema error
      if (
        error.message &&
        (error.message.includes("Database schema needs to be updated") ||
          error.message.includes("Database migration required"))
      ) {
        toast.error(
          "Database migration required! Please run the SQL from MIGRATION_INSTRUCTIONS.md to add required columns to tree_positions table.",
          { duration: 10000 }
        );
      } else {
        toast.error(error.message || "Failed to update tree");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset edit data to original values
    setEditData({
      variety: selectedTree.variety || "",
      status: selectedTree.status || "healthy",
      planting_date: selectedTree.planting_date || "",
      notes: selectedTree.notes || "",
      category: selectedTree.category || "",
    });
    setSelectedCategory(selectedTree.category || "");
    onHide();
  };

  // Helper function to handle category selection
  const handleCategorySelect = (categoryValue) => {
    setSelectedCategory(categoryValue);
    setEditData({
      ...editData,
      category: categoryValue,
    });
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

    // Find the item across all categories
    for (const [categoryName, categoryData] of Object.entries(
      categoryStructure
    )) {
      const foundItem = categoryData.items.find(
        (item) => item.value === categoryValue
      );
      if (foundItem) {
        return {
          label: foundItem.label,
          icon: categoryData.icon,
          variant: categoryData.variant,
          categoryName: categoryName,
        };
      }
    }

    return {
      label: "Unknown Category",
      icon: "🌳",
      description: "Category not found",
    };
  };

  if (!selectedTree) return null;

  return (
    <>
      <style jsx global>{`
        /* Override Bootstrap's global dropdown active color */
        .custom-category-selector {
          --bs-dropdown-link-active-color: #000;
          --bs-dropdown-link-active-bg: rgba(25, 135, 84, 0.25);
        }
        /* Direct override of Bootstrap's dropdown active styles */
        .custom-category-selector .dropdown-item.active,
        .custom-category-selector .dropdown-item:active {
          color: #000 !important;
          background-color: rgba(25, 135, 84, 0.25) !important;
        }
        .custom-category-selector .dropdown-item:hover {
          background-color: #f8f9fa !important;
          transform: translateX(2px);
          transition: all 0.2s ease;
        }
        .custom-category-selector .dropdown-item.active {
          border-left: 3px solid #198754 !important;
          background-color: rgba(25, 135, 84, 0.25) !important;
          color: #000 !important;
          --bs-dropdown-link-active-color: #000 !important;
          --bs-dropdown-link-active-bg: rgba(25, 135, 84, 0.25) !important;
        }
        .custom-category-selector .dropdown-item:active,
        .custom-category-selector .dropdown-item.active:active,
        .custom-category-selector .dropdown-item.active:focus {
          color: #000 !important;
          background-color: rgba(25, 135, 84, 0.25) !important;
        }
        .custom-category-selector .dropdown-item.active,
        .custom-category-selector .dropdown-item.active *:not(.badge) {
          color: #000 !important;
          font-weight: 600 !important;
        }
        .custom-category-selector .dropdown-item.active span:not(.badge) {
          color: #000 !important;
          font-weight: 600 !important;
        }
        .custom-category-selector .dropdown-item.active .d-flex span {
          color: #000 !important;
        }
        .custom-category-selector .dropdown-item.active .d-flex .d-flex span {
          color: #000 !important;
          text-shadow: none !important;
        }
        .custom-category-selector
          .dropdown-item.active
          .justify-content-between
          .d-flex
          span {
          color: #000 !important;
        }
        .custom-category-selector .dropdown-item.active .badge {
          background-color: #198754 !important;
          color: #fff !important;
          font-weight: 600 !important;
        }
        /* Force override Bootstrap's active link color */
        .dropdown-item.active .d-flex .d-flex span,
        .custom-category-selector .dropdown-item.active .d-flex .d-flex span,
        .custom-category-selector [role="button"].dropdown-item.active span {
          color: #000 !important;
        }
        .custom-category-selector .dropdown-menu {
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 0.5rem;
        }
        .custom-category-selector .dropdown-header {
          font-size: 0.9rem;
          font-weight: 600;
          padding: 0.5rem 1rem;
          margin-bottom: 0.25rem;
          background-color: rgba(248, 249, 250, 0.8);
          border-radius: 0.25rem;
          margin-left: 4px;
          margin-right: 4px;
        }
        .custom-category-selector .dropdown-item {
          border-radius: 0.25rem;
          margin: 1px 8px;
          padding: 0.5rem 1rem;
        }
        .custom-category-selector .dropdown-divider {
          margin: 0.5rem 0;
        }
      `}</style>
      <Modal
        show={show}
        onHide={handleCancel}
        size="md"
        centered
        backdrop="static"
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title
            className="d-flex align-items-center"
            style={{ lineHeight: 1.2 }}
          >
            <i className="ti-pencil me-2"></i>
            <span>Edit Tree Details</span>
            <OverlayTrigger
              placement="bottom"
              overlay={
                <Popover>
                  <Popover.Header>What gets saved?</Popover.Header>
                  <Popover.Body>
                    <small>
                      Changes will be saved to{" "}
                      <strong>this specific tree instance</strong> at this
                      position.
                      <br />
                      <br />
                      Tree type information (name, category, season) remains
                      unchanged.
                      <br />
                      <br />
                      <em>
                        If you get a "Database schema" error, run the migration
                        from MIGRATION_INSTRUCTIONS.md
                      </em>
                    </small>
                  </Popover.Body>
                </Popover>
              }
            >
              <div
                className="ms-2 rounded-circle bg-white bg-opacity-25 text-white"
                style={{
                  width: "22px",
                  height: "22px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "help",
                  fontSize: "14px",
                  fontWeight: "bold",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                ?
              </div>
            </OverlayTrigger>
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSaveChanges}>
          <Modal.Body className="p-4">
            {/* Tree Info Header */}
            <div className="mb-4 p-3 bg-light rounded">
              <div className="d-flex align-items-center">
                <span className="tree-icon me-3" style={{ fontSize: "1.5rem" }}>
                  {selectedTree.category === "citrus"
                    ? "🍊"
                    : selectedTree.category === "tropical"
                    ? "🥭"
                    : selectedTree.category === "stone"
                    ? "🍑"
                    : selectedTree.category === "berry"
                    ? "🫐"
                    : selectedTree.category === "nut"
                    ? "🥥"
                    : "🌳"}
                </span>
                <div>
                  <h5 className="mb-0">{selectedTree.name}</h5>
                  <small className="text-muted">
                    Block {(selectedPosition?.blockIndex || 0) + 1}, Position (
                    {selectedPosition?.x}, {selectedPosition?.y}) • Code:{" "}
                    {selectedTree.code}
                  </small>
                </div>
              </div>
            </div>

            {/* Edit Form */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="d-flex align-items-center">
                    <strong>Variety</strong>
                    <OverlayTrigger
                      placement="top"
                      overlay={
                        <Tooltip>
                          Specify the cultivar or variety of this specific tree
                          instance (e.g., Alphonso, Kesar, Dasheri)
                        </Tooltip>
                      }
                    >
                      <span
                        className="ms-1 d-inline-flex align-items-center justify-content-center rounded-circle bg-secondary bg-opacity-25"
                        style={{
                          cursor: "help",
                          width: "16px",
                          height: "16px",
                          fontSize: "10px",
                        }}
                      >
                        <i className="ti-help text-secondary"></i>
                      </span>
                    </OverlayTrigger>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={editData.variety}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        variety: e.target.value,
                      })
                    }
                    placeholder="e.g., Alphonso, Kesar"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="d-flex align-items-center">
                    <strong>Status</strong>
                    <OverlayTrigger
                      placement="top"
                      overlay={
                        <Tooltip>
                          Current health and growth status of this specific tree
                        </Tooltip>
                      }
                    >
                      <span
                        className="ms-1 d-inline-flex align-items-center justify-content-center rounded-circle bg-secondary bg-opacity-25"
                        style={{
                          cursor: "help",
                          width: "16px",
                          height: "16px",
                          fontSize: "10px",
                        }}
                      >
                        <i className="ti-help text-secondary"></i>
                      </span>
                    </OverlayTrigger>
                  </Form.Label>
                  <Form.Select
                    value={editData.status}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        status: e.target.value,
                      })
                    }
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="d-flex align-items-center">
                    <strong>Planting Date</strong>
                    <OverlayTrigger
                      placement="top"
                      overlay={
                        <Tooltip>
                          When was this specific tree planted at this location?
                        </Tooltip>
                      }
                    >
                      <span
                        className="ms-1 d-inline-flex align-items-center justify-content-center rounded-circle bg-secondary bg-opacity-25"
                        style={{
                          cursor: "help",
                          width: "16px",
                          height: "16px",
                          fontSize: "10px",
                        }}
                      >
                        <i className="ti-help text-secondary"></i>
                      </span>
                    </OverlayTrigger>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={editData.planting_date}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        planting_date: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="d-flex align-items-center">
                    <strong>Category</strong>
                    <OverlayTrigger
                      placement="top"
                      overlay={
                        <Popover
                          id="category-help-popover"
                          style={{ minWidth: "320px" }}
                        >
                          <Popover.Header className="d-flex align-items-center">
                            <i className="ti-help me-2"></i>
                            Category Guide
                          </Popover.Header>
                          <Popover.Body>
                            <small>
                              <strong className="mb-2 d-block">
                                Select from these categories:
                              </strong>
                              {Object.entries(categoryStructure)
                                .slice(0, 3)
                                .map(([categoryName, categoryData]) => (
                                  <div key={categoryName} className="mb-2">
                                    <div className="d-flex align-items-center mb-1">
                                      <span className="me-2">
                                        {categoryData.icon}
                                      </span>
                                      <strong
                                        className={`text-${categoryData.variant}`}
                                      >
                                        {categoryName}
                                      </strong>
                                    </div>
                                    <div className="ms-4 text-muted">
                                      {categoryData.items
                                        .slice(0, 3)
                                        .map((item) => item.label)
                                        .join(", ")}
                                      {categoryData.items.length > 3 && "..."}
                                    </div>
                                  </div>
                                ))}
                              <div className="text-muted">
                                <em>
                                  ...and{" "}
                                  {Object.keys(categoryStructure).length - 3}{" "}
                                  more categories
                                </em>
                              </div>
                            </small>
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
                          backgroundColor: selectedCategory
                            ? "#f8f9fa"
                            : "#fff",
                          cursor: "pointer",
                          border: selectedCategory
                            ? "1px solid #0d6efd"
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
                                {/* Category Header (Read-only) */}
                                <Dropdown.Header className="d-flex align-items-center">
                                  <span
                                    className="me-2"
                                    style={{ fontSize: "1em" }}
                                  >
                                    {categoryData.icon}
                                  </span>
                                  <strong
                                    className={`text-${categoryData.variant}`}
                                  >
                                    {categoryName}
                                  </strong>
                                </Dropdown.Header>

                                {/* Category Items (Selectable) */}
                                {categoryData.items.map((item) => (
                                  <Dropdown.Item
                                    key={item.value}
                                    onClick={() =>
                                      handleCategorySelect(item.value)
                                    }
                                    className={`d-flex align-items-center py-2 px-3 ${
                                      selectedCategory === item.value
                                        ? "active bg-success bg-opacity-10"
                                        : ""
                                    }`}
                                    style={{
                                      cursor: "pointer",
                                      ...(selectedCategory === item.value
                                        ? {
                                            color: "#000",
                                            backgroundColor:
                                              "rgba(25, 135, 84, 0.25)",
                                            borderLeft: "3px solid #198754",
                                          }
                                        : {}),
                                    }}
                                  >
                                    <div className="d-flex align-items-center justify-content-between w-100">
                                      <div className="d-flex align-items-center">
                                        <strong
                                          className={`me-2 text-${categoryData.variant}`}
                                          style={{
                                            minWidth: "25px",
                                            ...(selectedCategory === item.value
                                              ? { color: "#000" }
                                              : {}),
                                          }}
                                        >
                                          {item.value
                                            .toUpperCase()
                                            .substring(0, 2)}
                                        </strong>
                                        <span
                                          style={
                                            selectedCategory === item.value
                                              ? { color: "#000" }
                                              : {}
                                          }
                                        >
                                          {item.label}
                                        </span>
                                      </div>
                                      {selectedCategory === item.value && (
                                        <Badge bg="success" className="ms-2">
                                          Selected
                                        </Badge>
                                      )}
                                    </div>
                                  </Dropdown.Item>
                                ))}

                                {/* Add divider between categories (except last one) */}
                                {categoryIndex <
                                  Object.keys(categoryStructure).length - 1 && (
                                  <Dropdown.Divider />
                                )}
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
                            <i className="ti-x me-2"></i>
                            Clear selection
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </InputGroup>
                  </div>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="d-flex align-items-center">
                <strong>Notes</strong>
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip>
                      Personal notes, care instructions, observations, or
                      reminders about this specific tree
                    </Tooltip>
                  }
                >
                  <span
                    className="ms-1 d-inline-flex align-items-center justify-content-center rounded-circle bg-secondary bg-opacity-25"
                    style={{
                      cursor: "help",
                      width: "16px",
                      height: "16px",
                      fontSize: "10px",
                    }}
                  >
                    <i className="ti-help text-secondary"></i>
                  </span>
                </OverlayTrigger>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editData.notes}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    notes: e.target.value,
                  })
                }
                placeholder="Care instructions, observations, reminders..."
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer className="bg-light">
            <Button
              variant="outline-secondary"
              onClick={handleCancel}
              disabled={loading}
            >
              <i className="ti-close me-1"></i>
              Cancel
            </Button>
            <Button variant="success" type="submit" disabled={loading}>
              <i className="ti-check me-1"></i>
              {loading ? "Saving Changes..." : "Save Changes"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default EditTreeModal;
