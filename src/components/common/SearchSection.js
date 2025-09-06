"use client";

import { useState } from "react";
import { Container, Button } from "react-bootstrap";
import SearchInput from "@/components/common/SearchInput";

/**
 * Reusable SearchSection component that can be used anywhere in the app
 *
 * @param {Object} props - Component props
 * @param {string} props.searchValue - Current search value
 * @param {function} props.onSearchChange - Handler for search input changes
 * @param {function} props.onSearchSubmit - Handler for search submission
 * @param {function} props.onSearchClear - Handler for clearing search
 * @param {string} props.placeholder - Search input placeholder
 * @param {boolean} props.showFilters - Whether to show filter button
 * @param {function} props.onFilterClick - Handler for filter button click
 * @param {boolean} props.showCart - Whether to show cart button
 * @param {function} props.onCartClick - Handler for cart button click
 * @param {number} props.cartItemCount - Number of items in cart
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.sticky - Whether the search section should be sticky
 * @param {boolean} props.compact - Whether to use compact styling
 * @param {React.ReactNode} props.additionalActions - Additional action buttons to show
 *
 * @example
 * <SearchSection
 *   searchValue={searchTerm}
 *   onSearchChange={(e) => setSearchTerm(e.target.value)}
 *   onSearchSubmit={(query) => handleSearch(query)}
 *   onSearchClear={() => setSearchTerm("")}
 *   placeholder="Search products..."
 *   showFilters={true}
 *   onFilterClick={() => setShowFilters(true)}
 *   showCart={true}
 *   onCartClick={() => router.push('/cart')}
 *   cartItemCount={5}
 *   sticky={true}
 * />
 */
export default function SearchSection({
  searchValue = "",
  onSearchChange,
  onSearchSubmit,
  onSearchClear,
  placeholder = "Search...",
  showFilters = false,
  onFilterClick,
  showCart = false,
  onCartClick,
  cartItemCount = 0,
  className = "",
  sticky = false,
  compact = false,
  additionalActions = null,
}) {
  const sectionClasses = [
    "search-section",
    sticky ? "search-section-sticky" : "",
    compact ? "search-section-compact" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={sectionClasses}>
      <Container>
        <div className={compact ? "py-2" : "py-3"}>
          <div className="d-flex align-items-center gap-2">
            {/* Search input takes most space */}
            <div className="flex-grow-1">
              <SearchInput
                value={searchValue}
                onChange={onSearchChange}
                onSubmit={onSearchSubmit}
                onClear={onSearchClear}
                placeholder={placeholder}
                className="w-100"
              />
            </div>

            {/* Action buttons */}
            <div className="d-flex align-items-center gap-2">
              {/* Filter button */}
              {showFilters && (
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={onFilterClick}
                  className="search-action-btn has-text"
                  title="Filters"
                >
                  <i className="ti-filter"></i>
                  <span className="d-none d-sm-inline ms-1">Filter</span>
                </Button>
              )}

              {/* Cart button */}
              {showCart && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={onCartClick}
                  className="position-relative search-action-btn has-text"
                  title="Shopping Cart"
                >
                  <i className="ti-shopping-cart"></i>
                  <span className="d-none d-sm-inline ms-1">Cart</span>
                  {cartItemCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {cartItemCount > 99 ? "99+" : cartItemCount}
                      <span className="visually-hidden">items in cart</span>
                    </span>
                  )}
                </Button>
              )}

              {/* Additional custom actions */}
              {additionalActions}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
