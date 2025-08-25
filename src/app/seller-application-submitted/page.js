"use client";

import { Container, Card, Alert, Button } from "react-bootstrap";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function SellerApplicationSubmittedPage() {
  const { data: session } = useSession();

  return (
    <Container className="pb-5">
      <div className="text-center">
        <div style={{ fontSize: "4rem" }} className="mb-3">
          🎉
        </div>
        <h1 className="text-success mb-3">
          Application Submitted Successfully!
        </h1>
        <p className="lead text-muted mb-5">
          Thank you for applying to become a natural farming seller
        </p>
      </div>

      <div className="row justify-content-center">
        <div className="col-md-8">
          <Card className="shadow-sm">
            <Card.Header className="bg-success text-white text-center">
              <h5 className="mb-0">🌱 What Happens Next?</h5>
            </Card.Header>
            <Card.Body>
              <div className="timeline">
                <div className="d-flex mb-4">
                  <div className="flex-shrink-0">
                    <div
                      className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: "40px", height: "40px" }}
                    >
                      ✓
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="text-success">Application Submitted</h6>
                    <p className="text-muted mb-0">
                      Your detailed seller application has been received and is
                      in our review queue.
                    </p>
                  </div>
                </div>

                <div className="d-flex mb-4">
                  <div className="flex-shrink-0">
                    <div
                      className="bg-warning text-white rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: "40px", height: "40px" }}
                    >
                      🔍
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="text-warning">Under Review</h6>
                    <p className="text-muted mb-0">
                      Our team will review your farming practices, photos, and
                      documentation within 1-3 business days.
                    </p>
                  </div>
                </div>

                <div className="d-flex mb-4">
                  <div className="flex-shrink-0">
                    <div
                      className="bg-info text-white rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: "40px", height: "40px" }}
                    >
                      📧
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="text-info">Decision Notification</h6>
                    <p className="text-muted mb-0">
                      You'll be notified of our decision. If approved, your
                      account will be upgraded to seller status.
                    </p>
                  </div>
                </div>

                <div className="d-flex">
                  <div className="flex-shrink-0">
                    <div
                      className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: "40px", height: "40px" }}
                    >
                      🚀
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="text-primary">Start Selling</h6>
                    <p className="text-muted mb-0">
                      Once approved, you can immediately start adding products
                      and selling to our community.
                    </p>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Alert variant="info" className="mt-4">
            <Alert.Heading>📋 Review Criteria</Alert.Heading>
            <p className="mb-2">Our team evaluates applications based on:</p>
            <ul className="mb-0">
              <li>Commitment to natural/organic farming practices</li>
              <li>Quality and authenticity of farm photos</li>
              <li>Detailed description of growing methods</li>
              <li>Experience and knowledge in sustainable farming</li>
              <li>Clear pest and soil management practices</li>
            </ul>
          </Alert>

          <Alert variant="success" className="mt-3">
            <Alert.Heading>💡 While You Wait</Alert.Heading>
            <ul className="mb-0">
              <li>Prepare high-quality photos of your products</li>
              <li>Think about pricing and product descriptions</li>
              <li>Consider which products you want to list first</li>
              <li>
                Review our{" "}
                <Link href="/seller-guidelines">seller guidelines</Link>
              </li>
            </ul>
          </Alert>

          <div className="text-center mt-5">
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <Link href="/dashboard" className="btn btn-primary">
                <i className="ti ti-dashboard me-2"></i>
                Go to Dashboard
              </Link>

              <Link href="/become-seller" className="btn btn-outline-primary">
                <i className="ti ti-eye me-2"></i>
                View Application Status
              </Link>

              <Link href="/profile" className="btn btn-outline-secondary">
                <i className="ti ti-user me-2"></i>
                Update Profile
              </Link>
            </div>
          </div>

          {session?.user?.email && (
            <Alert variant="light" className="mt-4 text-center">
              <small className="text-muted">
                <strong>Application ID:</strong> Submitted by{" "}
                {session.user.email}
                <br />
                <strong>Date:</strong>{" "}
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </small>
            </Alert>
          )}
        </div>
      </div>
    </Container>
  );
}
