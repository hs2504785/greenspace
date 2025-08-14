'use client';

import { Container, Row, Col, Button } from 'react-bootstrap';
import Link from 'next/link';

export default function ComingSoon({
  title = "Coming Soon!",
  icon = "ti-package",
  description = "This feature is currently under development.",
  features = [],
  backLink = "/",
  backText = "Back to Home",
  backIcon = "ti-home"
}) {
  return (
    <Container className="py-5 text-center">
      <Row className="justify-content-center">
        <Col md={8}>
          <div className="mb-4">
            <i className={`${icon} text-success`} style={{ fontSize: '4rem' }}></i>
          </div>
          <h1 className="display-4 mb-3">{title}</h1>
          <p className="lead mb-4">{description}</p>
          
          {features.length > 0 && (
            <div className="mb-5">
              <div className="text-muted mb-3">
                <i className="ti-announcement me-2"></i>
                Features coming to this space:
              </div>
              <div className="d-flex flex-column gap-2 align-items-center">
                {features.map((feature, index) => (
                  <div key={index}>
                    <i className={`${feature.icon || 'ti-check'} me-2`}></i>
                    {feature.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Link href={backLink} passHref>
            <Button variant="success" size="lg">
              <i className={`${backIcon} me-2`}></i>
              {backText}
            </Button>
          </Link>
        </Col>
      </Row>
    </Container>
  );
}
