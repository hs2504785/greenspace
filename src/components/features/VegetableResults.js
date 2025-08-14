"use client";

import { memo } from "react";
import { Row, Col } from "react-bootstrap";
import VegetableCard from "./VegetableCard";
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
        icon="ti-gift"
        title="No vegetables available"
        description="🌱 Fresh vegetables will appear here soon!<br />Check back later or contact local farmers to list their organic produce."
        size="xl"
      />
    );
  }

  return (
    <Row className="g-4 pb-4">
      {vegetables.map((vegetable) => (
        <Col key={vegetable.id} sm={6} lg={4} xl={3}>
          <VegetableCard {...vegetable} />
        </Col>
      ))}
    </Row>
  );
});

export default VegetableResults;
