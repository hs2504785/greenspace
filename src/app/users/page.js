"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Form,
  Badge,
  Button,
  Nav,
  Tab,
} from "react-bootstrap";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/common/UserAvatar";
import UserProfilePopover from "@/components/common/UserProfilePopover";
import SearchInput from "@/components/common/SearchInput";
import ClearFiltersButton from "@/components/common/ClearFiltersButton";
import NearbySellersList from "@/components/features/users/NearbySellersList";
import SellersMapModal from "@/components/features/users/SellersMapModal";
import {
  isMapLink,
  getLocationDisplayText,
  openMapLink,
} from "@/utils/locationUtils";

export default function PublicUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [userCounts, setUserCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapSellers, setMapSellers] = useState([]);
  const [mapCurrentLocation, setMapCurrentLocation] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search term, location filter, and active tab
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.farm_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLocation =
      locationFilter === "all" ||
      (locationFilter === "with_location" && user.location) ||
      (locationFilter === "without_location" && !user.location);

    const matchesTab =
      activeTab === "all" || (activeTab === "sellers" && user.is_seller);

    return matchesSearch && matchesLocation && matchesTab;
  });

  // Get counts for different categories
  const allCount = users.length;
  const sellersCount = users.filter((u) => u.is_seller).length;

  const fetchUsers = async () => {
    try {
      const usersResponse = await fetch("/api/users");

      if (!usersResponse.ok) throw new Error("Failed to fetch users");

      const usersData = await usersResponse.json();
      setUsers(usersData || []);

      // Create user counts map from the enhanced API response
      const countsMap = {};
      usersData.forEach((user) => {
        countsMap[user.id] = user.product_count || 0;
      });
      setUserCounts(countsMap);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowMap = (sellers, currentLocation = null) => {
    setMapSellers(sellers);
    setMapCurrentLocation(currentLocation);
    setShowMapModal(true);
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading community members...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="pb-3 py-md-3">
      {/* Header Section */}
      <div className="mb-4">
        <Row className="g-3 align-items-start">
          <Col xs={12}>
            <div className="text-center text-md-start mb-3 mb-md-0">
              <div className="d-flex align-items-center justify-content-center justify-content-md-start flex-wrap gap-3 mb-2">
                <h1 className="h3 mb-0 lh-1">
                  <i className="ti-user me-2 text-success"></i>
                  Community Members
                </h1>
                <div className="d-flex flex-wrap gap-2">
                  <Badge bg="info" className="small px-2 py-1">
                    <i className="ti-user me-1"></i>
                    {allCount} Members
                  </Badge>
                  <Badge bg="success" className="small px-2 py-1">
                    <i className="ti-shopping-cart me-1"></i>
                    {sellersCount} Sellers
                  </Badge>
                  <Badge bg="warning" className="small px-2 py-1">
                    <i className="ti-location-pin me-1"></i>
                    {users.filter((u) => u.location).length} With Location
                  </Badge>
                </div>
              </div>
              <p className="text-muted mb-0">
                Discover and connect with our growing community of natural food
                enthusiasts, farmers, and local producers. Find nearby members
                who sell products, view their listings, or visit their WhatsApp
                stores.
              </p>
            </div>
          </Col>
        </Row>
      </div>

      {/* Tabs Navigation */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-light">
          <Nav variant="tabs" activeKey={activeTab} onSelect={setActiveTab}>
            <Nav.Item>
              <Nav.Link eventKey="all">
                <i className="ti-user me-2"></i>
                All Members
                <Badge bg="secondary" className="ms-2">
                  {allCount}
                </Badge>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="sellers">
                <i className="ti-map me-2"></i>
                Find Nearby Sellers
                <Badge bg="success" className="ms-2">
                  {sellersCount}
                </Badge>
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Card.Header>

        {/* Search and Filter Controls */}
        <Card.Body className="py-3">
          <Row className="g-3 align-items-end">
            <Col xs={12} md={6}>
              <Form.Group className="mb-0">
                <Form.Label className="small fw-medium text-muted mb-2">
                  Search Members
                </Form.Label>
                <SearchInput
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClear={() => setSearchTerm("")}
                  placeholder={
                    activeTab === "sellers"
                      ? "Search members who sell by name, farm, or location..."
                      : "Search by name or location..."
                  }
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Form.Group className="mb-0">
                <Form.Label className="small fw-medium text-muted mb-2">
                  Filter by Location
                </Form.Label>
                <Form.Select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                >
                  <option value="all">All Members</option>
                  <option value="with_location">With Location</option>
                  <option value="without_location">Location Not Set</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <ClearFiltersButton
                onClick={() => {
                  setSearchTerm("");
                  setLocationFilter("all");
                }}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tab Content */}
      {activeTab === "sellers" ? (
        <NearbySellersList users={filteredUsers} onShowMap={handleShowMap} />
      ) : (
        /* All Members and Consumers Table */
        <Card className="shadow-sm">
          <div className="table-responsive">
            <Table hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th
                    className="border-0 ps-3"
                    style={{ minWidth: "140px", maxWidth: "160px" }}
                  >
                    Member
                    <small className="text-muted d-block fw-normal">
                      Click for profile & contact info
                    </small>
                  </th>
                  <th
                    className="border-0"
                    style={{
                      width: "250px",
                      minWidth: "200px",
                      maxWidth: "250px",
                    }}
                  >
                    Location
                  </th>
                  <th className="border-0" style={{ minWidth: "120px" }}>
                    Joined
                  </th>
                  <th
                    className="border-0 text-center"
                    style={{ minWidth: "120px" }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="ps-3">
                        <UserProfilePopover user={user}>
                          <div className="d-flex align-items-center">
                            <UserAvatar
                              user={{
                                name: user.name,
                                image: user.avatar_url,
                              }}
                              size={48}
                              className="me-3 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <div className="fw-bold text-truncate fs-6 text-primary">
                                  {user.name}
                                </div>
                                {user.is_seller && (
                                  <Badge bg="success" className="small">
                                    Seller
                                  </Badge>
                                )}
                                {user.average_rating > 0 && (
                                  <Badge bg="warning" className="small">
                                    ⭐ {user.average_rating.toFixed(1)}
                                  </Badge>
                                )}
                              </div>
                              <small className="text-muted">
                                Community Member
                                {user.is_seller && " • Sells Products"} • Click
                                for details
                                {user.whatsapp_store_link &&
                                  " • Has WhatsApp Store"}
                                {user.farm_name && <> • {user.farm_name}</>}
                              </small>
                            </div>
                          </div>
                        </UserProfilePopover>
                      </td>
                      <td style={{ maxWidth: "250px" }}>
                        {user.location ? (
                          <div
                            className="d-flex align-items-center"
                            style={{ minWidth: 0 }}
                          >
                            <div
                              className="flex-grow-1"
                              style={{ minWidth: 0 }}
                            >
                              {isMapLink(user.location) ? (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 text-decoration-none text-success fw-medium text-start"
                                  onClick={() => openMapLink(user.location)}
                                  title={`Click to open location in map: ${user.location}`}
                                  style={{
                                    maxWidth: "100%",
                                    whiteSpace: "normal",
                                    lineHeight: "1.2",
                                  }}
                                >
                                  {getLocationDisplayText(user.location, false)}
                                </Button>
                              ) : (
                                <span
                                  className="d-block text-muted"
                                  title={user.location}
                                  style={{
                                    maxWidth: "100%",
                                    whiteSpace: "normal",
                                    wordBreak: "break-word",
                                    lineHeight: "1.2",
                                  }}
                                >
                                  {user.location}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-muted">
                            <span className="small">Not specified</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div>
                          <small className="text-muted d-block">
                            {new Date(user.created_at).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </small>
                          <small className="text-muted">
                            {(() => {
                              const joinDate = new Date(user.created_at);
                              const now = new Date();
                              const diffTime = Math.abs(now - joinDate);
                              const diffDays = Math.ceil(
                                diffTime / (1000 * 60 * 60 * 24)
                              );

                              if (diffDays <= 7) {
                                return "New member";
                              } else if (diffDays <= 30) {
                                return "Recent member";
                              } else if (diffDays <= 90) {
                                return "Active member";
                              } else {
                                return "Established member";
                              }
                            })()}
                          </small>
                        </div>
                      </td>
                      <td className="text-center">
                        <div className="d-flex flex-column gap-1">
                          <Button
                            variant={
                              user.product_count > 0
                                ? "primary"
                                : "outline-secondary"
                            }
                            size="sm"
                            onClick={() =>
                              router.push(`/users/${user.id}/listings`)
                            }
                            title={`View ${
                              user.product_count || 0
                            } product listings from ${user.name}`}
                            disabled={user.product_count === 0}
                          >
                            <i className="ti-package me-2"></i>
                            {user.product_count > 0
                              ? `View ${user.product_count} Products`
                              : "No Products"}
                          </Button>

                          {user.whatsapp_store_link && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() =>
                                window.open(user.whatsapp_store_link, "_blank")
                              }
                              title={`Visit ${user.name}'s WhatsApp Store`}
                            >
                              <i className="ti-mobile me-2"></i>
                              WhatsApp Store
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-5">
                      <div className="text-muted">
                        <i
                          className="ti-search mb-3"
                          style={{ fontSize: "2.5rem" }}
                        ></i>
                        <h6 className="mb-2">
                          No{" "}
                          {activeTab === "sellers"
                            ? "members who sell"
                            : "members"}{" "}
                          found matching your criteria
                        </h6>
                        <p className="small mb-0">
                          Try adjusting your search terms or filters
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {/* Footer with stats */}
          {filteredUsers.length > 0 && (
            <Card.Footer className="bg-light">
              <Row className="text-center text-sm-start">
                <Col xs={12} sm={6}>
                  <small className="text-muted">
                    Showing {filteredUsers.length} of{" "}
                    {activeTab === "sellers" ? sellersCount : allCount}{" "}
                    {activeTab === "sellers" ? "members who sell" : "members"}
                  </small>
                </Col>
                <Col xs={12} sm={6} className="text-sm-end mt-2 mt-sm-0">
                  <small className="text-muted">
                    <i className="ti-star me-1 text-success"></i>
                    Growing our sustainable community together
                  </small>
                </Col>
              </Row>
            </Card.Footer>
          )}
        </Card>
      )}

      {/* Welcome message for empty state */}
      {users.length === 0 && !loading && (
        <Card className="text-center py-5">
          <Card.Body>
            <i
              className="ti-user text-muted mb-3"
              style={{ fontSize: "3rem" }}
            ></i>
            <h5 className="text-muted mb-3">Welcome to Our Community!</h5>
            <p className="text-muted mb-0">
              Be among the first to join our growing network of natural food
              enthusiasts and local producers.
            </p>
          </Card.Body>
        </Card>
      )}

      {/* Sellers Map Modal */}
      <SellersMapModal
        show={showMapModal}
        onHide={() => setShowMapModal(false)}
        sellers={mapSellers}
        currentLocation={mapCurrentLocation}
      />
    </Container>
  );
}
