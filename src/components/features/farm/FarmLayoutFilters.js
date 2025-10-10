"use client";

import { useState } from "react";
import {
  Offcanvas,
  Form,
  Button,
  Row,
  Col,
  Badge,
  Card,
} from "react-bootstrap";
import ToggleSwitch from "@/components/common/ToggleSwitch";
import CreateLayoutModal from "@/components/farm/CreateLayoutModal";
import EditLayoutModal from "@/components/farm/EditLayoutModal";
import DeleteLayoutModal from "@/components/farm/DeleteLayoutModal";
import TemplateManagementModal from "@/components/farm/TemplateManagementModal";
import { toast } from "react-hot-toast";

export default function FarmLayoutFilters({
  show,
  onHide,
  filters,
  onFilterChange,
  layouts = [],
  stats = {},
  farmId,
  onLayoutCreated,
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLayout, setEditingLayout] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingLayout, setDeletingLayout] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const handleFilterChange = (key, value) => {
    onFilterChange({ [key]: value });
  };

  const clearAllFilters = () => {
    onFilterChange({
      selectedLayout: null,
      showExpandButtons: false,
      showPlantingGuides: true,
      zoom: 1,
      isFullscreen: false,
    });
  };

  const handleLayoutCreated = (newLayout) => {
    if (onLayoutCreated) {
      onLayoutCreated(newLayout);
    }
    // Auto-select the newly created layout
    handleFilterChange("selectedLayout", newLayout);
  };

  const handleEditLayout = (layout) => {
    setEditingLayout(layout);
    setShowEditModal(true);
  };

  const handleLayoutUpdated = (updatedLayout) => {
    if (onLayoutCreated) {
      onLayoutCreated(updatedLayout);
    }
    // Update the selected layout if it was the one being edited
    if (filters.selectedLayout?.id === updatedLayout.id) {
      handleFilterChange("selectedLayout", updatedLayout);
    }
  };

  const handleDuplicateLayout = async (layout) => {
    if (!farmId || !layout) return;

    try {
      // Generate new name
      const baseName = layout.name.replace(/ \(Copy \d+\)$/, "");
      const existingNames = layouts.map((l) => l.name);
      let newName = `${baseName} (Copy)`;
      let counter = 1;

      while (existingNames.includes(newName)) {
        counter++;
        newName = `${baseName} (Copy ${counter})`;
      }

      const duplicatedLayout = {
        farm_id: farmId,
        name: newName,
        description: `${layout.description} (Duplicated from ${layout.name})`,
        grid_config: layout.grid_config,
        is_active: false, // Don't auto-activate duplicates
      };

      const response = await fetch("/api/farm-layouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duplicatedLayout),
      });

      if (response.ok) {
        const newLayout = await response.json();
        toast.success(`Layout "${newName}" created successfully!`);
        if (onLayoutCreated) {
          onLayoutCreated(newLayout);
        }
        // Auto-select the duplicated layout
        handleFilterChange("selectedLayout", newLayout);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to duplicate layout");
      }
    } catch (error) {
      console.error("Error duplicating layout:", error);
      toast.error("Failed to duplicate layout");
    }
  };

  const handleSaveAsTemplate = async (layout) => {
    if (!farmId || !layout) return;

    try {
      // Generate template name
      const baseName = layout.name.replace(/ \(Template \d+\)$/, "");
      const existingNames = layouts.map((l) => l.name);
      let templateName = `${baseName} (Template)`;
      let counter = 1;

      while (existingNames.includes(templateName)) {
        counter++;
        templateName = `${baseName} (Template ${counter})`;
      }

      const templateLayout = {
        farm_id: farmId,
        name: templateName,
        description: `Template: ${layout.description || layout.name}`,
        grid_config: layout.grid_config,
        is_active: false, // Templates are not active by default
      };

      const response = await fetch("/api/farm-layouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateLayout),
      });

      if (response.ok) {
        const newTemplate = await response.json();
        toast.success(`Template "${templateName}" saved successfully!`);
        if (onLayoutCreated) {
          onLayoutCreated(newTemplate);
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to save template");
      }
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    }
  };

  const handleDeleteLayout = (layout) => {
    setDeletingLayout(layout);
    setShowDeleteModal(true);
  };

  const confirmDeleteLayout = async (layout) => {
    if (!farmId || !layout) return;

    try {
      const response = await fetch(`/api/farm-layouts?id=${layout.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success(`Layout "${layout.name}" deleted successfully!`);

        // If the deleted layout was selected, clear the selection
        if (filters.selectedLayout?.id === layout.id) {
          handleFilterChange("selectedLayout", null);
        }

        // Refresh the layouts list
        if (onLayoutCreated) {
          onLayoutCreated(null); // This will trigger a refresh
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete layout");
      }
    } catch (error) {
      console.error("Error deleting layout:", error);
      throw error; // Re-throw to be handled by the modal
    }
  };

  const activateLayout = async (layout) => {
    if (!farmId || !layout) return;

    try {
      const response = await fetch("/api/farm-layouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layout_id: layout.id,
          farm_id: farmId,
        }),
      });

      if (response.ok) {
        // Update the layout in the parent component
        if (onLayoutCreated) {
          onLayoutCreated(layout);
        }
      } else {
        console.error("Failed to activate layout");
      }
    } catch (error) {
      console.error("Error activating layout:", error);
    }
  };

  const getLayoutDimensions = (layout) => {
    if (!layout?.grid_config?.blocks?.length) return "Unknown";

    const blocks = layout.grid_config.blocks;
    const maxX = Math.max(...blocks.map((b) => b.x + b.width));
    const maxY = Math.max(...blocks.map((b) => b.y + b.height));

    return `${maxX}×${maxY}ft`;
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "selectedLayout") return value !== null;
    if (key === "showExpandButtons") return value === true;
    if (key === "showPlantingGuides") return value === false; // Default is true, so false is active filter
    if (key === "zoom") return value !== 1;
    if (key === "isFullscreen") return value === true;
    return false;
  }).length;

  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      placement="end"
      className="w-100"
      style={{ maxWidth: "400px" }}
    >
      <Offcanvas.Header closeButton className="border-bottom">
        <Offcanvas.Title className="d-flex align-items-center gap-2">
          <i className="ti-layout-grid3 text-success"></i>
          Farm Layout Options
          {activeFiltersCount > 0 && (
            <Badge bg="success" className="ms-2">
              {activeFiltersCount}
            </Badge>
          )}
        </Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body>
        <div className="d-flex flex-column gap-4">
          {/* Farm Statistics */}
          {stats && Object.keys(stats).length > 0 && (
            <Card className="border-success border-opacity-25 bg-light">
              <Card.Body className="py-3">
                <h6 className="card-title text-success mb-3">
                  <i className="ti-bar-chart me-2"></i>
                  Farm Statistics
                </h6>
                <div className="row g-2 text-center">
                  <div className="col-6">
                    <div className="bg-white rounded p-2">
                      <div className="h5 text-primary mb-0">
                        {stats.totalTrees || 0}
                      </div>
                      <small className="text-muted">Total Trees</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="bg-white rounded p-2">
                      <div className="h5 text-success mb-0">
                        {stats.healthyTrees || 0}
                      </div>
                      <small className="text-muted">Healthy</small>
                    </div>
                  </div>
                  {stats.fruitingTrees > 0 && (
                    <div className="col-6">
                      <div className="bg-white rounded p-2">
                        <div className="h5 text-warning mb-0">
                          {stats.fruitingTrees}
                        </div>
                        <small className="text-muted">Fruiting</small>
                      </div>
                    </div>
                  )}
                  {stats.diseasedTrees > 0 && (
                    <div className="col-6">
                      <div className="bg-white rounded p-2">
                        <div className="h5 text-danger mb-0">
                          {stats.diseasedTrees}
                        </div>
                        <small className="text-muted">Issues</small>
                      </div>
                    </div>
                  )}
                </div>
                {stats.totalTrees > 0 && (
                  <div className="mt-2 text-center">
                    <small className="text-success">
                      Health Score:{" "}
                      {Math.round(
                        (stats.healthyTrees / stats.totalTrees) * 100
                      )}
                      %
                    </small>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Layout Management */}
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Form.Label className="fw-medium mb-0">
                <i className="ti-layers-alt me-2"></i>
                Farm Layouts
              </Form.Label>
              <div className="d-flex gap-2">
                <Button
                  variant="outline-info"
                  size="sm"
                  onClick={() => setShowTemplateModal(true)}
                  disabled={!farmId}
                  title="Template Management"
                >
                  <i className="ti-bookmark me-1"></i>
                  Templates
                </Button>
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={() => setShowCreateModal(true)}
                  disabled={!farmId}
                >
                  <i className="ti-plus me-1"></i>
                  New Layout
                </Button>
              </div>
            </div>

            {/* Layout Cards */}
            {layouts && layouts.length > 0 ? (
              <div className="d-flex flex-column gap-2 mb-3">
                {layouts.map((layout) => (
                  <Card
                    key={layout.id}
                    className={`border-success-subtle cursor-pointer ${
                      filters.selectedLayout?.id === layout.id
                        ? "border-success bg-success-subtle"
                        : ""
                    }`}
                    onClick={() => {
                      handleFilterChange("selectedLayout", layout);
                      activateLayout(layout);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Card Header */}
                    <Card.Header className="py-2 px-3 bg-light border-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 d-flex align-items-center gap-2">
                          {layout.name}
                          {layout.is_active && (
                            <Badge bg="success" className="small">
                              Active
                            </Badge>
                          )}
                          {filters.selectedLayout?.id === layout.id && (
                            <i className="ti-check-circle text-success"></i>
                          )}
                        </h6>
                        <div className="d-flex gap-1">
                          <Badge bg="info" className="small">
                            {layout.grid_config?.blocks?.length || 0} blocks
                          </Badge>
                          <Badge bg="secondary" className="small">
                            {getLayoutDimensions(layout)}
                          </Badge>
                        </div>
                      </div>
                    </Card.Header>

                    {/* Card Body */}
                    <Card.Body className="py-2 px-3">
                      <small className="text-muted">
                        {layout.description || "No description provided"}
                      </small>
                    </Card.Body>

                    {/* Card Footer with Actions */}
                    <Card.Footer className="py-2 px-3 bg-light border-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          Created:{" "}
                          {new Date(layout.created_at).toLocaleDateString()}
                        </small>
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateLayout(layout);
                            }}
                            title="Duplicate Layout"
                          >
                            <i className="ti-files"></i>
                          </Button>
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveAsTemplate(layout);
                            }}
                            title="Save as Template"
                          >
                            <i className="ti-bookmark"></i>
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditLayout(layout);
                            }}
                            title="Edit Layout"
                          >
                            <i className="ti-pencil"></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLayout(layout);
                            }}
                            title="Delete Layout"
                          >
                            <i className="ti-trash"></i>
                          </Button>
                        </div>
                      </div>
                    </Card.Footer>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-warning border-opacity-25 bg-light">
                <Card.Body className="py-3 text-center">
                  <i className="ti-layout-grid3 text-warning fs-3 mb-2"></i>
                  <h6 className="text-warning mb-2">No Layouts Found</h6>
                  <p className="text-muted small mb-3">
                    Create your first farm layout to get started with planting
                    and management.
                  </p>
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={() => setShowCreateModal(true)}
                    disabled={!farmId}
                  >
                    <i className="ti-plus me-2"></i>
                    Create First Layout
                  </Button>
                </Card.Body>
              </Card>
            )}

            {/* Layout Selection Dropdown (Alternative) */}
            {layouts && layouts.length > 0 && (
              <div>
                <Form.Label className="fw-medium mb-2 small">
                  <i className="ti-layout-grid2 me-2"></i>
                  Quick Select
                </Form.Label>
                <Form.Select
                  value={filters.selectedLayout?.id || ""}
                  onChange={(e) => {
                    const selectedLayout =
                      layouts.find((l) => l.id === e.target.value) || null;
                    handleFilterChange("selectedLayout", selectedLayout);
                    if (selectedLayout) {
                      activateLayout(selectedLayout);
                    }
                  }}
                  className="border-success-subtle"
                  size="sm"
                >
                  <option value="">Select Layout</option>
                  {layouts.map((layout) => (
                    <option key={layout.id} value={layout.id}>
                      {layout.name} {layout.is_active && "(Active)"}
                    </option>
                  ))}
                </Form.Select>
              </div>
            )}
          </div>

          {/* View Options */}
          <div>
            <Form.Label className="fw-medium mb-3">
              <i className="ti-eye me-2"></i>
              View Options
            </Form.Label>

            <div className="d-flex flex-column gap-3">
              {/* Show Planting Guides Toggle */}
              <ToggleSwitch
                id="planting-guides-switch"
                label="Planting Guides"
                description="Show suggested planting spots"
                checked={filters.showPlantingGuides !== false}
                onChange={(checked) =>
                  handleFilterChange("showPlantingGuides", checked)
                }
                variant="success"
              />

              {/* Show Expand Buttons Toggle */}
              <ToggleSwitch
                id="expand-buttons-switch"
                label="Expand Buttons"
                description="Show grid expansion controls (add/remove rows/columns)"
                checked={filters.showExpandButtons || false}
                onChange={(checked) =>
                  handleFilterChange("showExpandButtons", checked)
                }
                variant="success"
              />

              {/* Fullscreen Toggle */}
              <ToggleSwitch
                id="fullscreen-switch"
                label="Fullscreen Mode"
                description="Use entire screen space"
                checked={filters.isFullscreen || false}
                onChange={(checked) =>
                  handleFilterChange("isFullscreen", checked)
                }
                variant="primary"
              />
            </div>
          </div>

          {/* Zoom Controls */}
          <div>
            <Form.Label className="fw-medium mb-2">
              <i className="ti-zoom-in me-2"></i>
              Zoom Level
            </Form.Label>
            <div className="d-flex align-items-center gap-2 mb-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() =>
                  handleFilterChange(
                    "zoom",
                    Math.max(0.5, (filters.zoom || 1) - 0.1)
                  )
                }
                disabled={filters.zoom <= 0.5}
                className="px-2"
              >
                <i className="ti-minus"></i>
              </Button>
              <div className="flex-grow-1 text-center">
                <Badge bg="secondary" className="px-3 py-2">
                  {Math.round((filters.zoom || 1) * 100)}%
                </Badge>
              </div>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() =>
                  handleFilterChange(
                    "zoom",
                    Math.min(2, (filters.zoom || 1) + 0.1)
                  )
                }
                disabled={filters.zoom >= 2}
                className="px-2"
              >
                <i className="ti-plus"></i>
              </Button>
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handleFilterChange("zoom", 1)}
                className="flex-grow-1"
                disabled={filters.zoom === 1}
              >
                <i className="ti-target me-1"></i>
                Reset Zoom
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <Form.Label className="fw-medium mb-2">
              <i className="ti-bolt me-2"></i>
              Quick Actions
            </Form.Label>
            <div className="d-grid gap-2">
              <Button
                variant="outline-success"
                size="sm"
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("refresh-farm-data"))
                }
              >
                <i className="ti-reload me-2"></i>
                Refresh Data
              </Button>
              <Button
                variant="outline-primary"
                size="sm"
                href="/tree-management"
                className="text-decoration-none"
              >
                <i className="ti-plus me-2"></i>
                Manage Trees
              </Button>
              <Button
                variant="outline-info"
                size="sm"
                href="/farm-layout-fullscreen"
                className="text-decoration-none"
              >
                <i className="ti-arrows-fullscreen me-2"></i>
                Fullscreen View
              </Button>
            </div>
          </div>

          {/* Legend */}
          <Card className="border-info border-opacity-25 bg-light">
            <Card.Body className="py-3">
              <h6 className="card-title text-info mb-3">
                <i className="ti-palette me-2"></i>
                Legend
              </h6>
              <div className="d-flex flex-column gap-2">
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-circle me-2 border"
                    style={{
                      width: "20px",
                      height: "20px",
                      backgroundColor: "#28a745",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: "700",
                    }}
                  >
                    T
                  </div>
                  <small>Planted Trees</small>
                </div>
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-circle border me-2"
                    style={{
                      width: "16px",
                      height: "16px",
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "2px solid #28a745",
                    }}
                  ></div>
                  <small>Planting Guides</small>
                </div>
                <div className="d-flex align-items-center">
                  <div
                    className="me-2"
                    style={{
                      width: "20px",
                      height: "2px",
                      backgroundColor: "rgba(40, 167, 69, 0.3)",
                    }}
                  ></div>
                  <small>Grid Lines (1ft)</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </Offcanvas.Body>

      {/* Footer */}
      <div className="border-top p-3">
        <Row className="g-2">
          <Col>
            <Button
              variant="outline-secondary"
              className="w-100"
              onClick={clearAllFilters}
              disabled={activeFiltersCount === 0}
            >
              <i className="ti-refresh me-2"></i>
              Reset
            </Button>
          </Col>
          <Col>
            <Button variant="success" className="w-100" onClick={onHide}>
              <i className="ti-check me-2"></i>
              Apply
            </Button>
          </Col>
        </Row>
      </div>

      {/* Create Layout Modal */}
      <CreateLayoutModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        farmId={farmId}
        onLayoutCreated={handleLayoutCreated}
        existingLayouts={layouts}
      />

      {/* Edit Layout Modal */}
      <EditLayoutModal
        show={showEditModal}
        onHide={() => {
          setShowEditModal(false);
          setEditingLayout(null);
        }}
        layout={editingLayout}
        onLayoutUpdated={handleLayoutUpdated}
        farmId={farmId}
      />

      {/* Delete Layout Modal */}
      <DeleteLayoutModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setDeletingLayout(null);
        }}
        layout={deletingLayout}
        onConfirmDelete={confirmDeleteLayout}
      />

      {/* Template Management Modal */}
      <TemplateManagementModal
        show={showTemplateModal}
        onHide={() => setShowTemplateModal(false)}
        layout={filters.selectedLayout}
        onTemplateCreated={handleLayoutCreated}
        farmId={farmId}
      />
    </Offcanvas>
  );
}
