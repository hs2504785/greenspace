"use client";

import { Offcanvas, Form, Button, Row, Col, Badge } from "react-bootstrap";

export default function PreBookingFilters({
  show,
  onHide,
  filters,
  onFilterChange,
  totalCount,
}) {
  const handleFilterChange = (key, value) => {
    onFilterChange({ [key]: value });
  };

  const clearAllFilters = () => {
    onFilterChange({
      search: "",
      category: "all",
      harvest_season: "all",
      sort: "estimated_available_date",
      confidence_level: "all",
    });
  };

  const activeFiltersCount = Object.values(filters).filter((value, index) => {
    const keys = Object.keys(filters);
    const key = keys[index];
    return key !== "sort" && value !== "all" && value !== "";
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
          <i className="ti-filter text-success"></i>
          Pre-Booking Filters
          {activeFiltersCount > 0 && (
            <Badge bg="success" className="ms-2">
              {activeFiltersCount}
            </Badge>
          )}
        </Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body>
        <div className="d-flex flex-column gap-4">
          {/* Search */}
          <div>
            <Form.Label className="fw-medium mb-2">
              <i className="ti-search me-2"></i>
              Search Products
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Search by name, location, season..."
              value={filters.search || ""}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="border-success-subtle"
            />
          </div>

          {/* Category */}
          <div>
            <Form.Label className="fw-medium mb-2">
              <i className="ti-tag me-2"></i>
              Category
            </Form.Label>
            <Form.Select
              value={filters.category || "all"}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="border-success-subtle"
            >
              <option value="all">All Categories</option>
              <option value="leafy">🥬 Leafy Greens</option>
              <option value="root">🥕 Root Vegetables</option>
              <option value="fruit">🍅 Fruits</option>
              <option value="herbs">🌿 Herbs & Spices</option>
              <option value="exotic">🌺 Exotic Vegetables</option>
            </Form.Select>
          </div>

          {/* Harvest Season */}
          <div>
            <Form.Label className="fw-medium mb-2">
              <i className="ti-calendar me-2"></i>
              Harvest Season
            </Form.Label>
            <Form.Select
              value={filters.harvest_season || "all"}
              onChange={(e) =>
                handleFilterChange("harvest_season", e.target.value)
              }
              className="border-success-subtle"
            >
              <option value="all">All Seasons</option>
              <option value="Spring">🌸 Spring</option>
              <option value="Summer">☀️ Summer</option>
              <option value="Monsoon">🌧️ Monsoon</option>
              <option value="Winter">❄️ Winter</option>
              <option value="Year-round">🌿 Year-round</option>
            </Form.Select>
          </div>

          {/* Seller Confidence */}
          <div>
            <Form.Label className="fw-medium mb-2">
              <i className="ti-shield me-2"></i>
              Seller Confidence
            </Form.Label>
            <Form.Select
              value={filters.confidence_level || "all"}
              onChange={(e) =>
                handleFilterChange("confidence_level", e.target.value)
              }
              className="border-success-subtle"
            >
              <option value="all">Any Confidence Level</option>
              <option value="high">🟢 High (80%+)</option>
              <option value="medium">🟡 Medium (60-79%)</option>
              <option value="low">🔴 Low (Below 60%)</option>
            </Form.Select>
          </div>

          {/* Sort */}
          <div>
            <Form.Label className="fw-medium mb-2">
              <i className="ti-sort-ascending me-2"></i>
              Sort By
            </Form.Label>
            <Form.Select
              value={filters.sort || "estimated_available_date"}
              onChange={(e) => handleFilterChange("sort", e.target.value)}
              className="border-success-subtle"
            >
              <option value="estimated_available_date">
                🗓️ Availability Date
              </option>
              <option value="price_low">💰 Price: Low to High</option>
              <option value="price_high">💰 Price: High to Low</option>
              <option value="confidence">🎯 Seller Confidence</option>
              <option value="alphabetical">🔤 Alphabetical</option>
              <option value="newest">🆕 Recently Added</option>
            </Form.Select>
          </div>

          {/* Results Summary */}
          <div className="bg-light rounded p-3 text-center">
            <div className="fw-medium text-success mb-1">
              {totalCount} Products Found
            </div>
            <small className="text-muted">
              {activeFiltersCount > 0
                ? `${activeFiltersCount} filter${
                    activeFiltersCount !== 1 ? "s" : ""
                  } applied`
                : "No filters applied"}
            </small>
          </div>
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
              Clear All
            </Button>
          </Col>
          <Col>
            <Button variant="success" className="w-100" onClick={onHide}>
              <i className="ti-check me-2"></i>
              Apply Filters
            </Button>
          </Col>
        </Row>
      </div>
    </Offcanvas>
  );
}
