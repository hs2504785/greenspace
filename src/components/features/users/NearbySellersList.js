"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Badge,
  Button,
  Form,
  Alert,
  Spinner,
  Table,
  Dropdown,
} from "react-bootstrap";
import { useSession } from "next-auth/react";
import UserAvatar from "@/components/common/UserAvatar";
import UserProfilePopover from "@/components/common/UserProfilePopover";
import {
  getCurrentLocation,
  sortUsersByDistance,
  filterUsersByDistance,
  formatDistance,
  getDistanceFilterOptions,
} from "@/utils/distanceUtils";
import {
  isMapLink,
  getLocationDisplayText,
  openMapLink,
} from "@/utils/locationUtils";

export default function NearbySellersList({
  users = [],
  onShowMap,
  className = "",
}) {
  const { data: session } = useSession();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [sortedUsers, setSortedUsers] = useState([]);
  const [distanceFilter, setDistanceFilter] = useState("all");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(true);

  const distanceOptions = getDistanceFilterOptions();

  // Filter to show only sellers - memoized to prevent infinite loops
  const sellers = useMemo(() => {
    return users.filter((user) => user.is_seller);
  }, [users]);

  useEffect(() => {
    if (currentLocation && sellers.length > 0) {
      const sorted = sortUsersByDistance(sellers, currentLocation);
      setSortedUsers(sorted);
    } else {
      setSortedUsers(sellers);
    }
  }, [currentLocation, sellers]);

  // Auto-detect location when component mounts (if not already available)
  useEffect(() => {
    if (!currentLocation && sellers.length > 0) {
      handleGetLocation(true); // true = isAutoDetection
    }
  }, [sellers]); // Trigger when sellers are loaded

  const handleGetLocation = async (isAutoDetection = false) => {
    setLocationLoading(true);
    setLocationError(null);

    try {
      const location = await getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        setShowLocationPrompt(false);
        console.log("Current location detected:", location);
      } else {
        // Only show error for manual detection, not auto-detection
        if (!isAutoDetection) {
          setLocationError(
            "Unable to detect your location. Please enable location services."
          );
        }
      }
    } catch (error) {
      // Only show error for manual detection, not auto-detection
      if (!isAutoDetection) {
        setLocationError("Failed to get your location. Please try again.");
      }
      console.error("Location error:", error);
    } finally {
      setLocationLoading(false);
    }
  };

  // Filter sellers by distance - memoized for performance
  const filteredSellers = useMemo(() => {
    const result =
      distanceFilter === "all"
        ? sortedUsers
        : filterUsersByDistance(
            sortedUsers,
            distanceOptions.find((opt) => opt.value === distanceFilter)
              ?.distance
          );

    console.log("🔍 DEBUG - Distance Filtering:", {
      distanceFilter,
      sortedUsersLength: sortedUsers.length,
      filteredSellersLength: result.length,
      maxDistance: distanceOptions.find((opt) => opt.value === distanceFilter)
        ?.distance,
      sampleSortedUser: sortedUsers[0]
        ? {
            name: sortedUsers[0].name,
            distance: sortedUsers[0].distance,
            coordinates: sortedUsers[0].coordinates,
            coordinate_source: sortedUsers[0].coordinate_source,
          }
        : null,
    });

    return result;
  }, [sortedUsers, distanceFilter, distanceOptions]);

  const nearbySellers = useMemo(() => {
    // Include sellers with coordinates OR distance (for map viewing)
    const nearby = filteredSellers.filter(
      (seller) =>
        seller.distance !== null || seller.coordinates || seller.location
    );
    console.log("🔍 DEBUG - NearbySellersList:", {
      totalSellers: sellers.length,
      filteredSellers: filteredSellers.length,
      nearbySellers: nearby.length,
      currentLocation,
      sampleSeller: filteredSellers[0]
        ? {
            name: filteredSellers[0].name,
            hasCoordinates: filteredSellers[0].has_coordinates,
            coordinates: filteredSellers[0].coordinates,
            distance: filteredSellers[0].distance,
            location: filteredSellers[0].location,
            coordinate_source: filteredSellers[0].coordinate_source,
            location_type: filteredSellers[0].location_type,
          }
        : null,
      distanceFilter,
      sortedUsersLength: sortedUsers.length,
    });
    return nearby;
  }, [filteredSellers, sellers.length, currentLocation]);

  const sellersWithoutLocation = useMemo(() => {
    // Only include sellers who truly have no location data (no coordinates AND no location text)
    const withoutLocation = filteredSellers.filter(
      (seller) => !seller.coordinates && !seller.location
    );
    console.log("🔍 DEBUG - Sellers without location:", {
      count: withoutLocation.length,
      sellers: withoutLocation.map((s) => ({
        name: s.name,
        hasCoords: !!s.coordinates,
        hasLocation: !!s.location,
      })),
    });
    return withoutLocation;
  }, [filteredSellers]);

  if (sellers.length === 0) {
    return (
      <Card className={`text-center py-4 ${className}`}>
        <Card.Body>
          <i
            className="ti-user text-muted mb-3"
            style={{ fontSize: "2.5rem" }}
          ></i>
          <h6 className="text-muted mb-2">No Members Selling Products</h6>
          <p className="text-muted small mb-0">
            No community members are currently offering products for sale.
          </p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Location Detection Section */}
      {showLocationPrompt && !currentLocation && (
        <div className="bg-light border rounded-3 p-4 mb-4">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                <i
                  className="ti-location-pin text-primary"
                  style={{ fontSize: "1.2rem" }}
                ></i>
              </div>
              <div>
                <h6 className="mb-1 fw-semibold">Find Nearby Members</h6>
                <p className="mb-0 text-muted small">
                  {locationLoading
                    ? "Detecting your location to show nearby members..."
                    : "Allow location access to see members who sell products sorted by distance from you."}
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleGetLocation}
              disabled={locationLoading}
              className="rounded-pill px-3"
            >
              {locationLoading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Detecting...
                </>
              ) : (
                <>
                  <i className="ti-target me-2"></i>
                  Get Location
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {locationError && (
        <div className="bg-warning bg-opacity-10 border border-warning rounded-3 p-3 mb-4">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <i className="ti-alert-triangle text-warning me-2"></i>
              <span className="text-warning fw-medium">{locationError}</span>
            </div>
            <Button
              variant="link"
              size="sm"
              className="text-warning p-0"
              onClick={() => setLocationError(null)}
            >
              <i className="ti-close"></i>
            </Button>
          </div>
        </div>
      )}

      {/* Sellers List Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h5 className="mb-1 fw-semibold">
            <i className="ti-shopping-cart me-2 text-success"></i>
            Members Selling Products
          </h5>
          <p className="mb-0 text-muted small">
            {filteredSellers.length} of {sellers.length} members
            {currentLocation && nearbySellers.length > 0 && (
              <> • {nearbySellers.length} with location</>
            )}
          </p>
        </div>

        <div className="d-flex align-items-center gap-3">
          {/* Distance Filter */}
          {currentLocation && (
            <Dropdown align="end">
              <Dropdown.Toggle
                variant="outline-secondary"
                size="sm"
                className="d-flex align-items-center gap-2 border-0 shadow-sm"
                style={{
                  minWidth: "140px",
                  backgroundColor: "white",
                  color: "#495057",
                  border: "1px solid #dee2e6",
                }}
              >
                <i className="ti-filter text-primary"></i>
                <span className="text-nowrap fw-medium">
                  {distanceOptions.find((opt) => opt.value === distanceFilter)
                    ?.label || "All Distances"}
                </span>
              </Dropdown.Toggle>

              <Dropdown.Menu
                className="shadow border-0"
                style={{ minWidth: "160px" }}
              >
                {distanceOptions.map((option) => (
                  <Dropdown.Item
                    key={option.value}
                    onClick={() => setDistanceFilter(option.value)}
                    className="d-flex align-items-center gap-2 py-2"
                    active={distanceFilter === option.value}
                  >
                    <i
                      className={`ti-${
                        option.value === "all" ? "world" : "target"
                      } text-muted`}
                    ></i>
                    <span>{option.label}</span>
                    {distanceFilter === option.value && (
                      <i className="ti-check ms-auto text-primary"></i>
                    )}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          )}

          {nearbySellers.length > 0 && onShowMap && (
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => onShowMap(nearbySellers, currentLocation)}
              className="rounded-pill"
            >
              <i className="ti-map me-2"></i>
              View on Map
            </Button>
          )}
        </div>
      </div>

      {filteredSellers.length === 0 ? (
        <Card className="text-center py-5 shadow-sm">
          <Card.Body>
            <div className="text-muted">
              <i className="ti-search mb-3" style={{ fontSize: "2.5rem" }}></i>
              <h6 className="mb-2">No members found in selected range</h6>
              <p className="small mb-0">
                Try increasing the distance filter or check back later for
                members selling products.
              </p>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr>
                <th>Member</th>
                <th>Distance</th>
                <th>Products</th>
                <th>Rating</th>
                <th>Location</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Nearby Sellers (with location) */}
              {nearbySellers.map((seller) => (
                <tr key={seller.id}>
                  <td>
                    <UserProfilePopover user={seller}>
                      <div className="d-flex align-items-center">
                        <UserAvatar
                          user={{
                            name: seller.name,
                            image: seller.avatar_url,
                          }}
                          size={48}
                          className="me-3 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <div className="fw-bold text-truncate fs-6 text-primary">
                              {seller.name}
                            </div>
                            <Badge bg="success" className="small">
                              Sells Products
                            </Badge>
                          </div>
                          <small className="text-muted">
                            {seller.farm_name || "Community Member"}
                          </small>
                        </div>
                      </div>
                    </UserProfilePopover>
                  </td>
                  <td className="align-middle">
                    {seller.distance !== null ? (
                      <div className="d-flex align-items-center">
                        {seller.distance < 1 ? (
                          <span className="d-flex align-items-center gap-1 text-success fw-semibold">
                            <i
                              className="ti ti-navigation"
                              style={{ fontSize: "0.9rem" }}
                            ></i>
                            {formatDistance(seller.distance)}
                          </span>
                        ) : seller.distance < 5 ? (
                          <span className="d-flex align-items-center gap-1 text-primary fw-semibold">
                            <i
                              className="ti ti-map-pin"
                              style={{ fontSize: "0.9rem" }}
                            ></i>
                            {formatDistance(seller.distance)}
                          </span>
                        ) : seller.distance < 15 ? (
                          <span className="d-flex align-items-center gap-1 text-warning fw-semibold">
                            <i
                              className="ti ti-route"
                              style={{ fontSize: "0.9rem" }}
                            ></i>
                            {formatDistance(seller.distance)}
                          </span>
                        ) : (
                          <span className="d-flex align-items-center gap-1 text-muted fw-semibold">
                            <i
                              className="ti ti-map-2"
                              style={{ fontSize: "0.9rem" }}
                            ></i>
                            {formatDistance(seller.distance)}
                          </span>
                        )}
                      </div>
                    ) : seller.location ? (
                      <div className="d-flex align-items-center">
                        <span
                          className="text-muted small d-flex align-items-center gap-1"
                          title="Location format not supported for distance calculation"
                        >
                          <i
                            className="ti ti-help-circle"
                            style={{ fontSize: "0.9rem" }}
                          ></i>
                          Can't calculate
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted small">N/A</span>
                    )}
                  </td>
                  <td className="align-middle">
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-semibold text-primary">
                        {seller.product_count}
                      </span>
                      <small className="text-muted">products</small>
                    </div>
                  </td>
                  <td className="align-middle">
                    {seller.average_rating > 0 ? (
                      <Badge bg="warning" className="small">
                        ⭐ {seller.average_rating.toFixed(1)}
                      </Badge>
                    ) : (
                      <span className="text-muted small">No ratings</span>
                    )}
                  </td>
                  <td className="align-middle" style={{ maxWidth: "200px" }}>
                    <small className="text-muted">
                      {seller.location ? (
                        isMapLink(seller.location) ? (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 text-decoration-none text-success fw-medium text-start"
                            onClick={() => {
                              // Use updated coordinates if available, otherwise fall back to original location
                              console.log(
                                "🔍 DEBUG - Location click for:",
                                seller.name,
                                {
                                  hasCoordinates: !!seller.coordinates,
                                  coordinates: seller.coordinates,
                                  originalLocation: seller.location,
                                }
                              );

                              // Use stored coordinates if available (more reliable than short URLs)
                              if (seller.coordinates) {
                                // Create a Google Maps URL that shows the business name and location
                                // Use the most reliable Google Maps URL format
                                const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(
                                  seller.name +
                                    " " +
                                    seller.coordinates.lat +
                                    "," +
                                    seller.coordinates.lon
                                )}`;
                                console.log(
                                  "🗺️ Opening with business name and coordinates:",
                                  mapsUrl
                                );
                                window.open(mapsUrl, "_blank");
                              } else if (seller.location) {
                                // Fallback to original URL if no coordinates
                                console.log(
                                  "🗺️ Fallback to original URL:",
                                  seller.location
                                );
                                window.open(seller.location, "_blank");
                              } else {
                                console.log("⚠️ No location data available");
                              }
                            }}
                          >
                            <i className="ti-location-pin me-1"></i>
                            {getLocationDisplayText(seller.location, true)}
                          </Button>
                        ) : (
                          <>
                            <i className="ti-location-pin me-1"></i>
                            <span
                              className="d-inline-block text-truncate"
                              style={{ maxWidth: "150px" }}
                            >
                              {seller.location}
                            </span>
                          </>
                        )
                      ) : (
                        "N/A"
                      )}
                    </small>
                  </td>
                  <td className="align-middle text-end">
                    <div className="d-flex gap-1 justify-content-end">
                      <Button
                        variant={
                          seller.product_count > 0
                            ? "primary"
                            : "outline-secondary"
                        }
                        size="sm"
                        onClick={() =>
                          window.open(`/users/${seller.id}/listings`, "_blank")
                        }
                        disabled={seller.product_count === 0}
                      >
                        <i className="ti-package me-1"></i>
                        {seller.product_count > 0
                          ? "View Products"
                          : "No Products"}
                      </Button>
                      {seller.whatsapp_store_link && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() =>
                            window.open(seller.whatsapp_store_link, "_blank")
                          }
                        >
                          <i className="ti-mobile me-1"></i>
                          WhatsApp
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {/* Sellers without location */}
              {sellersWithoutLocation.length > 0 && (
                <>
                  <tr>
                    <td colSpan={6} className="bg-light">
                      <small className="text-muted fw-medium">
                        <i className="ti-info me-2"></i>
                        Members without location data
                      </small>
                    </td>
                  </tr>
                  {sellersWithoutLocation.map((seller) => (
                    <tr key={seller.id}>
                      <td>
                        <UserProfilePopover user={seller}>
                          <div className="d-flex align-items-center">
                            <UserAvatar
                              user={{
                                name: seller.name,
                                image: seller.avatar_url,
                              }}
                              size={48}
                              className="me-3 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <div className="fw-bold text-truncate fs-6 text-primary">
                                  {seller.name}
                                </div>
                                <Badge bg="success" className="small">
                                  Sells Products
                                </Badge>
                              </div>
                              <small className="text-muted">
                                {seller.farm_name || "Community Member"}
                              </small>
                            </div>
                          </div>
                        </UserProfilePopover>
                      </td>
                      <td>
                        <span
                          className="text-muted small"
                          title="Location format not supported for distance calculation"
                        >
                          <i className="ti-info me-1"></i>
                          Can't calculate
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-semibold text-primary">
                            {seller.product_count}
                          </span>
                          <small className="text-muted">products</small>
                        </div>
                      </td>
                      <td>
                        {seller.average_rating > 0 ? (
                          <Badge bg="warning" className="small">
                            ⭐ {seller.average_rating.toFixed(1)}
                          </Badge>
                        ) : (
                          <span className="text-muted small">No ratings</span>
                        )}
                      </td>
                      <td>
                        <small className="text-muted">
                          Location not specified
                        </small>
                      </td>
                      <td className="text-end">
                        <div className="d-flex gap-1 justify-content-end">
                          <Button
                            variant={
                              seller.product_count > 0
                                ? "primary"
                                : "outline-secondary"
                            }
                            size="sm"
                            onClick={() =>
                              window.open(
                                `/users/${seller.id}/listings`,
                                "_blank"
                              )
                            }
                            disabled={seller.product_count === 0}
                          >
                            <i className="ti-package me-1"></i>
                            {seller.product_count > 0
                              ? "View Products"
                              : "No Products"}
                          </Button>
                          {seller.whatsapp_store_link && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() =>
                                window.open(
                                  seller.whatsapp_store_link,
                                  "_blank"
                                )
                              }
                            >
                              <i className="ti-mobile me-1"></i>
                              WhatsApp
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Footer Stats */}
      {filteredSellers.length > 0 && (
        <div className="mt-4 p-3 bg-light rounded-3">
          <Row className="text-center text-sm-start">
            <Col xs={12} sm={6}>
              <small className="text-muted">
                <i className="ti-users me-1"></i>
                {filteredSellers.length} members shown
                {currentLocation && nearbySellers.length > 0 && (
                  <> • {nearbySellers.length} with distance</>
                )}
              </small>
            </Col>
            <Col xs={12} sm={6} className="text-sm-end mt-2 mt-sm-0">
              <small className="text-muted">
                <i className="ti-heart me-1 text-success"></i>
                Supporting local natural farming
              </small>
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
}
