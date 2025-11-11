"use client";

import { Form, Row, Col, Button } from 'react-bootstrap';
import { FaSearch, FaTimes } from 'react-icons/fa';

export default function SeedFilters({ filters, onFilterChange, categories }) {
  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };
  
  const clearFilters = () => {
    onFilterChange({
      category: 'all',
      isFree: false,
      isHeirloom: false,
      search: ''
    });
  };
  
  const hasActiveFilters = 
    filters.category !== 'all' ||
    filters.isFree ||
    filters.isHeirloom ||
    filters.search;
  
  return (
    <Form>
      <Row className="g-3">
        {/* Search */}
        <Col xs={12} md={6} lg={4}>
          <Form.Group>
            <Form.Label className="small fw-medium text-muted">
              <FaSearch className="me-1" />
              Search Seeds
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Search by name, variety..."
              value={filters.search}
              onChange={(e) => handleChange('search', e.target.value)}
            />
          </Form.Group>
        </Col>
        
        {/* Category */}
        <Col xs={12} md={6} lg={4}>
          <Form.Group>
            <Form.Label className="small fw-medium text-muted">
              Category
            </Form.Label>
            <Form.Select
              value={filters.category}
              onChange={(e) => handleChange('category', e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        
        {/* Quick Filters */}
        <Col xs={12} lg={4}>
          <Form.Label className="small fw-medium text-muted d-block">
            Quick Filters
          </Form.Label>
          <div className="d-flex gap-2 flex-wrap">
            <Form.Check
              type="switch"
              id="filter-free"
              label="Free Only"
              checked={filters.isFree}
              onChange={(e) => handleChange('isFree', e.target.checked)}
              className="d-inline-block"
            />
            <Form.Check
              type="switch"
              id="filter-heirloom"
              label="Heirloom"
              checked={filters.isHeirloom}
              onChange={(e) => handleChange('isHeirloom', e.target.checked)}
              className="d-inline-block"
            />
          </div>
        </Col>
        
        {/* Clear Filters */}
        {hasActiveFilters && (
          <Col xs={12}>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={clearFilters}
            >
              <FaTimes className="me-1" />
              Clear All Filters
            </Button>
          </Col>
        )}
      </Row>
    </Form>
  );
}

