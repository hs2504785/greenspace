"use client";

import { useState } from "react";
import { Container, Card, Button, Form, Alert } from "react-bootstrap";
import { signOut, useSession } from "next-auth/react";

export default function TestMobileAuth() {
  const { data: session } = useSession();
  const [phoneNumber, setPhoneNumber] = useState("9876543210");
  const [otpCode, setOtpCode] = useState("");
  const [otpResult, setOtpResult] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [mobileUsers, setMobileUsers] = useState(null);

  const testSendOtp = async () => {
    try {
      const response = await fetch("/api/auth/mobile/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      const result = await response.json();
      setOtpResult(result);
      console.log("OTP Result:", result);
    } catch (error) {
      setOtpResult({ success: false, message: error.message });
    }
  };

  const testVerifyOtp = async () => {
    try {
      const response = await fetch("/api/auth/mobile/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otpCode }),
      });
      const result = await response.json();
      setVerifyResult(result);
      console.log("Verify Result:", result);
    } catch (error) {
      setVerifyResult({ success: false, message: error.message });
    }
  };

  const clearSession = async () => {
    await signOut({ redirect: false });
    window.location.reload();
  };

  const fetchMobileUsers = async () => {
    try {
      const response = await fetch("/api/debug/mobile-users");
      const result = await response.json();
      setMobileUsers(result);
      console.log("Mobile Users:", result);
    } catch (error) {
      setMobileUsers({ success: false, message: error.message });
    }
  };

  return (
    <Container className="py-5">
      <Card>
        <Card.Header>
          <h3>Mobile Authentication Testing</h3>
        </Card.Header>
        <Card.Body>
          {session && (
            <Alert variant="info">
              <strong>Current Session:</strong>
              <pre>{JSON.stringify(session, null, 2)}</pre>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={clearSession}
              >
                Clear Session
              </Button>
            </Alert>
          )}

          <div className="mb-4">
            <h5>Test OTP Generation</h5>
            <Form.Group className="mb-3">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number"
              />
            </Form.Group>
            <Button onClick={testSendOtp} variant="primary">
              Send OTP
            </Button>
            {otpResult && (
              <Alert
                variant={otpResult.success ? "success" : "danger"}
                className="mt-3"
              >
                <strong>OTP Result:</strong>
                <pre>{JSON.stringify(otpResult, null, 2)}</pre>
              </Alert>
            )}
          </div>

          <div className="mb-4">
            <h5>Test OTP Verification</h5>
            <Form.Group className="mb-3">
              <Form.Label>OTP Code</Form.Label>
              <Form.Control
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Enter 6-digit OTP (check console)"
                maxLength={6}
              />
            </Form.Group>
            <Button onClick={testVerifyOtp} variant="success">
              Verify OTP
            </Button>
            {verifyResult && (
              <Alert
                variant={verifyResult.success ? "success" : "danger"}
                className="mt-3"
              >
                <strong>Verify Result:</strong>
                <pre>{JSON.stringify(verifyResult, null, 2)}</pre>
              </Alert>
            )}
          </div>

          <Alert variant="info">
            <h5>Testing Instructions:</h5>
            <ol>
              <li>Click "Send OTP" with the default phone number</li>
              <li>
                Check the browser console for the OTP code (in development mode)
              </li>
              <li>Enter the 6-digit OTP and click "Verify OTP"</li>
              <li>
                If verification succeeds, try the regular login flow at{" "}
                <a href="/login">/login</a>
              </li>
            </ol>
          </Alert>

          <div className="mb-4">
            <h5>Debug Mobile Users</h5>
            <Button onClick={fetchMobileUsers} variant="info">
              Check Mobile Users in Database
            </Button>
            {mobileUsers && (
              <Alert
                variant={mobileUsers.success ? "success" : "danger"}
                className="mt-3"
              >
                <strong>Mobile Users Debug:</strong>
                <pre>{JSON.stringify(mobileUsers, null, 2)}</pre>
              </Alert>
            )}
          </div>

          <Alert variant="warning">
            <strong>Current Issues to Check:</strong>
            <ul>
              <li>Database tables exist (OTP verifications table)</li>
              <li>NextAuth configuration includes mobile provider</li>
              <li>No redirect loops to Google sign-in</li>
              <li>User ID present in session after mobile login</li>
            </ul>
          </Alert>
        </Card.Body>
      </Card>
    </Container>
  );
}
