"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Container, Row, Col, Card, Button, Nav } from "react-bootstrap";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import MobileLoginForm from "@/components/auth/MobileLoginForm";
import { toast } from "react-hot-toast";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState("google"); // 'google' or 'mobile'

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
      toast.error("Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleMobileLoginSuccess = () => {
    router.replace("/");
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
              <h2 className="mb-3">Welcome to Arya Natural Farms</h2>
              <p className="text-muted mb-0">
                Choose your preferred sign-in method
              </p>
            </Card.Header>

            <Card.Body className="p-0">
              {/* Login Method Tabs */}
              <Nav variant="tabs" className="justify-content-center">
                <Nav.Item>
                  <Nav.Link
                    active={loginMethod === "google"}
                    onClick={() => setLoginMethod("google")}
                    className="d-flex align-items-center"
                  >
                    <i className="ti-google me-2"></i>
                    Google
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    active={loginMethod === "mobile"}
                    onClick={() => setLoginMethod("mobile")}
                    className="d-flex align-items-center"
                  >
                    <i className="ti-mobile me-2"></i>
                    Mobile
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              {/* Login Content */}
              <div className="p-4">
                {loginMethod === "google" ? (
                  <div>
                    <div className="text-center mb-4">
                      <h5 className="mb-3">Continue with Google</h5>
                      <p className="text-muted">
                        Use your Google account to sign in
                      </p>
                    </div>

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
                  </div>
                ) : (
                  <MobileLoginForm onSuccess={handleMobileLoginSuccess} />
                )}
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
