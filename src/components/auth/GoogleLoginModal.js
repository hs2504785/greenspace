"use client";

import { useState } from "react";
import { Modal, Button, Card } from "react-bootstrap";
import { signIn } from "next-auth/react";
import toastService from "@/utils/toastService";

export default function GoogleLoginModal({ show, onHide }) {
  const [loading, setLoading] = useState(false);

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

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="sm"
      backdrop="static"
      keyboard={!loading}
    >
      <Modal.Header closeButton={!loading} className="border-0 pb-0">
        <Modal.Title className="w-100 text-center">
          <div className="d-flex align-items-center justify-content-center gap-2">
            <i className="ti-leaf text-success"></i>
            <span>Arya Natural Farms</span>
          </div>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="px-4 pb-4">
        <div className="text-center mb-4">
          <h5 className="mb-2">Welcome Back!</h5>
          <p className="text-muted small mb-0">
            Sign in to access your account and continue shopping for fresh,
            natural produce.
          </p>
        </div>

        <div className="d-grid">
          <Button
            variant="outline-dark"
            size="lg"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="d-flex align-items-center justify-content-center py-3"
            style={{ borderRadius: "12px" }}
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
                <i
                  className="ti-google me-2"
                  style={{ fontSize: "1.2rem" }}
                ></i>
                Continue with Google
              </>
            )}
          </Button>
        </div>

        <div className="text-center mt-3">
          <small className="text-muted">
            By signing in, you agree to our{" "}
            <a href="#" className="text-decoration-none text-success">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-decoration-none text-success">
              Privacy Policy
            </a>
          </small>
        </div>
      </Modal.Body>
    </Modal>
  );
}
