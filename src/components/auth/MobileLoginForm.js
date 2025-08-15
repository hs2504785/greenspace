"use client";

import { useState } from "react";
import { Button, Form, Alert, InputGroup } from "react-bootstrap";
import { signIn } from "next-auth/react";
import { toast } from "react-hot-toast";

export default function MobileLoginForm({ onSuccess }) {
  const [step, setStep] = useState("phone"); // 'phone' or 'otp'
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState("");

  // Format phone number input
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setPhoneNumber(value);
    }
    setError("");
  };

  // Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (phoneNumber.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/mobile/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const result = await response.json();

      if (result.success) {
        setStep("otp");
        setOtpSent(true);
        setResendTimer(60); // 60 seconds countdown
        toast.success("OTP sent successfully!");

        // Start countdown timer
        const timer = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(result.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and sign in
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (otpCode.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("🔍 Attempting mobile sign-in with:", {
        phoneNumber,
        otpCode,
      });

      const result = await signIn("mobile", {
        phoneNumber,
        otpCode,
        redirect: false,
      });

      console.log("🔍 Sign-in result:", result);

      if (result?.error) {
        console.error("SignIn error:", result.error);
        setError(result.error);
      } else if (result?.ok) {
        console.log("✅ Login successful");
        toast.success("Login successful!");
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.href = "/";
        }
      } else if (result?.url) {
        // NextAuth might redirect, follow the URL
        console.log("🔄 Redirecting to:", result.url);
        window.location.href = result.url;
      } else {
        console.error("Unexpected result:", result);
        setError("Authentication failed. Please try again.");
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      setError("Failed to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/mobile/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const result = await response.json();

      if (result.success) {
        setResendTimer(60);
        toast.success("OTP resent successfully!");

        // Start countdown timer
        const timer = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(result.message || "Failed to resend OTP");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Go back to phone input
  const handleBack = () => {
    setStep("phone");
    setOtpCode("");
    setError("");
  };

  if (step === "phone") {
    return (
      <div>
        <div className="text-center mb-4">
          <h5 className="mb-3">Login with Mobile Number</h5>
          <p className="text-muted">
            Enter your mobile number to receive an OTP
          </p>
        </div>

        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSendOtp}>
          <Form.Group className="mb-3">
            <Form.Label>Mobile Number</Form.Label>
            <InputGroup>
              <InputGroup.Text>+91</InputGroup.Text>
              <Form.Control
                type="tel"
                placeholder="Enter 10-digit number"
                value={phoneNumber}
                onChange={handlePhoneChange}
                pattern="[0-9]{10}"
                maxLength={10}
                required
                className="font-monospace"
              />
            </InputGroup>
            <Form.Text className="text-muted">
              We'll send you a 6-digit verification code via SMS
            </Form.Text>
          </Form.Group>

          <Button
            type="submit"
            variant="success"
            size="lg"
            className="w-100"
            disabled={loading || phoneNumber.length !== 10}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Sending OTP...
              </>
            ) : (
              <>
                <i className="ti-mobile me-2"></i>
                Send OTP
              </>
            )}
          </Button>
        </Form>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-4">
        <h5 className="mb-3">Verify OTP</h5>
        <p className="text-muted">
          Enter the 6-digit code sent to +91{phoneNumber}
        </p>
      </div>

      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      <Form onSubmit={handleVerifyOtp}>
        <Form.Group className="mb-3">
          <Form.Label>Verification Code</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otpCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              if (value.length <= 6) {
                setOtpCode(value);
              }
              setError("");
            }}
            pattern="[0-9]{6}"
            maxLength={6}
            required
            className="font-monospace text-center fs-4"
            style={{ letterSpacing: "0.5rem" }}
          />
        </Form.Group>

        <div className="d-flex flex-column gap-2 mb-3">
          <Button
            type="submit"
            variant="success"
            size="lg"
            className="w-100"
            disabled={loading || otpCode.length !== 6}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Verifying...
              </>
            ) : (
              <>
                <i className="ti-check me-2"></i>
                Verify & Login
              </>
            )}
          </Button>

          <div className="d-flex justify-content-between align-items-center">
            <Button
              variant="link"
              onClick={handleBack}
              disabled={loading}
              className="text-decoration-none p-0"
            >
              <i className="ti-arrow-left me-1"></i>
              Change Number
            </Button>

            <Button
              variant="link"
              onClick={handleResendOtp}
              disabled={loading || resendTimer > 0}
              className="text-decoration-none p-0"
            >
              {resendTimer > 0 ? (
                `Resend in ${resendTimer}s`
              ) : (
                <>
                  <i className="ti-reload me-1"></i>
                  Resend OTP
                </>
              )}
            </Button>
          </div>
        </div>
      </Form>

      {process.env.NODE_ENV === "development" && (
        <Alert variant="info" className="mt-3">
          <small>
            <strong>Development Mode:</strong> Check the console for the OTP
            code.
          </small>
        </Alert>
      )}
    </div>
  );
}
