"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Container, Row, Col, Card } from "react-bootstrap";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.replace("/");
    }
  }, [session, router]);

  const handleGoogleSignInSuccess = (result) => {
    // Redirect will be handled by NextAuth callback
    if (result?.ok) {
      console.log("Google sign-in successful");
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
              <div className="d-flex justify-content-center">
                <GoogleSignInButton
                  onSuccess={handleGoogleSignInSuccess}
                  callbackUrl="/"
                />
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
