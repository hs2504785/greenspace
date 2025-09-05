"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Container, Row, Col, Alert, Spinner } from "react-bootstrap";
import { useRouter } from "next/navigation";
import PaymentVerification from "@/components/features/payments/PaymentVerification";
import toastService from "@/utils/toastService";
import useUserRole from "@/hooks/useUserRole";

export default function PaymentVerificationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { userRole, loading: roleLoading } = useUserRole();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (status === "loading" || roleLoading) return;

    if (status === "unauthenticated") {
      toastService.error("Please sign in to access payment verification");
      router.push("/login");
      return;
    }

    // Check if user is seller, admin, or superadmin
    if (
      userRole === "seller" ||
      userRole === "admin" ||
      userRole === "superadmin"
    ) {
      setIsAuthorized(true);
    } else {
      toastService.error(
        "Access denied. Only sellers and admins can verify payments."
      );
      router.push("/");
    }
  }, [status, userRole, roleLoading, router]);

  if (status === "loading" || roleLoading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status" className="mb-3" />
          <div>Loading...</div>
        </div>
      </Container>
    );
  }

  if (!isAuthorized) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6}>
            <Alert variant="danger" className="text-center">
              <i className="ti-alert-triangle me-2"></i>
              <strong>Access Denied</strong>
              <br />
              Only sellers and administrators can access payment verification.
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">Payment Verification</h2>
              <p className="text-muted mb-0">
                Review and verify pending payment submissions
              </p>
            </div>
            <div className="text-end">
              <small className="text-muted">
                {userRole === "admin"
                  ? "Admin View"
                  : userRole === "superadmin"
                  ? "Super Admin View"
                  : "Seller View"}
              </small>
            </div>
          </div>

          <PaymentVerification
            sellerId={userRole === "seller" ? session?.user?.id : null}
          />
        </Col>
      </Row>
    </Container>
  );
}
