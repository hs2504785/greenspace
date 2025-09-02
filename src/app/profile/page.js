"use client";

import { useState, useEffect } from "react";
import { Container, Card, Form, Button, Badge } from "react-bootstrap";
import { useSession } from "next-auth/react";
import UserAvatar from "@/components/common/UserAvatar";
import LocationAutoDetect from "@/components/common/LocationAutoDetect";
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

          if (data.user?.whatsapp_store_link) {
            console.log(
              "Setting WhatsApp store link from profile:",
              data.user.whatsapp_store_link
            );
            setWhatsappStoreLink(data.user.whatsapp_store_link);
          } else {
            console.log("No WhatsApp store link found in profile data");
            setWhatsappStoreLink("");
          }

          if (data.user?.location) {
            console.log("Setting location from profile:", data.user.location);
            setLocation(data.user.location);
          } else {
            console.log("No location found in profile data");
            setLocation(""); // ✅ Ensure field is empty if no data
          }

          // Set privacy preferences from API response
          console.log("Setting privacy preferences from profile:", {
            show_email_publicly: data.user?.show_email_publicly,
            show_phone_publicly: data.user?.show_phone_publicly,
            show_whatsapp_publicly: data.user?.show_whatsapp_publicly,
            profile_public: data.user?.profile_public,
          });

          setShowEmailPublicly(Boolean(data.user?.show_email_publicly));
          setShowPhonePublicly(Boolean(data.user?.show_phone_publicly));
          setShowWhatsappPublicly(Boolean(data.user?.show_whatsapp_publicly));
          setProfilePublic(data.user?.profile_public !== false); // Default to true
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
        }
      } else {
        console.log("No session or email found, skipping profile fetch");
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
    
    // For Google Maps shortened links, we can't extract directly
    // But we can provide a helpful message
    if (locationText.includes("maps.app.goo.gl") || locationText.includes("goo.gl/maps")) {
      console.log("📍 Google Maps shortened link detected. For precise distance calculations, please use the 'Detect Location' button instead.");
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Try to extract coordinates from location text if coordinates are not set
    let finalCoordinates = coordinates;
    if (!coordinates && location) {
      const extractedCoords = await tryExtractCoordinatesFromLocation(location);
      if (extractedCoords) {
        finalCoordinates = extractedCoords;
        setCoordinates(extractedCoords);
        console.log("Extracted coordinates from location:", extractedCoords);
      }
    }

    console.log("Submitting profile update:", {
      whatsappNumber,
      location,
      coordinates: finalCoordinates,
      showEmailPublicly,
      showPhonePublicly,
      showWhatsappPublicly,
      profilePublic,
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
          whatsapp_store_link: whatsappStoreLink,
          location: location,
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
                {location && (location.includes("maps.app.goo.gl") || location.includes("goo.gl/maps")) && (
                  <div className="mt-2">
                    <small className="text-warning">
                      <i className="ti-info-alt me-1"></i>
                      For precise distance calculations, consider using the "Detect Location" button instead of shortened Google Maps links.
                    </small>
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
                <Card className="mt-4">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">
                      <i className="ti ti-shield-lock me-2"></i>
                      Privacy Settings
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-3">
                      <Form.Check
                        type="switch"
                        id="profile-public"
                        label="Show my profile in community listings"
                        checked={profilePublic}
                        onChange={(e) => setProfilePublic(e.target.checked)}
                        disabled={isLoading}
                      />
                      <Form.Text className="text-muted">
                        Control whether your profile appears in the public
                        community page
                      </Form.Text>
                    </div>

                    <div className="mb-3">
                      <h6 className="text-muted mb-2">
                        Contact Information Visibility
                      </h6>
                      <p className="small text-muted mb-2">
                        Choose what contact information to show when people
                        click on your profile in community listings:
                      </p>

                      <Form.Check
                        type="switch"
                        id="show-email"
                        label="Show my email address"
                        checked={showEmailPublicly}
                        onChange={(e) => setShowEmailPublicly(e.target.checked)}
                        disabled={isLoading}
                        className="mb-2"
                      />

                      <Form.Check
                        type="switch"
                        id="show-whatsapp"
                        label="Show my WhatsApp number"
                        checked={showWhatsappPublicly}
                        onChange={(e) =>
                          setShowWhatsappPublicly(e.target.checked)
                        }
                        disabled={isLoading}
                        className="mb-2"
                      />

                      <Form.Check
                        type="switch"
                        id="show-phone"
                        label="Show my phone number"
                        checked={showPhonePublicly}
                        onChange={(e) => setShowPhonePublicly(e.target.checked)}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="alert alert-info d-flex align-items-start">
                      <i className="ti ti-info-circle me-2 flex-shrink-0 mt-1"></i>
                      <div>
                        <small>
                          <strong>Privacy Note:</strong> Your contact
                          information will only be visible when someone clicks
                          on your profile in community listings. This helps
                          buyers connect with local sellers while maintaining
                          your privacy control.
                        </small>
                      </div>
                    </div>
                  </Card.Body>
                </Card>

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
