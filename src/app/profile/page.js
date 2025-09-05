"use client";

import { useState, useEffect } from "react";
import { Container, Card, Form, Button, Badge } from "react-bootstrap";
import { useSession } from "next-auth/react";
import UserAvatar from "@/components/common/UserAvatar";
import LocationAutoDetect from "@/components/common/LocationAutoDetect";
import ToggleSwitch from "@/components/common/ToggleSwitch";
import { extractCoordinates } from "@/utils/distanceUtils";
import toastService from "@/utils/toastService";

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappStoreLink, setWhatsappStoreLink] = useState("");
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState(null);
  const [showEmailPublicly, setShowEmailPublicly] = useState(false);
  const [showPhonePublicly, setShowPhonePublicly] = useState(false);
  const [showWhatsappPublicly, setShowWhatsappPublicly] = useState(false);
  const [profilePublic, setProfilePublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize and update whatsappNumber when session changes
  useEffect(() => {
    async function fetchUserProfile() {
      if (session?.user?.email) {
        // ✅ Check for email instead of ID
        try {
          const response = await fetch("/api/users/profile");
          const data = await response.json();

          if (data.user?.whatsapp_number) {
            setWhatsappNumber(data.user.whatsapp_number);
          } else {
            setWhatsappNumber(""); // ✅ Ensure field is empty if no data
          }

          if (data.user?.whatsapp_store_link) {
            setWhatsappStoreLink(data.user.whatsapp_store_link);
          } else {
            setWhatsappStoreLink("");
          }

          if (data.user?.location) {
            setLocation(data.user.location);
          } else {
            setLocation(""); // ✅ Ensure field is empty if no data
          }

          // Set privacy preferences from API response

          setShowEmailPublicly(Boolean(data.user?.show_email_publicly));
          setShowPhonePublicly(Boolean(data.user?.show_phone_publicly));
          setShowWhatsappPublicly(Boolean(data.user?.show_whatsapp_publicly));
          setProfilePublic(data.user?.profile_public !== false); // Default to true
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
        }
      } else {
      }
    }

    fetchUserProfile();
  }, [session]);

  // Helper function to try extracting coordinates from location text
  const tryExtractCoordinatesFromLocation = async (locationText) => {
    if (!locationText) return null;

    // Try to extract coordinates using the existing utility
    const coords = extractCoordinates(locationText);
    if (coords) {
      return { ...coords, accuracy: 100 }; // Assume moderate accuracy for extracted coordinates
    }

    // For Google Maps shortened links, try to expand them
    if (
      locationText.includes("maps.app.goo.gl") ||
      locationText.includes("goo.gl/maps")
    ) {
      console.log(
        "📍 Google Maps shortened link detected. Attempting to expand URL..."
      );

      try {
        // Try to expand the shortened URL using a simple fetch (may be blocked by CORS)
        const response = await fetch(
          `/api/expand-url?url=${encodeURIComponent(locationText)}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.expandedUrl) {
            const expandedCoords = extractCoordinates(data.expandedUrl);
            if (expandedCoords) {
              console.log(
                "✅ Successfully extracted coordinates from expanded URL:",
                expandedCoords
              );
              return { ...expandedCoords, accuracy: 100 };
            }
          }
        }
      } catch (error) {
        console.log("❌ Could not expand shortened URL:", error.message);
      }

      console.log(
        "💡 For precise distance calculations, please use the 'Detect Location' button instead."
      );
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Try to extract coordinates from location text if coordinates are not set
    let finalCoordinates = coordinates;
    let finalLocation = location;

    if (!coordinates && location) {
      const extractedCoords = await tryExtractCoordinatesFromLocation(location);
      if (extractedCoords) {
        finalCoordinates = extractedCoords;
        setCoordinates(extractedCoords);
        console.log("Extracted coordinates from location:", extractedCoords);

        // If it's a long Google Maps URL, create a shorter clickable link
        if (location.length > 200 && location.includes("google.com/maps")) {
          // Create the shortest possible Google Maps URL (under 200 chars)
          finalLocation = `https://maps.google.com/?q=${extractedCoords.lat},${extractedCoords.lon}`;
          console.log(
            "Converted long URL to shorter clickable link:",
            finalLocation
          );
        }
      }
    }

    try {
      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          whatsapp_number: whatsappNumber,
          whatsapp_store_link: whatsappStoreLink,
          location: finalLocation,
          coordinates: finalCoordinates,
          show_email_publicly: showEmailPublicly,
          show_phone_publicly: showPhonePublicly,
          show_whatsapp_publicly: showWhatsappPublicly,
          profile_public: profilePublic,
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

        // Update the location field if it was converted from a long URL
        if (finalLocation !== location) {
          setLocation(finalLocation);
          console.log(
            "Updated location field to shorter format:",
            finalLocation
          );
        }

        // Session will be updated automatically on next page load
        console.log(
          "Profile updated successfully, session will refresh automatically"
        );
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
      <Container className="pb-4">
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
    <Container className="pb-4">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-6">
          <Card className="shadow-sm">
            <Card.Header className="bg-light">
              <h4 className="mb-0">
                <i className="ti ti-user me-2"></i>
                Profile Settings
              </h4>
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
                    This will be used for order communications. Format:
                    9876543210 (10 digits)
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    WhatsApp Store Link
                    <Badge bg="info" className="ms-2 small">
                      Optional
                    </Badge>
                  </Form.Label>
                  <Form.Control
                    type="url"
                    placeholder="https://wa.me/c/919876543210 or your store URL"
                    value={whatsappStoreLink}
                    onChange={(e) => setWhatsappStoreLink(e.target.value)}
                    maxLength={500}
                  />
                  <Form.Text className="text-muted">
                    Link to your WhatsApp Business catalog or external store.
                    This helps customers see your complete product range beyond
                    platform listings.
                    <br />
                    <strong>Examples:</strong> WhatsApp Business catalog, Google
                    Drive folder, or website
                  </Form.Text>
                </Form.Group>

                <LocationAutoDetect
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onCoordinatesChange={(coords, accuracy) => {
                    setCoordinates({ ...coords, accuracy });
                    console.log(
                      "Coordinates updated:",
                      coords,
                      "Accuracy:",
                      accuracy
                    );
                  }}
                  name="location"
                  placeholder="e.g., Bangalore, Karnataka or My Farm, Village Name"
                  label={
                    <>
                      <i className="ti ti-map-pin me-2"></i>
                      Default Location
                    </>
                  }
                  helpText="Your default farm/garden location. This will be pre-filled when you add products, helping buyers find sellers nearby."
                  className="mb-3"
                  disabled={isLoading}
                />

                {/* Show helpful message for Google Maps links */}
                {location &&
                  (location.includes("maps.app.goo.gl") ||
                    location.includes("goo.gl/maps")) && (
                    <div className="mt-2">
                      <div className="alert alert-warning py-2">
                        <div className="d-flex align-items-start">
                          <i className="ti-info-alt me-2 mt-1"></i>
                          <div className="flex-grow-1">
                            <strong>Google Maps Link Detected</strong>
                            <p className="mb-2 small">
                              Shortened Google Maps links can't be used for
                              distance calculations. Here are better options:
                            </p>
                            <div className="d-flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() => {
                                  const instructions = `To get your exact address from this Google Maps link:

1. Click on your Google Maps link: ${location}
2. When it opens, right-click on your exact location
3. Select "What's here?" from the menu
4. Copy the address or coordinates that appear
5. Come back and paste it in the location field

This will enable accurate distance calculations for customers finding you.`;
                                  alert(instructions);
                                }}
                              >
                                <i className="ti-help me-1"></i>
                                How to Fix This
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-success"
                                onClick={() => {
                                  window.open(location, "_blank");
                                }}
                              >
                                <i className="ti-external-link me-1"></i>
                                Open Maps Link
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Show coordinate status */}
                {coordinates && (
                  <div className="mt-2">
                    <small className="text-success">
                      <i className="ti-check me-1"></i>
                      Precise coordinates available for distance calculations
                    </small>
                  </div>
                )}

                {/* Privacy Settings Section */}
                <div className="mt-4">
                  <div className="mb-4">
                    <h5 className="mb-3 d-flex align-items-center">
                      <i className="ti ti-shield-lock me-2 text-primary"></i>
                      Privacy Settings
                    </h5>

                    <div className="bg-light rounded-3 p-4">
                      <div className="mb-4">
                        <ToggleSwitch
                          id="profile-public"
                          label="Show my profile in community listings"
                          description="Control whether your profile appears in the public community page"
                          checked={profilePublic}
                          onChange={setProfilePublic}
                          disabled={isLoading}
                          variant="success"
                          showDescription={true}
                        />
                      </div>

                      <div className="mb-4">
                        <h6 className="text-muted mb-3 fw-semibold">
                          Contact Information Visibility
                        </h6>
                        <p className="small text-muted mb-3">
                          Choose what contact information to show when people
                          click on your profile in community listings:
                        </p>

                        <div className="d-flex flex-column gap-3">
                          <ToggleSwitch
                            id="show-email"
                            label="Show my email address"
                            checked={showEmailPublicly}
                            onChange={setShowEmailPublicly}
                            disabled={isLoading}
                            variant="success"
                          />

                          <ToggleSwitch
                            id="show-whatsapp"
                            label="Show my WhatsApp number"
                            checked={showWhatsappPublicly}
                            onChange={setShowWhatsappPublicly}
                            disabled={isLoading}
                            variant="success"
                          />

                          <ToggleSwitch
                            id="show-phone"
                            label="Show my phone number"
                            checked={showPhonePublicly}
                            onChange={setShowPhonePublicly}
                            disabled={isLoading}
                            variant="success"
                          />
                        </div>
                      </div>

                      <div
                        className="alert alert-info border-0 d-flex align-items-start mb-0"
                        style={{ backgroundColor: "#e3f2fd" }}
                      >
                        <i className="ti ti-info-circle me-2 flex-shrink-0 mt-1 text-info"></i>
                        <div>
                          <small className="text-info-emphasis">
                            <strong>Privacy Note:</strong> Your contact
                            information will only be visible when someone clicks
                            on your profile in community listings. This helps
                            buyers connect with local sellers while maintaining
                            your privacy control.
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="success"
                  className="w-100 mt-3"
                  disabled={isLoading}
                >
                  {isLoading ? "Updating..." : "Update Profile"}
                </Button>
              </Form>

              {/* Quick Link to Notifications */}
              <div className="text-center mt-4 pt-3 border-top">
                <small className="text-muted d-block mb-2">
                  Want to manage your notification preferences?
                </small>
                <Button
                  as="a"
                  href="/notifications"
                  variant="outline-primary"
                  size="sm"
                >
                  <i className="ti ti-bell me-2"></i>
                  Notification Settings
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </Container>
  );
}
