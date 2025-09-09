"use client";

import { Container, Row, Col, Card, Button, Badge } from "react-bootstrap";
import Link from "next/link";
import AdminGuard from "@/components/common/AdminGuard";
import GoogleMapsUsageMonitor from "@/components/admin/GoogleMapsUsageMonitor";
import useUserRole from "@/hooks/useUserRole";

export default function AdminDashboard() {
  const { isSuperAdmin } = useUserRole();
  return (
    <AdminGuard requiredRole="admin">
      <Container className="py-4">
        <div className="mb-4">
          <div className="d-flex align-items-center gap-3 mb-2">
            <div className="bg-danger bg-opacity-10 p-2 rounded">
              <i
                className="ti-shield text-danger"
                style={{ fontSize: "1.5rem" }}
              ></i>
            </div>
            <div>
              <h1 className="h3 mb-0">Admin Dashboard</h1>
              <p className="text-muted mb-0">
                System management and monitoring
              </p>
            </div>
          </div>
        </div>

        <Row className="g-4">
          {/* Google Maps Usage Monitor */}
          <Col lg={8}>
            <GoogleMapsUsageMonitor />
          </Col>

          {/* Quick Actions */}
          <Col lg={4}>
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-light">
                <div className="d-flex align-items-center gap-2">
                  <i className="ti-bolt text-warning"></i>
                  <strong>Quick Actions</strong>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  {isSuperAdmin && (
                    <Link
                      href="/admin/users"
                      className="btn btn-outline-primary text-start"
                    >
                      <i className="ti-users me-2"></i>
                      <span>
                        <strong>Manage Users</strong>
                        <br />
                        <small className="text-muted">
                          User accounts & roles
                        </small>
                      </span>
                    </Link>
                  )}
                  <Link
                    href="/admin/seller-requests"
                    className="btn btn-outline-success text-start"
                  >
                    <i className="ti-clipboard me-2"></i>
                    <span>
                      <strong>Seller Requests</strong>
                      <br />
                      <small className="text-muted">Review applications</small>
                    </span>
                  </Link>
                  <Link
                    href="/admin/seller-verification"
                    className="btn btn-outline-info text-start"
                  >
                    <i className="ti-shield me-2"></i>
                    <span>
                      <strong>Seller Verification</strong>
                      <br />
                      <small className="text-muted">Verify seller status</small>
                    </span>
                  </Link>
                  <Link
                    href="/farm-dashboard"
                    className="btn btn-outline-warning text-start"
                  >
                    <i className="ti-home me-2"></i>
                    <span>
                      <strong>Farm Dashboard</strong>
                      <br />
                      <small className="text-muted">Manage farm layout</small>
                    </span>
                  </Link>
                </div>
              </Card.Body>
            </Card>

            {/* System Status */}
            <Card className="shadow-sm">
              <Card.Header className="bg-light">
                <div className="d-flex align-items-center gap-2">
                  <i className="ti-pulse text-success"></i>
                  <strong>System Status</strong>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="small">
                  <div className="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                    <span>
                      <i className="ti-map me-2 text-primary"></i>
                      Maps Service
                    </span>
                    <Badge bg="success">
                      <i className="ti-check me-1"></i>
                      Active
                    </Badge>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                    <span>
                      <i className="ti-light-bulb me-2 text-info"></i>
                      AI Assistant
                    </span>
                    <Badge bg="success">
                      <i className="ti-check me-1"></i>
                      Active
                    </Badge>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                    <span>
                      <i className="ti-credit-card me-2 text-warning"></i>
                      Payment System
                    </span>
                    <Badge bg="success">
                      <i className="ti-check me-1"></i>
                      Active
                    </Badge>
                  </div>
                  <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded">
                    <span>
                      <i className="ti-mobile me-2 text-success"></i>
                      Mobile App
                    </span>
                    <Badge bg="success">
                      <i className="ti-check me-1"></i>
                      Active
                    </Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Admin Tools */}
          <Col lg={12}>
            <Card>
              <Card.Header>
                <strong>🔧 Admin Tools</strong>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={3}>
                    <Card className="text-center border-0 bg-light">
                      <Card.Body>
                        <i
                          className="ti-users text-primary"
                          style={{ fontSize: "2rem" }}
                        ></i>
                        <h6 className="mt-2 mb-1">User Management</h6>
                        <small className="text-muted">Manage all users</small>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="text-center border-0 bg-light">
                      <Card.Body>
                        <i
                          className="ti-shopping-cart text-success"
                          style={{ fontSize: "2rem" }}
                        ></i>
                        <h6 className="mt-2 mb-1">Orders</h6>
                        <small className="text-muted">Track all orders</small>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="text-center border-0 bg-light">
                      <Card.Body>
                        <i
                          className="ti-map text-info"
                          style={{ fontSize: "2rem" }}
                        ></i>
                        <h6 className="mt-2 mb-1">Maps Usage</h6>
                        <small className="text-muted">Monitor API usage</small>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="text-center border-0 bg-light">
                      <Card.Body>
                        <i
                          className="ti-settings text-warning"
                          style={{ fontSize: "2rem" }}
                        ></i>
                        <h6 className="mt-2 mb-1">System Settings</h6>
                        <small className="text-muted">Configure system</small>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </AdminGuard>
  );
}
