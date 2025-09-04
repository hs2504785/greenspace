"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Container, Card, Button, Alert } from "react-bootstrap";
import useSellerRequestStatus from "@/hooks/useSellerRequestStatus";
import useUserRole from "@/hooks/useUserRole";

export default function DebugSellerStatusPage() {
  const { data: session } = useSession();
  const { isSeller, isAdmin, loading: roleLoading } = useUserRole();
  const {
    sellerRequest,
    loading: requestLoading,
    hasPendingRequest,
    isRejected,
    error,
  } = useSellerRequestStatus();

  const [apiTest, setApiTest] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);

  const testAPI = async () => {
    if (!session?.user?.id) return;

    setApiLoading(true);
    try {
      const response = await fetch(
        `/api/seller-requests?userId=${session.user.id}`
      );
      const data = await response.json();
      setApiTest({
        status: response.status,
        ok: response.ok,
        data: data,
      });
    } catch (error) {
      setApiTest({
        error: error.message,
      });
    } finally {
      setApiLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      testAPI();
    }
  }, [session?.user?.id]);

  if (!session) {
    return (
      <Container className="py-4">
        <Alert variant="warning">Please log in to debug seller status</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2>🔍 Seller Status Debug Page</h2>

      <Card className="mb-4">
        <Card.Header>
          <h5>Session Information</h5>
        </Card.Header>
        <Card.Body>
          <pre>{JSON.stringify(session.user, null, 2)}</pre>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>
          <h5>User Role Hook</h5>
        </Card.Header>
        <Card.Body>
          <p>
            <strong>Loading:</strong> {roleLoading.toString()}
          </p>
          <p>
            <strong>Is Seller:</strong> {isSeller.toString()}
          </p>
          <p>
            <strong>Is Admin:</strong> {isAdmin.toString()}
          </p>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>
          <h5>Seller Request Status Hook</h5>
        </Card.Header>
        <Card.Body>
          <p>
            <strong>Loading:</strong> {requestLoading.toString()}
          </p>
          <p>
            <strong>Has Pending Request:</strong> {hasPendingRequest.toString()}
          </p>
          <p>
            <strong>Is Rejected:</strong> {isRejected.toString()}
          </p>
          <p>
            <strong>Error:</strong> {error || "None"}
          </p>
          <p>
            <strong>Seller Request:</strong>
          </p>
          <pre>{JSON.stringify(sellerRequest, null, 2)}</pre>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>
          <h5>Direct API Test</h5>
        </Card.Header>
        <Card.Body>
          <Button onClick={testAPI} disabled={apiLoading} className="mb-3">
            {apiLoading ? "Testing..." : "Test API"}
          </Button>
          {apiTest && (
            <div>
              <p>
                <strong>API Response:</strong>
              </p>
              <pre>{JSON.stringify(apiTest, null, 2)}</pre>
            </div>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h5>Expected Behavior</h5>
        </Card.Header>
        <Card.Body>
          <p>
            If Tanya has a pending seller request, the ProfileDropdown should
            show:
          </p>
          <ul>
            <li>
              <strong>hasPendingRequest:</strong> true
            </li>
            <li>
              <strong>sellerRequest.status:</strong> "pending"
            </li>
            <li>
              <strong>Profile menu:</strong> "Request Pending" instead of
              "Become a Seller"
            </li>
          </ul>
        </Card.Body>
      </Card>
    </Container>
  );
}
