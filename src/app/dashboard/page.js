"use client";

import { useSession } from "next-auth/react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Alert,
  Spinner,
} from "react-bootstrap";
import Link from "next/link";
import useUserRole from "@/hooks/useUserRole";
import { redirect } from "next/navigation";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const {
    isSeller,
    isAdmin,
    isSuperAdmin,
    loading: roleLoading,
  } = useUserRole();

  if (status === "loading" || roleLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (!session) {
    redirect("/login");
  }

  return (
    <Container className="py-4">
      <div className="text-center mb-4">
        <h2>Welcome to Your Dashboard, {session.user.name?.split(" ")[0]}!</h2>
        <p className="text-muted lead">Your natural farming marketplace hub</p>
      </div>

      <Row>
        {/* Regular User Dashboard */}
        {!isSeller && !isAdmin && (
          <>
            <Col md={6} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center">
                  <div className="mb-3">
                    <i
                      className="ti-shopping-cart text-primary"
                      style={{ fontSize: "3rem" }}
                    ></i>
                  </div>
                  <Card.Title>🛒 Shop Fresh Produce</Card.Title>
                  <Card.Text>
                    Browse our collection of naturally grown vegetables from
                    local farmers.
                  </Card.Text>
                  <Link href="/" className="btn btn-primary">
                    Browse Vegetables
                  </Link>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center">
                  <div className="mb-3">
                    <i
                      className="ti-calendar text-info"
                      style={{ fontSize: "3rem" }}
                    ></i>
                  </div>
                  <Card.Title>📅 Pre-Book Products</Card.Title>
                  <Card.Text>
                    Reserve seasonal produce in advance from verified natural
                    farmers.
                  </Card.Text>
                  <Link href="/prebooking-marketplace" className="btn btn-info">
                    Explore Pre-Booking
                  </Link>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center">
                  <div className="mb-3">
                    <i
                      className="ti-layout-grid3 text-success"
                      style={{ fontSize: "3rem" }}
                    ></i>
                  </div>
                  <Card.Title>🌳 Farm Management</Card.Title>
                  <Card.Text>
                    Manage your farm layout, plant trees, and track growth with
                    our interactive grid system.
                  </Card.Text>
                  <div className="d-flex gap-2">
                    <Link href="/farm-dashboard" className="btn btn-success">
                      Farm Dashboard
                    </Link>
                    <Link
                      href="/farm-layout-fullscreen"
                      className="btn btn-outline-success"
                    >
                      <i className="bi bi-arrows-fullscreen me-1"></i>
                      Full Screen
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center">
                  <div className="mb-3">
                    <i
                      className="ti-package text-warning"
                      style={{ fontSize: "3rem" }}
                    ></i>
                  </div>
                  <Card.Title>📦 Track Orders</Card.Title>
                  <Card.Text>
                    View your order history and track current deliveries.
                  </Card.Text>
                  <Link href="/orders" className="btn btn-warning">
                    View Orders
                  </Link>
                </Card.Body>
              </Card>
            </Col>

            {/* Featured Become a Seller Card - Hidden as requested
            <Col md={6} className="mb-4">
              <Card className="h-100 border-success shadow-sm">
                <Card.Body className="text-center">
                  <div className="mb-3">
                    <i
                      className="ti-store text-success"
                      style={{ fontSize: "3rem" }}
                    ></i>
                  </div>
                  <Card.Title className="text-success">
                    🌱 Become a Seller
                  </Card.Title>
                  <Card.Text>
                    Join our community of natural farmers and sell your
                    chemical-free produce.
                  </Card.Text>
                  <Alert variant="success" className="small">
                    ✅ Open registration • 🌿 Natural farming verification • 💰
                    Direct sales
                  </Alert>
                  <Link href="/become-seller" className="btn btn-success">
                    <i className="ti-plus me-2"></i>
                    Apply to Sell
                  </Link>
                </Card.Body>
              </Card>
            </Col>
            */}
          </>
        )}

        {/* Seller Dashboard */}
        {isSeller && (
          <>
            <Col md={6} lg={4} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center">
                  <div className="mb-3">
                    <i
                      className="ti-package text-warning"
                      style={{ fontSize: "2.5rem" }}
                    ></i>
                  </div>
                  <Card.Title>📦 My Products</Card.Title>
                  <Card.Text>
                    Manage your product listings and inventory.
                  </Card.Text>
                  <Link href="/products-management" className="btn btn-warning">
                    Manage Products
                  </Link>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={4} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center">
                  <div className="mb-3">
                    <i
                      className="ti-dashboard text-success"
                      style={{ fontSize: "2.5rem" }}
                    ></i>
                  </div>
                  <Card.Title>📊 Orders Dashboard</Card.Title>
                  <Card.Text>View and manage incoming orders.</Card.Text>
                  <Link href="/seller-dashboard" className="btn btn-success">
                    View Orders
                  </Link>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={4} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center">
                  <div className="mb-3">
                    <i
                      className="ti-calendar text-info"
                      style={{ fontSize: "2.5rem" }}
                    ></i>
                  </div>
                  <Card.Title>📅 Pre-Booking</Card.Title>
                  <Card.Text>Manage pre-booking campaigns.</Card.Text>
                  <Link href="/prebooking-dashboard" className="btn btn-info">
                    Pre-Booking Dashboard
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          </>
        )}

        {/* Admin Dashboard */}
        {(isAdmin || isSuperAdmin) && (
          <>
            <div className="col-12 mb-4">
              <Alert variant="info">
                <Alert.Heading>👨‍💼 Admin Access</Alert.Heading>
                <p className="mb-0">
                  You have administrative privileges. Admin tools access via
                  direct URLs.
                </p>
              </Alert>
            </div>

            {/* Seller Verification Card - Hidden as requested
            <Col md={6} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center">
                  <div className="mb-3">
                    <i
                      className="ti-check text-warning"
                      style={{ fontSize: "2.5rem" }}
                    ></i>
                  </div>
                  <Card.Title>✅ Seller Verification</Card.Title>
                  <Card.Text>Review and approve seller applications.</Card.Text>
                  <Link
                    href="/admin/seller-verification"
                    className="btn btn-warning"
                  >
                    Review Applications
                  </Link>
                </Card.Body>
              </Card>
            </Col>
            */}

            {isSuperAdmin && (
              <Col md={6} className="mb-4">
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Body className="text-center">
                    <div className="mb-3">
                      <i
                        className="ti-settings text-danger"
                        style={{ fontSize: "2.5rem" }}
                      ></i>
                    </div>
                    <Card.Title>⚙️ User Management</Card.Title>
                    <Card.Text>Manage user accounts and permissions.</Card.Text>
                    <Link href="/admin/users" className="btn btn-danger">
                      Manage Users
                    </Link>
                  </Card.Body>
                </Card>
              </Col>
            )}
          </>
        )}
      </Row>

      {/* Quick Actions */}
      <Row className="mt-4">
        <Col>
          <Card className="border-0 bg-light">
            <Card.Body>
              <h5 className="card-title">🚀 Quick Actions</h5>
              <div className="d-flex flex-wrap gap-2">
                <Link
                  href="/profile"
                  className="btn btn-sm btn-outline-primary"
                >
                  <i className="ti-user me-1"></i>
                  Profile
                </Link>
                <Link
                  href="/my-prebookings"
                  className="btn btn-sm btn-outline-info"
                >
                  <i className="ti-bookmark me-1"></i>
                  My Pre-Bookings
                </Link>
                <Link
                  href="/users"
                  className="btn btn-sm btn-outline-secondary"
                >
                  <i className="ti-users me-1"></i>
                  Community
                </Link>
                {/* Become a Seller button - Hidden as requested
                {!isSeller && !isAdmin && (
                  <Link
                    href="/become-seller"
                    className="btn btn-sm btn-success"
                  >
                    <i className="ti-store me-1"></i>
                    Become a Seller
                  </Link>
                )}
                */}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
