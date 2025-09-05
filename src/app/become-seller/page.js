"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState, useEffect } from "react";
import { Container, Alert, Card, Spinner } from "react-bootstrap";
import NaturalFarmingSellerForm from "@/components/features/sellers/NaturalFarmingSellerForm";
import Link from "next/link";

export default function BecomeSellerPage() {
  const { data: session, status } = useSession();
  const [existingRequest, setExistingRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      checkExistingRequest();
    }
  }, [session]);

  const checkExistingRequest = async () => {
    try {
      console.log("🔍 Checking for existing seller requests...", {
        userId: session.user.id,
        userEmail: session.user.email,
      });

      const response = await fetch(
        `/api/seller-requests?userId=${session.user.id}`
      );

      if (response.ok) {
        const requests = await response.json();

        if (requests.length > 0) {
          setExistingRequest(requests[0]); // Get the latest request
        } else {
        }
      } else {
        console.error("❌ API Error:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("Error details:", errorText);
      }
    } catch (error) {
      console.error("❌ Error checking existing request:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    // Redirect to success page
    window.location.href = "/seller-application-submitted";
  };

  if (status === "loading" || loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (!session) {
    redirect("/login");
  }

  // Check if user is already a seller
  if (session.user?.role === "seller") {
    return (
      <Container className="py-5">
        <Alert variant="info">
          <Alert.Heading>🌱 You're Already a Seller!</Alert.Heading>
          <p>
            You have already been approved as a seller on our platform. You can
            start adding your natural farming products right away.
          </p>
          <hr />
          <div className="d-flex gap-2">
            <Link href="/seller-dashboard" className="btn btn-primary">
              Go to Seller Dashboard
            </Link>
            <Link
              href="/products-management"
              className="btn btn-outline-primary"
            >
              Manage Products
            </Link>
          </div>
        </Alert>
      </Container>
    );
  }

  // Check if user has a pending application
  if (existingRequest) {
    const getStatusInfo = (status) => {
      switch (status) {
        case "pending":
          return {
            variant: "warning",
            title: "⏳ Application Under Review",
            message:
              "Your seller application has been submitted and is currently being reviewed by our team.",
          };
        case "under_review":
          return {
            variant: "info",
            title: "🔍 Application Being Processed",
            message:
              "Our team is actively reviewing your application and farm documentation.",
          };
        case "basic_verified":
        case "farm_verified":
          return {
            variant: "success",
            title: "✅ Application Approved!",
            message:
              "Congratulations! Your seller application has been approved. Your account will be updated shortly.",
          };
        case "rejected":
          return {
            variant: "danger",
            title: "❌ Application Not Approved",
            message:
              "Unfortunately, your application was not approved at this time.",
          };
        default:
          return {
            variant: "secondary",
            title: "📋 Application Status",
            message: "Your application status is being processed.",
          };
      }
    };

    const statusInfo = getStatusInfo(existingRequest.status);

    return (
      <Container className="py-5">
        <Card>
          <Card.Header className="bg-primary text-white">
            <h4 className="mb-0">🌱 Seller Application Status</h4>
          </Card.Header>
          <Card.Body>
            <Alert variant={statusInfo.variant}>
              <Alert.Heading>{statusInfo.title}</Alert.Heading>
              <p>{statusInfo.message}</p>

              {existingRequest.review_notes && (
                <div className="mt-3">
                  <strong>Review Notes:</strong>
                  <div className="bg-light p-3 rounded mt-2">
                    {existingRequest.review_notes}
                  </div>
                </div>
              )}

              <hr />

              <div className="row">
                <div className="col-md-6">
                  <strong>Application Details:</strong>
                  <ul className="mt-2">
                    <li>
                      Farm Name:{" "}
                      {existingRequest.farm_name ||
                        existingRequest.business_name}
                    </li>
                    <li>Location: {existingRequest.location}</li>
                    <li>
                      Submitted:{" "}
                      {new Date(
                        existingRequest.created_at
                      ).toLocaleDateString()}
                    </li>
                    <li>
                      Status:{" "}
                      {existingRequest.verification_level ||
                        existingRequest.status}
                    </li>
                  </ul>
                </div>

                {existingRequest.farming_methods && (
                  <div className="col-md-6">
                    <strong>Farming Methods:</strong>
                    <div className="mt-2">
                      {existingRequest.farming_methods.map((method) => (
                        <span
                          key={method}
                          className="badge bg-success me-1 mb-1"
                        >
                          {method.replace("_", " ").toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {existingRequest.status === "rejected" && (
                <div className="mt-3">
                  <p className="mb-0">
                    <strong>
                      You can submit a new application addressing the review
                      feedback.
                    </strong>
                  </p>
                </div>
              )}
            </Alert>

            {existingRequest.status === "rejected" ? (
              <div className="text-center">
                <button
                  className="btn btn-primary"
                  onClick={() => setExistingRequest(null)}
                >
                  Submit New Application
                </button>
              </div>
            ) : (
              <div className="text-center">
                <Link href="/dashboard" className="btn btn-primary me-2">
                  Go to Dashboard
                </Link>
                <Link href="/profile" className="btn btn-outline-primary">
                  Update Profile
                </Link>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
    );
  }

  // Show the seller application form
  return (
    <Container className="pb-4">
      <div className="text-center mb-4">
        <h2 className="text-success">🌱 Join Our Natural Farming Community</h2>
        <p className="lead text-muted">
          Help buyers discover naturally grown, chemical-free produce from your
          farm
        </p>
      </div>

      <Alert variant="info" className="mb-4">
        <Alert.Heading>📋 Seller Application Process</Alert.Heading>
        <p className="mb-0">
          Complete this application to become a verified natural farming seller.
          Our team will review your farming practices and documentation to
          ensure quality standards for our community.
        </p>
        <hr />
        <ul className="mb-0">
          <li>
            <strong>Step 1:</strong> Complete detailed application form
          </li>
          <li>
            <strong>Step 2:</strong> Upload farm photos and documentation
          </li>
          <li>
            <strong>Step 3:</strong> Admin review (1-3 business days)
          </li>
          <li>
            <strong>Step 4:</strong> Start selling natural produce!
          </li>
        </ul>
      </Alert>

      <NaturalFarmingSellerForm
        onSuccess={handleSuccess}
        userInfo={{
          name: session.user.name,
          email: session.user.email,
          phone: session.user.phone_number || session.user.phone,
          whatsapp_number: session.user.whatsapp_number,
          location: session.user.location,
        }}
      />
    </Container>
  );
}
