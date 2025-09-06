"use client";

import { InputGroup, Form } from "react-bootstrap";
import { forwardRef } from "react";

/**
 * Reusable SearchInput component with search icon prefix and optional clear icon
 *
 * @param {string} value - Current search value
 * @param {function} onChange - Handler for input changes
 * @param {function} onSubmit - Optional handler for search submission (Enter key or form submit)
 * @param {function} onClear - Optional handler for clearing the search (shows clear icon when text exists)
 * @param {string} placeholder - Input placeholder text
 * @param {string} className - Additional CSS classes
 * @param {boolean} disabled - Whether the input is disabled
 * @param {string} size - Bootstrap size variant ('sm', 'lg')
 *
 * @example
 * <SearchInput
 *   value={searchTerm}
 *   onChange={(e) => setSearchTerm(e.target.value)}
 *   onSubmit={(query) => handleSearch(query)}
 *   onClear={() => setSearchTerm("")}
 *   placeholder="Search products..."
 * />
 */
const SearchInput = forwardRef(function SearchInput(
  {
    value,
    onChange,
    onSubmit,
    onClear,
    placeholder = "Search...",
    className = "",
    disabled = false,
    size,
  },
  ref
) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && onSubmit) {
      onSubmit(value);
    }
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    }
  };

  return (
    <Form onSubmit={handleSubmit} className={className}>
      <InputGroup size={size} className="search-input-group">
        <InputGroup.Text className="search-input-prefix">
          <i className="ti-search text-muted"></i>
        </InputGroup.Text>
        <Form.Control
          ref={ref}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`search-input-control ${value ? "has-clear-btn" : ""}`}
        />
        {value && onClear && (
          <InputGroup.Text
            className="search-input-clear"
            onClick={handleClear}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleClear()}
            title="Clear search"
          >
            <i className="ti ti-close text-muted"></i>
          </InputGroup.Text>
        )}
      </InputGroup>
    </Form>
  );
});

export default SearchInput;
