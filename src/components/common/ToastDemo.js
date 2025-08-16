"use client";

import React from "react";
import { Button, Card, Row, Col, Container } from "react-bootstrap";
import toastService from "@/utils/toastService";
import toast from "react-hot-toast";

/**
 * Toast Demo Component
 * Demonstrates all enhanced toast types and configurations
 * This component can be used for testing or as a reference
 */
export default function ToastDemo() {
  const handleSuccessToast = () => {
    console.log("Success button clicked");
    toastService.success("Operation completed successfully!");
  };

  const handleErrorToast = () => {
    console.log("Error button clicked");
    toastService.error("Something went wrong. Please try again.");
  };

  const handleWarningToast = () => {
    console.log("Warning button clicked");
    toastService.warning("Please review your input before proceeding.");
  };

  const handleInfoToast = () => {
    console.log("Info button clicked");
    toastService.info("Here's some helpful information for you.");
  };

  const handleLoadingToast = () => {
    const loadingToast = toastService.loading("Processing your request...");

    // Simulate an async operation
    setTimeout(() => {
      toastService.dismiss(loadingToast);
      toastService.success("Request processed successfully!");
    }, 3000);
  };

  const handlePromiseToast = () => {
    const mockPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        // Randomly resolve or reject for demo purposes
        if (Math.random() > 0.5) {
          resolve("Promise resolved successfully!");
        } else {
          reject(new Error("Promise failed!"));
        }
      }, 2000);
    });

    toastService.promise(mockPromise, {
      loading: "Processing promise...",
      success: (data) => `Success: ${data}`,
      error: (err) => `Error: ${err.message}`,
    });
  };

  const handleCustomToast = () => {
    toastService.custom("Custom styled toast message", {
      type: "info",
      title: "Custom Toast",
      description: "This is a custom toast with title and description.",
      duration: 6000,
      action: (
        <Button
          size="sm"
          variant="outline-light"
          onClick={() => toastService.dismissAll()}
        >
          Dismiss All
        </Button>
      ),
    });
  };

  const handlePresetToasts = () => {
    // Show different preset toasts with delay
    toastService.presets.loginSuccess();

    setTimeout(() => toastService.presets.orderSuccess(), 500);
    setTimeout(() => toastService.presets.productAdded(), 1000);
    setTimeout(() => toastService.presets.saveSuccess(), 1500);
  };

  return (
    <Container className="py-4">
      <Card>
        <Card.Header>
          <h3 className="mb-0">
            <i className="ti-announcement me-2"></i>
            Clean Toast Notifications Demo
          </h3>
        </Card.Header>
        <Card.Body>
          <p className="text-muted mb-4">
            Test all the clean, simple, and light toast notification types with
            minimal flat design.
          </p>

          <Row className="g-3">
            <Col md={6} lg={4}>
              <Card className="h-100 border-success">
                <Card.Body className="text-center">
                  <div className="mb-3">
                    <span className="badge bg-success fs-6">✓</span>
                  </div>
                  <h6 className="card-title">Success Toast</h6>
                  <p className="card-text text-muted small">
                    Clean light background with green accent
                  </p>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={handleSuccessToast}
                    className="w-100"
                  >
                    Show Success
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={4}>
              <Card className="h-100 border-danger">
                <Card.Body className="text-center">
                  <div className="mb-3">
                    <span className="badge bg-danger fs-6">✕</span>
                  </div>
                  <h6 className="card-title">Error Toast</h6>
                  <p className="card-text text-muted small">
                    Clean light background with red accent
                  </p>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleErrorToast}
                    className="w-100"
                  >
                    Show Error
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={4}>
              <Card className="h-100 border-warning">
                <Card.Body className="text-center">
                  <div className="mb-3">
                    <span className="badge bg-warning text-dark fs-6">⚠</span>
                  </div>
                  <h6 className="card-title">Warning Toast</h6>
                  <p className="card-text text-muted small">
                    Clean light background with orange accent
                  </p>
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={handleWarningToast}
                    className="w-100"
                  >
                    Show Warning
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={4}>
              <Card className="h-100 border-info">
                <Card.Body className="text-center">
                  <div className="mb-3">
                    <span className="badge bg-info fs-6">ℹ</span>
                  </div>
                  <h6 className="card-title">Info Toast</h6>
                  <p className="card-text text-muted small">
                    Clean light background with blue accent
                  </p>
                  <Button
                    variant="info"
                    size="sm"
                    onClick={handleInfoToast}
                    className="w-100"
                  >
                    Show Info
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={4}>
              <Card className="h-100 border-secondary">
                <Card.Body className="text-center">
                  <div className="mb-3">
                    <span className="badge bg-secondary fs-6">⟳</span>
                  </div>
                  <h6 className="card-title">Loading Toast</h6>
                  <p className="card-text text-muted small">
                    Clean light background with gray accent
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleLoadingToast}
                    className="w-100"
                  >
                    Show Loading
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={4}>
              <Card className="h-100 border-primary">
                <Card.Body className="text-center">
                  <div className="mb-3">
                    <span className="badge bg-primary fs-6">⚡</span>
                  </div>
                  <h6 className="card-title">Promise Toast</h6>
                  <p className="card-text text-muted small">
                    Loading → Success/Error transition
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handlePromiseToast}
                    className="w-100"
                  >
                    Show Promise
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <hr className="my-4" />

          <Row className="g-3">
            <Col md={6}>
              <Card className="border-dark">
                <Card.Body className="text-center">
                  <h6 className="card-title">
                    <i className="ti-palette me-2"></i>
                    Custom Toast
                  </h6>
                  <p className="card-text text-muted small">
                    Toast with title, description, and custom action button
                  </p>
                  <Button
                    variant="dark"
                    size="sm"
                    onClick={handleCustomToast}
                    className="w-100"
                  >
                    Show Custom Toast
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="border-primary">
                <Card.Body className="text-center">
                  <h6 className="card-title">
                    <i className="ti-star me-2"></i>
                    Preset Toasts
                  </h6>
                  <p className="card-text text-muted small">
                    Pre-configured toasts for common use cases
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handlePresetToasts}
                    className="w-100"
                  >
                    Show Presets
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <div className="mt-4 pt-3 border-top">
            <div className="d-flex gap-2 justify-content-center flex-wrap">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => {
                  console.log("Basic toast test");
                  toast.success("Basic toast works!");
                }}
              >
                <i className="ti-check me-1"></i>
                Test Basic Toast
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => toastService.dismissAll()}
              >
                <i className="ti-close me-1"></i>
                Dismiss All Toasts
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
