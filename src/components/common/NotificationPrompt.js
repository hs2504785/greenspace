"use client";

import { useState, useEffect } from "react";
import { Alert, Button } from "react-bootstrap";
import { useSession } from "next-auth/react";
import useNotifications from "@/hooks/useNotifications";
import Link from "next/link";

export default function NotificationPrompt() {
  const { data: session } = useSession();
  const { isSubscribed, isSupported, isAuthenticated, canSubscribe } =
    useNotifications();
  const [dismissed, setDismissed] = useState(false);

  // Check if user has dismissed this prompt before
  useEffect(() => {
    const isDismissed = localStorage.getItem("notification-prompt-dismissed");
    if (isDismissed === "true") {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("notification-prompt-dismissed", "true");
  };

  // Don't show if:
  // - User dismissed it
  // - User not authenticated
  // - Notifications not supported
  // - User already subscribed
  if (dismissed || !isAuthenticated || !isSupported || isSubscribed) {
    return null;
  }

  return (
    <Alert
      variant="info"
      className="mb-4 border-0 bg-light"
      dismissible
      onClose={handleDismiss}
    >
      <div className="d-flex align-items-center">
        <div className="me-3">
          <i
            className="ti ti-bell text-primary"
            style={{ fontSize: "1.5rem" }}
          ></i>
        </div>
        <div className="flex-grow-1">
          <h6 className="mb-1">🔔 Never miss fresh arrivals!</h6>
          <p className="mb-2 text-muted">
            Get instant notifications when new vegetables arrive from local
            farmers.
          </p>
          <div className="d-flex gap-2">
            <Button as={Link} href="/notifications" variant="primary" size="sm">
              Enable Notifications
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleDismiss}
            >
              Not now
            </Button>
          </div>
        </div>
      </div>
    </Alert>
  );
}
