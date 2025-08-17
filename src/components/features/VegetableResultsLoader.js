"use client";

import { memo } from "react";
import { Row, Col } from "react-bootstrap";
import { CardPlaceholder } from "@/components/common/Placeholder";

const VegetableResultsLoader = memo(function VegetableResultsLoader() {
  // Create an array of 8 placeholders
  return (
    <Row className="g-4 pb-4">
      {[...Array(8)].map((_, index) => (
        <Col key={index} sm={6} lg={4} xl={3}>
          <CardPlaceholder showImage={true} imageHeight="200px" lines={4} />
        </Col>
      ))}
    </Row>
  );
});

export default VegetableResultsLoader;
