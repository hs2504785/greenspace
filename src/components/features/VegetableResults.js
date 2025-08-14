'use client';

import { memo } from 'react';
import { Row, Col } from 'react-bootstrap';
import VegetableCard from './VegetableCard';
import VegetableResultsLoader from './VegetableResultsLoader';

const VegetableResults = memo(function VegetableResults({ vegetables, loading, error }) {
  if (loading) {
    return <VegetableResultsLoader />;
  }

  if (error) {
    return (
      <Col>
        <div className="text-center py-5">
          <h3 className="text-danger">Error loading vegetables</h3>
          <p className="text-muted">{error}</p>
        </div>
      </Col>
    );
  }
  if (vegetables.length === 0) {
    return (
      <Col>
        <div className="text-center py-5">
          <h3>No vegetables found</h3>
          <p className="text-muted">Try adjusting your filters</p>
        </div>
      </Col>
    );
  }

  return (
    <Row className="g-4 pb-4">
      {vegetables.map(vegetable => (
        <Col key={vegetable.id} sm={6} lg={4} xl={3}>
          <VegetableCard {...vegetable} />
        </Col>
      ))}
    </Row>
  );
});

export default VegetableResults;
