"use client";

import { Container, Row, Col, Card } from "react-bootstrap";
import GoogleSignInButton from "./GoogleSignInButton";

/**
 * Demo component to showcase the Google Sign-In button
 * This can be used for testing or as a standalone component
 */
export default function GoogleSignInDemo() {
  const handleSuccess = (result) => {
    console.log("Google Sign-In Success:", result);
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white text-center">
              <h4 className="mb-0">Google Sign-In Button Demo</h4>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="mb-4">
                <h5>Material Design Google Sign-In Button</h5>
                <p className="text-muted">
                  This is the official Google Material Design sign-in button
                  with proper styling and functionality.
                </p>
              </div>

              <div className="d-flex flex-column gap-3">
                {/* Default Button */}
                <div>
                  <h6>Default Size:</h6>
                  <GoogleSignInButton
                    onSuccess={handleSuccess}
                    callbackUrl="/"
                  />
                </div>

                {/* Full Width Button */}
                <div>
                  <h6>Full Width:</h6>
                  <GoogleSignInButton
                    onSuccess={handleSuccess}
                    callbackUrl="/"
                    className="w-100"
                  />
                </div>

                {/* Disabled Button */}
                <div>
                  <h6>Disabled State:</h6>
                  <GoogleSignInButton
                    onSuccess={handleSuccess}
                    callbackUrl="/"
                    disabled={true}
                  />
                </div>
              </div>

              <div className="mt-4 p-3 bg-light rounded">
                <h6>Features:</h6>
                <ul className="mb-0">
                  <li>Official Google Material Design styling</li>
                  <li>Proper hover and focus states</li>
                  <li>Loading state with spinner</li>
                  <li>Integrated with NextAuth.js</li>
                  <li>Responsive and accessible</li>
                  <li>Bootstrap 5 compatible</li>
                </ul>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}


