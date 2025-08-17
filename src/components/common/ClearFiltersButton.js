"use client";

import { Button } from "react-bootstrap";

/**
 * Reusable Clear Filters Button component with consistent styling
 *
 * @param {function} onClick - Handler for clearing filters
 * @param {string} text - Button text (default: "Clear Filters")
 * @param {string} className - Additional CSS classes
 * @param {boolean} disabled - Whether the button is disabled
 * @param {object} style - Additional inline styles
 *
 * @example
 * <ClearFiltersButton
 *   onClick={() => {
 *     setSearchTerm("");
 *     setCategoryFilter("all");
 *   }}
 * />
 */
export default function ClearFiltersButton({
  onClick,
  text = "Clear Filters",
  className = "",
  disabled = false,
  style = {},
  ...props
}) {
  return (
    <div className="d-flex align-items-end h-100">
      <Button
        variant="light"
        className={`text-muted border w-100 ${className}`}
        style={{ height: "38px", ...style }}
        onClick={onClick}
        disabled={disabled}
        {...props}
      >
        <i className="ti ti-refresh me-2"></i>
        {text}
      </Button>
    </div>
  );
}
