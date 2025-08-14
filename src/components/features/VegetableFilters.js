'use client';

import { Form, InputGroup, Row, Col } from 'react-bootstrap';
import { useCallback, useEffect, useState, useMemo, memo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { vegetableService } from '@/services/VegetableService';
import { supabase } from '@/lib/supabase';

const defaultCategories = ['All', 'Leafy', 'Root', 'Fruit', 'Herbs', 'Vegetable'];

const VegetableFilters = memo(function VegetableFilters({ filters, onFilterChange, totalCount }) {
  // Memoize filter values to prevent unnecessary re-renders
  const { category, sortBy, sortDirection } = useMemo(() => ({
    category: filters.category || 'All',
    sortBy: filters.sortBy || 'created_at',
    sortDirection: filters.sortDirection || 'desc'
  }), [filters.category, filters.sortBy, filters.sortDirection]);
  const [categories, setCategories] = useState(defaultCategories);
  const [locations, setLocations] = useState([]);
  const [searchValue, setSearchValue] = useState(filters.searchQuery || '');
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
        if (vegetableService) {
          const [fetchedCategories, fetchedLocations] = await Promise.all([
            vegetableService.getCategories(),
            vegetableService.getLocations()
          ]);
          setCategories(['All', ...fetchedCategories]);
          setLocations(fetchedLocations);
        }
      } catch (error) {
        console.error('Error loading filter options:', error);
      }
    };

    loadFilterOptions();
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchValue(e.target.value);
  }, []);



  const handleCategoryChange = useCallback((e) => {
    onFilterChange({ category: e.target.value, page: 1 });
  }, [onFilterChange]);

  const handleSortChange = useCallback((e) => {
    const [sortBy, sortDirection] = e.target.value.split('-');
    onFilterChange({ sortBy, sortDirection, page: 1 });
  }, [onFilterChange]);

  return (
    <div className="d-flex align-items-center gap-3">
      <div className="d-flex gap-2 flex-grow-1">
        <InputGroup>
          <InputGroup.Text className="bg-white border-end-0">
            <span className="ti-search text-muted"></span>
          </InputGroup.Text>
          <Form.Control
            type="text"
            placeholder="Search vegetables..."
            value={searchValue}
            onChange={handleSearchChange}
            className="border-start-0 ps-0"
          />
        </InputGroup>

        <Form.Select
          value={category}
          onChange={handleCategoryChange}
          className="w-auto flex-shrink-0"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </Form.Select>
      </div>

      <div className="d-flex align-items-center gap-2">
        <small className="text-muted">
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
  );
});

export default VegetableFilters;