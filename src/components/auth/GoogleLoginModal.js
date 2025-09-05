"use client";

import { useState } from "react";
import { Modal, Button, Card } from "react-bootstrap";
import GoogleSignInButton from "./GoogleSignInButton";
import toastService from "@/utils/toastService";

export default function GoogleLoginModal({ show, onHide }) {
  const handleGoogleSignInSuccess = (result) => {
    // Close modal on successful sign in
    if (result?.ok) {
      onHide();
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="sm" backdrop="static">
      <Modal.Header closeButton className="border-0 pb-0">
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

        <div className="d-flex justify-content-center">
          <GoogleSignInButton
            onSuccess={handleGoogleSignInSuccess}
            callbackUrl="/"
          />
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
