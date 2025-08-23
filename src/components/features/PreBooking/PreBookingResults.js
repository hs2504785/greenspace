"use client";

import { memo } from "react";
import { Row, Col } from "react-bootstrap";
import PreBookingProductCard from "./PreBookingProductCard";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";

const PreBookingResults = memo(function PreBookingResults({
  products,
  loading,
  error,
}) {
  if (loading) {
    return (
      <div className="d-flex justify-content-center py-4">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="ti-alert"
        title="Unable to load pre-booking products"
        description="🚨 We're having trouble connecting to our farm network.<br />Please try refreshing the page or check back in a moment."
        size="lg"
        iconColor="text-warning"
        action={
          <button
            className="btn btn-outline-warning"
            onClick={() => window.location.reload()}
          >
            <i className="ti-refresh me-2"></i>
            Try Again
          </button>
        }
      />
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center">
        <div className="mb-4">
          <i
            className="ti-calendar-plus display-1"
            style={{
              background: "linear-gradient(135deg, #22c55e, #16a34a, #15803d)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 2px 4px rgba(34, 197, 94, 0.2))",
            }}
          ></i>
        </div>

        <h3 className="h2 mb-3" style={{ color: "#166534" }}>
          No Pre-Booking Products Available
        </h3>

        <div className="mb-4" style={{ color: "#65a30d" }}>
          🌱 Our farmers are planning their next harvests.
          <br />
          Check back soon to discover upcoming organic produce opportunities.
        </div>

        <div className="d-flex flex-column align-items-center gap-2">
          <div className="text-success">
            <small>Want to create pre-booking products?</small>
          </div>
          <a
            href="/add-prebooking-product"
            className="btn btn-outline-success btn-sm"
          >
            <i className="ti-calendar-plus me-2"></i>
            Create Pre-Booking Product
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Products Grid - No header needed as hero section already explains */}
      <Row className="g-4">
        {products.map((product) => (
          <Col key={product.id} xs={12} sm={6} lg={4} xl={3}>
            <PreBookingProductCard {...product} />
          </Col>
        ))}
      </Row>
    </div>
  );
});

export default PreBookingResults;
