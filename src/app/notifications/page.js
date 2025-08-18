"use client";

import { Container, Row, Col, Card } from "react-bootstrap";
import NotificationSettings from "@/components/features/notifications/NotificationSettings";

export default function NotificationsPage() {
  return (
    <Container fluid className="py-4">
      <Row className="justify-content-center">
        <Col lg={8} xl={6}>
          {/* Page Header */}
          <div className="text-center mb-4">
            <h2 className="h3 mb-2">
              <i className="ti ti-bell me-2 text-primary"></i>
              Notification Settings
            </h2>
            <p className="text-muted">
              Manage your notification preferences and stay updated with the
              latest from Arya Natural Farms
            </p>
          </div>

          {/* Notification Settings Component */}
          <NotificationSettings />

          {/* Additional Information Card */}
          <Card className="mt-4 border-0 bg-light">
            <Card.Body className="text-center py-3">
              <Row className="align-items-center">
                <Col md={4} className="mb-2 mb-md-0">
                  <div className="d-flex align-items-center justify-content-center justify-content-md-start">
                    <i
                      className="ti ti-shield-check text-success me-2"
                      style={{ fontSize: "1.5rem" }}
                    ></i>
                    <div className="text-start">
                      <strong className="d-block">Secure & Private</strong>
                      <small className="text-muted">
                        Your data is protected
                      </small>
                    </div>
                  </div>
                </Col>
                <Col md={4} className="mb-2 mb-md-0">
                  <div className="d-flex align-items-center justify-content-center">
                    <i
                      className="ti ti-device-mobile text-primary me-2"
                      style={{ fontSize: "1.5rem" }}
                    ></i>
                    <div className="text-start">
                      <strong className="d-block">Mobile Ready</strong>
                      <small className="text-muted">Works on all devices</small>
                    </div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="d-flex align-items-center justify-content-center justify-content-md-end">
                    <i
                      className="ti ti-clock text-warning me-2"
                      style={{ fontSize: "1.5rem" }}
                    ></i>
                    <div className="text-start">
                      <strong className="d-block">Real-time</strong>
                      <small className="text-muted">
                        Instant notifications
                      </small>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
