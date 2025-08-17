"use client";

import {
  Offcanvas,
  Form,
  Button,
  InputGroup,
  Badge,
  Row,
  Col,
  Card,
} from "react-bootstrap";
import { useCallback, useEffect, useState, useMemo, memo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import VegetableService from "@/services/VegetableService";
import SearchInput from "@/components/common/SearchInput";
import "@/styles/vegetable-filter-offcanvas.css";

const defaultCategories = [
  "All",
  "Leafy",
  "Root",
  "Fruit",
  "Herbs",
  "Vegetable",
];

const VegetableFilterOffcanvas = memo(function VegetableFilterOffcanvas({
  show,
  onHide,
  filters,
  onFilterChange,
  totalCount,
}) {
  // Memoize filter values to prevent unnecessary re-renders
  const { category, sortBy, sortDirection } = useMemo(
    () => ({
      category: filters.category || "All",
      sortBy: filters.sortBy || "created_at",
      sortDirection: filters.sortDirection || "desc",
    }),
    [filters.category, filters.sortBy, filters.sortDirection]
  );

  const [categories, setCategories] = useState(defaultCategories);
  const [locations, setLocations] = useState([]);
  const [searchValue, setSearchValue] = useState(filters.searchQuery || "");
  const [tempFilters, setTempFilters] = useState(filters);
  const debouncedSearch = useDebounce(searchValue, 300);

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        if (VegetableService) {
          const [fetchedCategories, fetchedLocations] = await Promise.all([
            VegetableService.getCategories(),
            VegetableService.getLocations(),
          ]);
          setCategories(["All", ...fetchedCategories]);
          setLocations(fetchedLocations);
        }
      } catch (error) {
        console.error("Error loading filter options:", error);
      }
    };

    loadFilterOptions();
  }, []);

  // Sync temp filters when filters prop changes
  useEffect(() => {
    setTempFilters({
      ...filters,
      category: filters.category || "All", // Ensure All is always default
    });
    setSearchValue(filters.searchQuery || "");
  }, [filters]);

  // Handle search with debounce
  useEffect(() => {
    if (debouncedSearch !== filters.searchQuery) {
      setTempFilters((prev) => ({ ...prev, searchQuery: debouncedSearch }));
    }
  }, [debouncedSearch, filters.searchQuery]);

  const handleSearchChange = useCallback((e) => {
    setSearchValue(e.target.value);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchValue("");
    setTempFilters((prev) => ({ ...prev, searchQuery: "" }));
  }, []);

  const handleCategoryChange = useCallback((categoryValue) => {
    setTempFilters((prev) => ({ ...prev, category: categoryValue }));
  }, []);

  const handleSortChange = useCallback((sortValue) => {
    const [sortBy, sortDirection] = sortValue.split("-");
    setTempFilters((prev) => ({ ...prev, sortBy, sortDirection }));
  }, []);

  const handleShowFreeOnlyToggle = useCallback((checked) => {
    setTempFilters((prev) => ({ ...prev, showFreeOnly: checked }));
  }, []);

  const applyFilters = useCallback(() => {
    onFilterChange({ ...tempFilters, page: 1 });
    onHide();
  }, [tempFilters, onFilterChange, onHide]);

  const clearAllFilters = useCallback(() => {
    const clearedFilters = {
      category: "All",
      sortBy: "created_at",
      sortDirection: "desc",
      searchQuery: "",
      showFreeOnly: false,
      page: 1,
    };
    setTempFilters(clearedFilters);
    setSearchValue("");
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      tempFilters.category !== "All" ||
      tempFilters.searchQuery ||
      tempFilters.showFreeOnly ||
      tempFilters.sortBy !== "created_at" ||
      tempFilters.sortDirection !== "desc"
    );
  }, [tempFilters]);

  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      placement="end"
      className="vegetable-filter-offcanvas"
    >
      <Offcanvas.Header closeButton className="border-bottom">
        <Offcanvas.Title>Filter & Sort</Offcanvas.Title>
        <div className="clear-button-container ms-2">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={clearAllFilters}
            className="d-flex align-items-center gap-1"
            title="Clear all filters"
            style={{
              opacity: hasActiveFilters ? 1 : 0,
              visibility: hasActiveFilters ? "visible" : "hidden",
              transition: "opacity 0.2s ease-in-out",
            }}
          >
            <i className="ti-refresh" style={{ fontSize: "0.9rem" }}></i>
            <span className="d-none d-sm-inline">Clear</span>
          </Button>
        </div>
      </Offcanvas.Header>

      <Offcanvas.Body className="p-3">
        {/* Search Section */}
        <Card className="border-0 shadow-sm mb-3">
          <Card.Body className="p-3">
            <h6 className="mb-2 fw-semibold">Search</h6>
            <SearchInput
              value={searchValue}
              onChange={handleSearchChange}
              onClear={handleSearchClear}
              placeholder="Search vegetables..."
              className="w-100"
            />
          </Card.Body>
        </Card>

        {/* Category Section */}
        <Card className="border-0 shadow-sm mb-3">
          <Card.Body className="p-3">
            <h6 className="mb-3 fw-semibold">Category</h6>
            <Row className="g-2">
              {categories.map((cat) => (
                <Col key={cat} xs={6}>
                  <Form.Check
                    type="radio"
                    id={`category-${cat}`}
                    name="category"
                    label={cat.charAt(0).toUpperCase() + cat.slice(1)}
                    checked={tempFilters.category === cat}
                    onChange={() => handleCategoryChange(cat)}
                    className="mb-1"
                  />
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>

        {/* Sort Section */}
        <Card className="border-0 shadow-sm mb-3">
          <Card.Body className="p-3">
            <h6 className="mb-3 fw-semibold">Sort by</h6>
            <Form.Select
              value={`${tempFilters.sortBy}-${tempFilters.sortDirection}`}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-100"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="price-asc">Price (Low to High)</option>
              <option value="price-desc">Price (High to Low)</option>
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
            </Form.Select>
          </Card.Body>
        </Card>

        {/* Special Options */}
        <Card className="border-0 shadow-sm mb-3">
          <Card.Body className="p-3">
            <h6 className="mb-3 fw-semibold">Special Offers</h6>
            <Form.Check
              type="switch"
              id="show-free-only"
              label="🎁 Fair Share (Free items only)"
              checked={tempFilters.showFreeOnly || false}
              onChange={(e) => handleShowFreeOnlyToggle(e.target.checked)}
              className="custom-fair-share-switch"
            />
          </Card.Body>
        </Card>
      </Offcanvas.Body>

      <div className="border-top p-3 bg-white">
        <Row className="g-2">
          <Col>
            <Button
              variant="outline-secondary"
              className="w-100"
              onClick={onHide}
            >
              Cancel
            </Button>
          </Col>
          <Col>
            <Button variant="success" className="w-100" onClick={applyFilters}>
              Apply Filters
            </Button>
          </Col>
        </Row>
      </div>
    </Offcanvas>
  );
});

export default VegetableFilterOffcanvas;
