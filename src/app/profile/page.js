"use client";

import { useState, useEffect } from "react";
import { Container, Card, Form, Button } from "react-bootstrap";
import { useSession } from "next-auth/react";
import UserAvatar from "@/components/common/UserAvatar";
import toastService from "@/utils/toastService";

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Initialize and update whatsappNumber when session changes
  useEffect(() => {
    async function fetchUserProfile() {
      if (session?.user?.email) {
        // ✅ Check for email instead of ID
        console.log("Fetching user profile for email:", session.user.email);
        try {
          const response = await fetch("/api/users/profile");
          const data = await response.json();

          console.log("Profile API response:", data); // ✅ Added better logging

          if (data.user?.whatsapp_number) {
            console.log(
              "Setting WhatsApp number from profile:",
              data.user.whatsapp_number
            );
            setWhatsappNumber(data.user.whatsapp_number);
          } else {
            console.log("No WhatsApp number found in profile data");
            setWhatsappNumber(""); // ✅ Ensure field is empty if no data
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
        }
      } else {
        console.log("No session or email found, skipping profile fetch");
      }
    }

    fetchUserProfile();
  }, [session]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    console.log("Submitting profile update:", {
      whatsappNumber,
      sessionUser: session?.user,
    });

    try {
      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          whatsapp_number: whatsappNumber,
        }),
      });

      let data;
      const responseText = await response.text();
      console.log("Raw response:", responseText);

      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        toastService.error("Invalid response from server");
        setIsLoading(false);
        return;
      }

      console.log("Response status:", response.status, "Data:", data);

      if (response.ok) {
        toastService.presets.saveSuccess();

        // Update the session to reflect the changes
        try {
          const updatedSession = {
            ...session,
            user: {
              ...session.user,
              whatsapp_number: whatsappNumber,
            },
          };
          console.log("Updating session with:", updatedSession);
          await updateSession(updatedSession);

          // Force reload session to ensure we have latest data
          await updateSession();
        } catch (sessionError) {
          console.error("Failed to update session:", sessionError);
          // Don't show error to user since the profile update succeeded
        }
      } else {
        console.error("Profile update failed:", {
          status: response.status,
          statusText: response.statusText,
          data,
        });
        const errorMessage = data.details
          ? `${data.message}: ${data.details}`
          : data.message || "Failed to update profile";
        toastService.error(errorMessage);
      }
    } catch (err) {
      console.error("Profile update error:", {
        error: err,
        message: err.message,
        stack: err.stack,
      });
      toastService.error(
        `Error: ${
          err.message || "An error occurred while updating your profile"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <Container className="py-5">
        <Card className="border-warning">
          <Card.Body className="text-warning">
            <i className="ti ti-alert-triangle me-2"></i>
            Please sign in to view your profile.
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Card className="shadow-sm">
        <Card.Header className="bg-light">
          <h4 className="mb-0">Profile Settings</h4>
        </Card.Header>
        <Card.Body>
          <div className="text-center mb-4">
            <div className="d-flex justify-content-center mb-3">
              <UserAvatar user={session.user} size={100} />
            </div>
            <h5>{session.user.name}</h5>
            <p className="text-muted">{session.user.email}</p>
          </div>

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>WhatsApp Number</Form.Label>
              <Form.Control
                type="tel"
                placeholder="Enter 10-digit number"
                value={whatsappNumber}
                onChange={(e) => {
                  // Remove any non-digit characters
                  const cleaned = e.target.value.replace(/\D/g, "");
                  // Limit to 10 digits
                  const truncated = cleaned.slice(0, 10);
                  setWhatsappNumber(truncated);
                }}
                pattern="[0-9]{10}"
                maxLength={10}
                title="Please enter a 10-digit phone number"
                className="font-monospace"
              />
              <Form.Text className="text-muted">
                This will be used for order communications. Format: 9876543210
                (10 digits)
              </Form.Text>
            </Form.Group>

            <Button
              type="submit"
              variant="success"
              className="w-100"
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Update Profile"}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
