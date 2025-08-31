"use client";

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

export default function FarmLayoutFilters({
  show,
  onHide,
  filters,
  onFilterChange,
  layouts = [],
  stats = {},
}) {
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

          {/* Layout Selection */}
          {layouts && layouts.length > 0 && (
            <div>
              <Form.Label className="fw-medium mb-2">
                <i className="ti-layers-alt me-2"></i>
                Farm Layout
              </Form.Label>
              <Form.Select
                value={filters.selectedLayout?.id || ""}
                onChange={(e) => {
                  const selectedLayout =
                    layouts.find((l) => l.id === e.target.value) || null;
                  handleFilterChange("selectedLayout", selectedLayout);
                }}
                className="border-success-subtle"
              >
                <option value="">Select Layout</option>
                {layouts.map((layout) => (
                  <option key={layout.id} value={layout.id}>
                    {layout.name} {layout.is_active && "(Active)"}
                  </option>
                ))}
              </Form.Select>
              {filters.selectedLayout && (
                <small className="text-muted mt-1 d-block">
                  {filters.selectedLayout.description}
                </small>
              )}
            </div>
          )}

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
                href="/trees"
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
    </Offcanvas>
  );
}
