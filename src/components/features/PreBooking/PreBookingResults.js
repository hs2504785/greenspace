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
      <EmptyState
        icon="ti-calendar-plus"
        title="No Pre-Booking Products Available"
        description="🌱 Our farmers are planning their next harvests.<br/>Check back soon to discover upcoming organic produce opportunities."
        size="lg"
        className="bg-light rounded-4 shadow-sm border-0 py-4"
        iconColor="text-success"
        action={
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
        }
      />
    );
  }

  return (
    <Row className="g-4 pb-4">
      {products.map((product) => (
        <Col key={product.id} sm={6} lg={4} xl={3}>
          <PreBookingProductCard {...product} />
        </Col>
      ))}
    </Row>
  );
});

export default PreBookingResults;
