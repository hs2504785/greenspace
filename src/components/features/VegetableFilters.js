"use client";

import {
  Form,
  InputGroup,
  Button,
  Collapse,
  Row,
  Col,
  Badge,
} from "react-bootstrap";
import { useCallback, useEffect, useState, useMemo, memo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import VegetableService from "@/services/VegetableService";
import SearchInput from "@/components/common/SearchInput";
import { supabase } from "@/lib/supabase";

const defaultCategories = [
  "All",
  "Leafy",
  "Root",
  "Fruit",
  "Herbs",
  "Vegetable",
];

const VegetableFilters = memo(function VegetableFilters({
  filters,
  onFilterChange,
  totalCount,
  showAdvancedFilters = false, // New prop to control advanced filters
}) {
  // Memoize filter values to prevent unnecessary re-renders
  const {
    category,
    sortBy,
    sortDirection,
    productType,
    demandLevel,
    showFreeOnly,
  } = useMemo(
    () => ({
      category: filters.category || "All",
      sortBy: filters.sortBy || "created_at",
      sortDirection: filters.sortDirection || "desc",
      productType: filters.productType || "all",
      demandLevel: filters.demandLevel || "all",
      showFreeOnly: filters.showFreeOnly || false,
    }),
    [
      filters.category,
      filters.sortBy,
      filters.sortDirection,
      filters.productType,
      filters.demandLevel,
      filters.showFreeOnly,
    ]
  );

  const [categories, setCategories] = useState(defaultCategories);
  const [locations, setLocations] = useState([]);
  const [searchValue, setSearchValue] = useState(filters.searchQuery || "");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const debouncedSearch = useDebounce(searchValue, 500);

  // Effect for debounced search
  useEffect(() => {
    if (debouncedSearch !== filters.searchQuery) {
      onFilterChange({ searchQuery: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch, onFilterChange, filters.searchQuery]);

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

  const handleSearchChange = useCallback((e) => {
    setSearchValue(e.target.value);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchValue("");
  }, []);

  const handleCategoryChange = useCallback(
    (e) => {
      onFilterChange({ category: e.target.value, page: 1 });
    },
    [onFilterChange]
  );

  const handleSortChange = useCallback(
    (e) => {
      const [sortBy, sortDirection] = e.target.value.split("-");
      onFilterChange({ sortBy, sortDirection, page: 1 });
    },
    [onFilterChange]
  );

  const handleProductTypeChange = useCallback(
    (e) => {
      onFilterChange({ productType: e.target.value, page: 1 });
    },
    [onFilterChange]
  );

  const handleDemandLevelChange = useCallback(
    (e) => {
      onFilterChange({ demandLevel: e.target.value, page: 1 });
    },
    [onFilterChange]
  );

  const handleFreeOnlyToggle = useCallback(
    (e) => {
      onFilterChange({ showFreeOnly: e.target.checked, page: 1 });
    },
    [onFilterChange]
  );

  const clearAllFilters = useCallback(() => {
    setSearchValue("");
    onFilterChange({
      searchQuery: "",
      category: "All",
      productType: "all",
      demandLevel: "all",
      showFreeOnly: false,
      sortBy: "created_at",
      sortDirection: "desc",
      page: 1,
    });
  }, [onFilterChange]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.category && filters.category !== "All") count++;
    if (filters.productType && filters.productType !== "all") count++;
    if (filters.demandLevel && filters.demandLevel !== "all") count++;
    if (filters.showFreeOnly) count++;
    return count;
  }, [filters]);

  return (
    <div className="mb-3">
      {/* Main Filter Row */}
      <div className="d-flex align-items-center gap-3 mb-2">
        <div className="d-flex gap-2 flex-grow-1">
          <SearchInput
            value={searchValue}
            onChange={handleSearchChange}
            onClear={handleSearchClear}
            placeholder="Search vegetables..."
            className="flex-grow-1"
          />

          <Form.Select
            value={category}
            onChange={handleCategoryChange}
            className="w-auto flex-shrink-0"
            style={{ minWidth: "120px" }}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </Form.Select>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Advanced Filters Toggle */}
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="d-flex align-items-center"
          >
            <i className="ti-filter me-1"></i>
            Filters
            {activeFiltersCount > 0 && (
              <Badge
                bg="primary"
                className="ms-1"
                style={{ fontSize: "0.7rem" }}
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          <small className="text-muted d-none d-md-inline">
            {totalCount} items
          </small>

          <InputGroup className="w-auto">
            <InputGroup.Text className="bg-white border-end-0">
              <span className="ti-exchange-vertical text-muted"></span>
            </InputGroup.Text>
            <Form.Select
              value={`${sortBy}-${sortDirection}`}
              onChange={handleSortChange}
              className="border-start-0 ps-0"
              style={{ minWidth: "160px" }}
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="price-asc">Price (Low to High)</option>
              <option value="price-desc">Price (High to Low)</option>
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
            </Form.Select>
          </InputGroup>
        </div>
      </div>

      {/* Advanced Filters Collapse */}
      <Collapse in={showAdvanced}>
        <div>
          <div className="p-3 bg-light rounded border">
            <Row className="g-3">
              {/* Product Type Filter */}
              <Col md={6} lg={3}>
                <Form.Label className="small fw-medium text-muted mb-1">
                  Product Type
                </Form.Label>
                <Form.Select
                  value={productType}
                  onChange={handleProductTypeChange}
                  size="sm"
                >
                  <option value="all">All Products</option>
                  <option value="regular">🛒 Regular (In Stock)</option>
                  <option value="prebooking">🌱 Pre-booking Only</option>
                </Form.Select>
              </Col>

              {/* Demand Level Filter */}
              <Col md={6} lg={3}>
                <Form.Label className="small fw-medium text-muted mb-1">
                  Demand Level
                </Form.Label>
                <Form.Select
                  value={demandLevel}
                  onChange={handleDemandLevelChange}
                  size="sm"
                >
                  <option value="all">All Demand Levels</option>
                  <option value="high">🔥 High Demand (20+)</option>
                  <option value="medium">⭐ Popular (5-19)</option>
                  <option value="low">🌱 Some Interest (1-4)</option>
                  <option value="none">✨ New Requests</option>
                </Form.Select>
              </Col>

              {/* Free Items Toggle */}
              <Col md={6} lg={3}>
                <Form.Label className="small fw-medium text-muted mb-1">
                  Price Range
                </Form.Label>
                <Form.Check
                  type="switch"
                  id="free-only-switch"
                  label="🎁 Free items only"
                  checked={showFreeOnly}
                  onChange={handleFreeOnlyToggle}
                  className="mt-1"
                />
              </Col>

              {/* Clear Filters */}
              <Col md={6} lg={3}>
                <Form.Label className="small fw-medium text-muted mb-1">
                  Actions
                </Form.Label>
                <div>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={clearAllFilters}
                    disabled={activeFiltersCount === 0}
                    className="w-100"
                  >
                    <i className="ti-refresh me-1"></i>
                    Clear All Filters
                  </Button>
                </div>
              </Col>
            </Row>

            {/* Active Filters Summary */}
            {activeFiltersCount > 0 && (
              <div className="mt-3 pt-2 border-top">
                <small className="text-muted fw-medium">Active filters:</small>
                <div className="d-flex flex-wrap gap-1 mt-1">
                  {filters.searchQuery && (
                    <Badge bg="primary" className="small">
                      Search: "{filters.searchQuery}"
                    </Badge>
                  )}
                  {filters.category && filters.category !== "All" && (
                    <Badge bg="primary" className="small">
                      Category: {filters.category}
                    </Badge>
                  )}
                  {filters.productType && filters.productType !== "all" && (
                    <Badge bg="primary" className="small">
                      Type:{" "}
                      {filters.productType === "regular"
                        ? "Regular"
                        : "Pre-booking"}
                    </Badge>
                  )}
                  {filters.demandLevel && filters.demandLevel !== "all" && (
                    <Badge bg="primary" className="small">
                      Demand: {filters.demandLevel}
                    </Badge>
                  )}
                  {filters.showFreeOnly && (
                    <Badge bg="success" className="small">
                      Free items only
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Collapse>

      {/* Mobile Results Count */}
      <div className="d-md-none mt-2">
        <small className="text-muted">{totalCount} items found</small>
      </div>
    </div>
  );
});

export default VegetableFilters;
