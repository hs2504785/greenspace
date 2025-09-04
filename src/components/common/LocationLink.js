"use client";

import { Button } from "react-bootstrap";
import { useRouter } from "next/navigation";
import {
  isMapLink,
  getLocationDisplayText,
  openMapLink,
} from "@/utils/locationUtils";

/**
 * Reusable component for displaying location information as clickable links
 * - If location is a map URL, opens in new tab
 * - If location is regular text, navigates to /users page
 * - Handles both delivery addresses and seller locations
 */
export default function LocationLink({
  location,
  className = "",
  variant = "link",
  size = "sm",
  compact = false,
  fallbackRoute = "/users",
  style = {},
}) {
  const router = useRouter();

  if (!location) {
    return <span className="text-muted">Location not available</span>;
  }

  const handleLocationClick = () => {
    if (isMapLink(location)) {
      // Open map link in new tab
      openMapLink(location);
    } else {
      // Navigate to users page or specified fallback route
      router.push(fallbackRoute);
    }
  };

  const displayText = isMapLink(location)
    ? getLocationDisplayText(location, compact)
    : location;

  const isClickable = isMapLink(location) || fallbackRoute;

  if (!isClickable) {
    return (
      <span className={className} style={style}>
        {displayText}
      </span>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={`p-0 text-decoration-none text-success fw-medium text-start ${className}`}
      onClick={handleLocationClick}
      style={{
        whiteSpace: "normal",
        textAlign: "left",
        ...style,
      }}
    >
      {displayText}
      {isMapLink(location) && (
        <i className="ti-external-link ms-1" style={{ fontSize: "0.8em" }}></i>
      )}
    </Button>
  );
}
