"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import toastService from "@/utils/toastService";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      router.replace("/");
    }
  }, [session, router]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signIn("google", { callbackUrl: "/" });
    } catch (error) {
      console.error("Sign in error:", error);
      toastService.presets.loginError();
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || session) {
    return (
      <Container className="py-5 text-center">
        <LoadingSpinner />
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-light text-center">
              <h2 className="mb-0">Welcome to Arya Natural Farms</h2>
            </Card.Header>

            <Card.Body className="p-4">
              <div className="d-grid">
                <Button
                  variant="outline-dark"
                  size="lg"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="d-flex align-items-center justify-content-center"
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <i className="ti-google me-2"></i>
                      Continue with Google
                    </>
                  )}
                </Button>
              </div>
            </Card.Body>

            <Card.Footer className="text-center text-muted bg-light">
              <small>
                By signing in, you agree to our Terms of Service and Privacy
                Policy
              </small>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
