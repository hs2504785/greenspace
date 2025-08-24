"use client";

import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Form, Badge } from "react-bootstrap";
import UserAvatar from "@/components/common/UserAvatar";
import UserProfilePopover from "@/components/common/UserProfilePopover";
import SearchInput from "@/components/common/SearchInput";
import ClearFiltersButton from "@/components/common/ClearFiltersButton";

export default function PublicUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search term and location filter
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLocation =
      locationFilter === "all" ||
      (locationFilter === "with_location" && user.location) ||
      (locationFilter === "without_location" && !user.location);

    return matchesSearch && matchesLocation;
  });

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
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
                  <i className="ti ti-users me-2 text-success"></i>
                  Community Members
                </h1>
                <div className="d-flex flex-wrap gap-2">
                  <Badge bg="info" className="small px-2 py-1">
                    <i className="ti ti-users me-1"></i>
                    {users.length} Members
                  </Badge>
                  <Badge bg="success" className="small px-2 py-1">
                    <i className="ti ti-map-pin me-1"></i>
                    {users.filter((u) => u.location).length} With Location
                  </Badge>
                </div>
              </div>
              <p className="text-muted mb-0">
                Discover and connect with our growing community of natural food
                enthusiasts, farmers, and local producers. Click on any member
                to view their contact information.
              </p>
            </div>
          </Col>
        </Row>
      </div>

      {/* Search and Filter Controls */}
      <Card className="shadow-sm mb-4">
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
                  placeholder="Search by name or location..."
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

      {/* Users Table */}
      <Card className="shadow-sm">
        <div className="table-responsive">
          <Table hover className="mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th className="border-0 ps-3" style={{ minWidth: "200px" }}>
                  Member
                  <small className="text-muted d-block fw-normal">
                    Click for profile & contact info
                  </small>
                </th>
                <th className="border-0" style={{ minWidth: "200px" }}>
                  Location
                </th>
                <th className="border-0" style={{ minWidth: "120px" }}>
                  Joined
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
                            <div className="fw-bold text-truncate fs-6 text-primary">
                              {user.name}
                              <i className="ti ti-external-link ms-1 small"></i>
                            </div>
                            <small className="text-muted">
                              Community Member • Click for details
                            </small>
                          </div>
                        </div>
                      </UserProfilePopover>
                    </td>
                    <td>
                      {user.location ? (
                        <div className="d-flex align-items-center">
                          <i className="ti ti-map-pin me-2 text-success flex-shrink-0"></i>
                          <span className="text-truncate">{user.location}</span>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center text-muted">
                          <i className="ti ti-map-pin me-2 flex-shrink-0"></i>
                          <span>Location not specified</span>
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center py-5">
                    <div className="text-muted">
                      <i
                        className="ti ti-search mb-3"
                        style={{ fontSize: "2.5rem" }}
                      ></i>
                      <h6 className="mb-2">
                        No members found matching your criteria
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
                  Showing {filteredUsers.length} of {users.length} community
                  members
                </small>
              </Col>
              <Col xs={12} sm={6} className="text-sm-end mt-2 mt-sm-0">
                <small className="text-muted">
                  <i className="ti ti-leaf me-1 text-success"></i>
                  Growing our sustainable community together
                </small>
              </Col>
            </Row>
          </Card.Footer>
        )}
      </Card>

      {/* Welcome message for empty state */}
      {users.length === 0 && !loading && (
        <Card className="text-center py-5">
          <Card.Body>
            <i
              className="ti ti-users text-muted mb-3"
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
    </Container>
  );
}
