"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Card,
  Button,
  Badge,
  Alert,
  Spinner,
} from "react-bootstrap";
import { useUserVegetables } from "@/hooks/useUserVegetables";
import VegetableFilterOffcanvas from "@/components/features/VegetableFilterOffcanvas";
import VegetableResults from "@/components/features/VegetableResults";
import UserAvatar from "@/components/common/UserAvatar";
import {
  isMapLink,
  getLocationDisplayText,
  openMapLink,
} from "@/utils/locationUtils";

export default function UserListingsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id;

  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Use the same vegetables hook pattern as main page
  const {
    vegetables,
    loading,
    error,
    totalCount,
    filters,
    updateFilters,
    refresh,
  } = useUserVegetables(userId);

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const fetchUser = async () => {
    try {
      setUserLoading(true);
      setUserError(null);

      const response = await fetch(`/api/users/${userId}/contact`);
      if (!response.ok) throw new Error("Failed to fetch user data");

      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error("Error fetching user:", error);
      setUserError("Failed to load user information.");
    } finally {
      setUserLoading(false);
    }
  };

  const handleWhatsAppContact = () => {
    if (user?.whatsapp_number) {
      const message = encodeURIComponent(
        `Hi ${user.name}, I'm interested in your products listed on the community platform.`
      );
      window.open(
        `https://wa.me/${user.whatsapp_number.replace(
          /\D/g,
          ""
        )}?text=${message}`,
        "_blank"
      );
    }
  };

  // Listen for filter toggle events (same as main page)
  useEffect(() => {
    const handleToggleFilters = () => {
      setShowFilters(true);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("toggle-vegetable-filters", handleToggleFilters);
      return () => {
        window.removeEventListener(
          "toggle-vegetable-filters",
          handleToggleFilters
        );
      };
    }
  }, []);

  // Listen for search events from header (same as main page)
  useEffect(() => {
    const handleVegetableSearch = (event) => {
      const query = event.detail?.query || "";
      updateFilters({ searchQuery: query });
    };

    if (typeof window !== "undefined") {
      window.addEventListener("vegetable-search", handleVegetableSearch);
      return () => {
        window.removeEventListener("vegetable-search", handleVegetableSearch);
      };
    }
  }, [updateFilters]);

  if (userLoading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="success" />
          <p className="text-muted mt-3">Loading member information...</p>
        </div>
      </Container>
    );
  }

  if (userError || !user) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <Alert.Heading>User Not Found</Alert.Heading>
          <p>The requested user profile could not be found.</p>
          <Button
            variant="outline-warning"
            onClick={() => router.push("/users")}
          >
            View All Members
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <>
      {/* Main vegetables listing - same as home page */}
      <div className="container">
        <VegetableResults
          vegetables={vegetables}
          loading={loading}
          error={error}
        />
      </div>

      {/* User Details Card at Bottom */}
      {vegetables.length > 0 && (
        <Container className="mt-4 mb-4">
          <Card className="shadow-sm">
            <Card.Header className="bg-light">
              <div className="d-flex align-items-center justify-content-between">
                <h6 className="mb-0">
                  <i className="ti ti-user me-2"></i>
                  About This Seller
                </h6>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => router.back()}
                >
                  <i className="ti ti-arrow-left me-1"></i>
                  Back
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="row align-items-center">
                <div className="col-md-8">
                  <div className="d-flex align-items-center">
                    <UserAvatar
                      user={{
                        name: user.name,
                        image: user.avatar_url,
                      }}
                      size={64}
                      className="me-3 flex-shrink-0"
                    />
                    <div>
                      <h5 className="mb-1">{user.name}</h5>
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        <Badge bg="info" className="small">
                          <i className="ti ti-package me-1"></i>
                          {totalCount} Products
                        </Badge>
                        {user.location && (
                          <div className="d-flex align-items-center text-muted small">
                            <i className="ti ti-map-pin me-1 text-success"></i>
                            {isMapLink(user.location) ? (
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 text-decoration-none text-success fw-medium"
                                onClick={() => {
                                  console.log(
                                    "🔍 DEBUG - User listings location click for:",
                                    user.name,
                                    {
                                      hasCoordinates: !!user.coordinates,
                                      coordinates: user.coordinates,
                                      originalLocation: user.location,
                                    }
                                  );

                                  // Use stored coordinates if available (more reliable than short URLs)
                                  if (user.coordinates) {
                                    const mapsUrl = `https://www.google.com/maps/place/${encodeURIComponent(user.name)}/@${user.coordinates.lat},${user.coordinates.lon},17z`;
                                    console.log(
                                      "🗺️ Opening with stored coordinates:",
                                      mapsUrl
                                    );
                                    window.open(mapsUrl, "_blank");
                                  } else if (user.location) {
                                    // Fallback to original URL if no coordinates
                                    console.log(
                                      "🗺️ Fallback to original URL:",
                                      user.location
                                    );
                                    window.open(user.location, "_blank");
                                  } else {
                                    console.log(
                                      "⚠️ No location data available"
                                    );
                                  }
                                }}
                                title="Open location in map"
                              >
                                {getLocationDisplayText(user.location)}
                                <i className="ti ti-external-link ms-1 small"></i>
                              </Button>
                            ) : (
                              <span>{user.location}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-muted mb-0 small">
                        Community member since{" "}
                        {new Date(user.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 text-md-end mt-3 mt-md-0">
                  <div className="d-flex flex-column flex-md-row gap-2 justify-content-md-end">
                    {user.whatsapp_number && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={handleWhatsAppContact}
                      >
                        <i className="ti ti-brand-whatsapp me-1"></i>
                        WhatsApp
                      </Button>
                    )}
                    {user.whatsapp_store_link && (
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() =>
                          window.open(user.whatsapp_store_link, "_blank")
                        }
                        title="View WhatsApp Store"
                      >
                        <i className="ti ti-external-link me-1"></i>
                        Store
                      </Button>
                    )}
                    {user.phone && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        href={`tel:${user.phone}`}
                      >
                        <i className="ti ti-phone me-1"></i>
                        Call
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact CTA */}
              <div className="mt-3 pt-3 border-top text-center">
                <p className="text-muted small mb-2">
                  Interested in {user.name}'s products? Contact them directly to
                  place orders or ask questions.
                </p>
              </div>
            </Card.Body>
          </Card>
        </Container>
      )}

      {/* Filter Offcanvas - same as main page */}
      <VegetableFilterOffcanvas
        show={showFilters}
        onHide={() => setShowFilters(false)}
        filters={filters}
        onFilterChange={updateFilters}
        totalCount={totalCount}
      />
    </>
  );
}
