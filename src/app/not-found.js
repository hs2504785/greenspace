import Link from 'next/link';
import { Container, Row, Col, Button } from 'react-bootstrap';

export default function NotFound() {
  return (
    <Container className="text-center py-5">
      <Row className="justify-content-center">
        <Col md={8} className="text-center">
          <div className="mb-4">
            <i className="ti-package text-success" style={{ fontSize: '4rem' }}></i>
          </div>
          <h1 className="display-4 mb-4">Oops! Page Not Found</h1>
          <p className="lead mb-4">
            This patch of land isn&apos;t ready for harvest yet.
          </p>
          <div className="d-flex gap-3 justify-content-center">
            <Link href="/" passHref>
              <Button variant="success" size="lg">
                <i className="ti-home me-2"></i>
                Return to Home
              </Button>
            </Link>
            <Link href="/vegetables" passHref>
              <Button variant="outline-success" size="lg">
                <i className="ti-shopping-cart me-2"></i>
                Browse Vegetables
              </Button>
            </Link>
          </div>
          <div className="mt-5">
            <div className="text-muted">
              <i className="ti-light-bulb me-2"></i>
              Tip: Check out our fresh vegetables section for the best organic produce!
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
