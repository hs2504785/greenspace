'use client';

import { memo } from 'react';
import { Row, Col, Placeholder, Card } from 'react-bootstrap';

const VegetableResultsLoader = memo(function VegetableResultsLoader() {
  // Create an array of 8 placeholders
  return (
    <Row className="g-4 pb-4">
      {[...Array(8)].map((_, index) => (
        <Col key={index} sm={6} lg={4} xl={3}>
          <Card>
            <Placeholder as={Card.Img} animation="glow" variant="top" style={{ height: '200px' }} />
            <Card.Body>
              <Placeholder as={Card.Title} animation="glow">
                <Placeholder xs={8} />
              </Placeholder>
              <Placeholder as={Card.Text} animation="glow">
                <Placeholder xs={6} /> <Placeholder xs={5} />
              </Placeholder>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
});

export default VegetableResultsLoader;
