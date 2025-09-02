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

  const handleGetLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);

    try {
      const location = await getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        setShowLocationPrompt(false);
        console.log("Current location detected:", location);
      } else {
        setLocationError(
          "Unable to detect your location. Please enable location services."
        );
      }
    } catch (error) {
      setLocationError("Failed to get your location. Please try again.");
      console.error("Location error:", error);
    } finally {
      setLocationLoading(false);
    }
  };

  // Filter sellers by distance - memoized for performance
  const filteredSellers = useMemo(() => {
    return distanceFilter === "all"
      ? sortedUsers
      : filterUsersByDistance(
          sortedUsers,
          distanceOptions.find((opt) => opt.value === distanceFilter)?.distance
        );
  }, [sortedUsers, distanceFilter, distanceOptions]);

  const nearbySellers = useMemo(() => {
    return filteredSellers.filter((seller) => seller.distance !== null);
  }, [filteredSellers]);

  const sellersWithoutLocation = useMemo(() => {
    return filteredSellers.filter((seller) => seller.distance === null);
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
                  Allow location access to see members who sell products sorted
                  by distance from you.
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

      {/* Distance Filter */}
      {currentLocation && (
        <Card className="mb-4">
          <Card.Body className="py-3">
            <Row className="align-items-center">
              <Col xs={12} md={6}>
                <div className="d-flex align-items-center">
                  <i className="ti-location-pin text-success me-2"></i>
                  <div>
                    <span className="small text-muted">
                      Location detected • Showing distances to members
                    </span>
                    <br />
                    <small className="text-muted">
                      <i className="ti-info me-1"></i>
                      Some locations can't show distance (Google Maps links,
                      city names)
                    </small>
                  </div>
                </div>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-0">
                  <Form.Label className="small fw-medium text-muted mb-1">
                    Distance Filter
                  </Form.Label>
                  <Form.Select
                    size="sm"
                    value={distanceFilter}
                    onChange={(e) => setDistanceFilter(e.target.value)}
                  >
                    {distanceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>
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
        {nearbySellers.length > 0 && onShowMap && (
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => onShowMap(nearbySellers)}
            className="rounded-pill"
          >
            <i className="ti-map me-2"></i>
            View on Map
          </Button>
        )}
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
                  <td>
                    {seller.distance !== null ? (
                      <Badge bg="success" className="small">
                        <i className="ti-direction me-1"></i>
                        {formatDistance(seller.distance)}
                      </Badge>
                    ) : seller.location ? (
                      <span
                        className="text-muted small"
                        title="Location format not supported for distance calculation"
                      >
                        <i className="ti-info me-1"></i>
                        Can't calculate
                      </span>
                    ) : (
                      <span className="text-muted small">N/A</span>
                    )}
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
                  <td style={{ maxWidth: "200px" }}>
                    <small className="text-muted">
                      {seller.location ? (
                        isMapLink(seller.location) ? (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 text-decoration-none text-success fw-medium text-start"
                            onClick={() => openMapLink(seller.location)}
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
