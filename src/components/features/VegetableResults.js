"use client";

import { memo } from "react";
import { Row, Col } from "react-bootstrap";
import VegetableProductCard from "./VegetableProductCard";
import VegetableResultsLoader from "./VegetableResultsLoader";
import EmptyState from "@/components/common/EmptyState";

const VegetableResults = memo(function VegetableResults({
  vegetables,
  loading,
  error,
}) {
  if (loading) {
    return <VegetableResultsLoader />;
  }

  if (error) {
    return (
      <EmptyState
        icon="ti-alert"
        title="Unable to load vegetables"
        description="🚨 We're having trouble connecting to our farm network.<br />Please try refreshing the page or check back in a moment."
        size="lg"
        iconColor="text-warning"
      />
    );
  }
  if (vegetables.length === 0) {
    return (
      <EmptyState
        icon="ti-leaf"
        title="Welcome to Fair Share!"
        description="🌱 Our farmers are preparing fresh organic vegetables for you.<br/>Check back soon to discover locally grown produce at fair prices."
        size="xl"
        className="bg-light rounded-4 shadow-sm border-0 py-5"
        action={
          <div className="d-flex flex-column align-items-center gap-3">
            <div className="text-success">
              <small>Want to sell your organic vegetables?</small>
            </div>
            <a href="/become-seller" className="btn btn-outline-success">
              <i className="ti-user me-2"></i>
              Become a Seller
            </a>
          </div>
        }
      />
    );
  }

  return (
    <Row className="g-4 pb-4">
      {vegetables.map((vegetable) => (
        <Col key={vegetable.id} sm={6} lg={4} xl={3}>
          <VegetableProductCard {...vegetable} />
        </Col>
      ))}
    </Row>
  );
});

export default VegetableResults;
