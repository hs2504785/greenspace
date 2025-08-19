"use client";

import { useState, useEffect } from "react";
import { Form, Button, InputGroup, Alert, Spinner } from "react-bootstrap";

const LocationAutoDetect = ({
  value = "",
  onChange,
  name = "location",
  placeholder = "Enter your location",
  required = false,
  className = "",
  disabled = false,
  label = "Location",
  showRequiredIndicator = false,
  helpText = "",
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState(null);
  const [hasGeolocationSupport, setHasGeolocationSupport] = useState(false);
  const [wasAutoDetected, setWasAutoDetected] = useState(false);
  const [showEditHint, setShowEditHint] = useState(false);

  useEffect(() => {
    // Check if geolocation is supported
    setHasGeolocationSupport("geolocation" in navigator);
    console.log("🔧 LocationAutoDetect initialized:", {
      name,
      disabled,
      hasValue: !!value,
      geolocationSupported: "geolocation" in navigator,
    });
  }, [name, disabled, value]);

  const detectLocation = async () => {
    if (!hasGeolocationSupport) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    setIsDetecting(true);
    setError(null);

    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;

      // Use reverse geocoding to get address
      const address = await reverseGeocode(latitude, longitude);

      if (address) {
        onChange({ target: { value: address, name: name } });
        setWasAutoDetected(true);
        setShowEditHint(true);
        // Hide edit hint after 5 seconds
        setTimeout(() => setShowEditHint(false), 5000);
      } else {
        // Fallback to coordinates if reverse geocoding fails
        const coordsString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        onChange({ target: { value: coordsString, name: name } });
        setWasAutoDetected(true);
      }
    } catch (error) {
      console.error("Error detecting location:", error);
      setError(getLocationError(error));
    } finally {
      setIsDetecting(false);
    }
  };

  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 20000, // 20 seconds for better accuracy
        maximumAge: 60000, // 1 minute cache for fresher location data
      });
    });
  };

  const reverseGeocode = async (latitude, longitude) => {
    // Try multiple geocoding services for best accuracy
    const geocodingResults = await Promise.allSettled([
      tryGoogleGeocoding(latitude, longitude),
      tryNominatimGeocoding(latitude, longitude),
      tryPositionStackGeocoding(latitude, longitude),
    ]);

    // Return the first successful result
    for (const result of geocodingResults) {
      if (result.status === "fulfilled" && result.value) {
        return result.value;
      }
    }

    return null;
  };

  const tryGoogleGeocoding = async (latitude, longitude) => {
    try {
      // Check if Google Maps API key is available (you can add this to your .env.local)
      const apiKey =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
          : null;

      if (!apiKey) {
        console.log("Google Maps API key not found, skipping Google geocoding");
        return null;
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=en&region=in`
      );

      if (!response.ok) {
        throw new Error("Google geocoding service unavailable");
      }

      const data = await response.json();

      if (data.status === "OK" && data.results && data.results.length > 0) {
        // Get the most detailed result (usually the first one)
        const result = data.results[0];

        // Google provides very detailed formatted addresses
        let address = result.formatted_address;

        // Clean up the address for Indian locations
        address = address.replace(/,\s*India\s*$/i, "");
        address = address.replace(/,\s*\d{6}\s*,/g, ",").trim();

        console.log("Google geocoding result:", address);
        return address;
      }

      return null;
    } catch (error) {
      console.error("Google geocoding error:", error);
      return null;
    }
  };

  const tryPositionStackGeocoding = async (latitude, longitude) => {
    try {
      // PositionStack is another good geocoding service (has free tier)
      const apiKey =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_POSITIONSTACK_API_KEY
          : null;

      if (!apiKey) {
        return null;
      }

      const response = await fetch(
        `https://api.positionstack.com/v1/reverse?access_key=${apiKey}&query=${latitude},${longitude}&limit=1&country=IN`
      );

      if (!response.ok) {
        throw new Error("PositionStack geocoding service unavailable");
      }

      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const result = data.data[0];
        const parts = [];

        if (result.name && result.name !== result.locality) {
          parts.push(result.name);
        }
        if (result.street) {
          parts.push(result.street);
        }
        if (result.locality) {
          parts.push(result.locality);
        }
        if (result.administrative_area) {
          parts.push(result.administrative_area);
        }

        return parts.length > 0 ? parts.join(", ") : result.label || null;
      }

      return null;
    } catch (error) {
      console.error("PositionStack geocoding error:", error);
      return null;
    }
  };

  const tryNominatimGeocoding = async (latitude, longitude) => {
    try {
      // Enhanced Nominatim with multiple zoom levels for better accuracy
      const zoomLevels = [18, 17, 16]; // Try highest precision first

      for (const zoom of zoomLevels) {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=${zoom}&addressdetails=1&namedetails=1&extratags=1`,
          {
            headers: {
              "User-Agent": "GreenSpace-App",
            },
          }
        );

        if (!response.ok) continue;

        const data = await response.json();

        if (data && data.address) {
          const address = data.address;
          const parts = [];

          // More comprehensive address parsing
          if (address.house_number && address.road) {
            parts.push(`${address.house_number}, ${address.road}`);
          } else if (address.road) {
            parts.push(address.road);
          }

          // Add building/place name if available
          if (data.name && !parts.some((part) => part.includes(data.name))) {
            parts.push(data.name);
          }

          // Add neighborhood/suburb details
          if (
            address.neighbourhood ||
            address.suburb ||
            address.quarter ||
            address.hamlet
          ) {
            const area =
              address.neighbourhood ||
              address.suburb ||
              address.quarter ||
              address.hamlet;
            if (!parts.some((part) => part.includes(area))) {
              parts.push(area);
            }
          }

          // Add city/town/village
          if (address.city || address.town || address.village) {
            const cityName = address.city || address.town || address.village;
            if (!parts.some((part) => part.includes(cityName))) {
              parts.push(cityName);
            }
          }

          // Add state
          if (
            address.state &&
            !parts.some((part) => part.includes(address.state))
          ) {
            parts.push(address.state);
          }

          // Add postal code if available
          if (address.postcode) {
            parts.push(address.postcode);
          }

          if (parts.length > 0) {
            const formattedAddress = parts.join(", ");
            console.log(`Nominatim zoom ${zoom} result:`, formattedAddress);
            return formattedAddress;
          }
        }
      }

      return null;
    } catch (error) {
      console.error("Nominatim geocoding error:", error);
      return null;
    }
  };

  const getLocationError = (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return "Location access denied. Please enable location permissions and try again.";
      case error.POSITION_UNAVAILABLE:
        return "Location information is unavailable. Please enter your location manually.";
      case error.TIMEOUT:
        return "Location request timed out. Please try again or enter manually.";
      default:
        return "Unable to detect location. Please enter your location manually.";
    }
  };

  const handleInputChange = (e) => {
    console.log("🔄 LocationAutoDetect input change:", {
      name: name,
      value: e.target.value,
      disabled: disabled || isDetecting,
    });

    // Clear error when user starts typing
    if (error) setError(null);
    // Clear auto-detected state when user manually edits
    if (wasAutoDetected) {
      setWasAutoDetected(false);
      setShowEditHint(false);
    }
    // Ensure the event has the proper name attribute for form handling
    const event = {
      ...e,
      target: {
        ...e.target,
        name: name, // Use the dynamic name prop
        value: e.target.value,
      },
    };
    onChange(event);
  };

  const dismissError = () => {
    setError(null);
  };

  return (
    <Form.Group className={className}>
      {label && (
        <Form.Label className="fw-medium">
          {label}
          {showRequiredIndicator && required && (
            <span className="text-danger ms-1">*</span>
          )}
        </Form.Label>
      )}

      <InputGroup>
        <Form.Control
          type="text"
          name={name}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled || isDetecting}
          className={`${error ? "is-invalid" : ""} ${
            wasAutoDetected ? "border-success" : ""
          }`}
          style={
            wasAutoDetected
              ? {
                  boxShadow: "0 0 0 0.2rem rgba(40, 167, 69, 0.25)",
                }
              : {}
          }
        />

        {hasGeolocationSupport && (
          <Button
            variant="outline-primary"
            onClick={detectLocation}
            disabled={disabled || isDetecting}
            title="Detect my current location"
            className="d-flex align-items-center"
          >
            {isDetecting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-1"
                />
                <span className="d-none d-sm-inline">Detecting...</span>
              </>
            ) : (
              <>
                <i className="ti-location-pin me-1"></i>
                <span className="d-none d-sm-inline">Detect</span>
              </>
            )}
          </Button>
        )}
      </InputGroup>

      {error && (
        <Alert
          variant="warning"
          className="mt-2 mb-0 py-2 px-3 small d-flex align-items-center justify-content-between"
          dismissible
          onClose={dismissError}
        >
          <div className="d-flex align-items-center">
            <i className="ti-alert-circle me-2 flex-shrink-0"></i>
            <span>{error}</span>
          </div>
        </Alert>
      )}

      {showEditHint && !error && (
        <Alert
          variant="success"
          className="mt-2 mb-0 py-2 px-3 small d-flex align-items-center justify-content-between"
          dismissible
          onClose={() => setShowEditHint(false)}
        >
          <div className="d-flex align-items-center">
            <i className="ti-check-circle me-2 flex-shrink-0"></i>
            <span>
              Location detected! You can now edit it to add more specific
              details like plot number, building name, etc.
            </span>
          </div>
        </Alert>
      )}

      {helpText && !error && (
        <Form.Text className="text-muted d-flex align-items-center">
          <i className="ti-info-circle me-1"></i>
          {helpText}
        </Form.Text>
      )}

      {!error && hasGeolocationSupport && !showEditHint && (
        <Form.Text className="text-muted small">
          <i className="ti-target me-1"></i>
          Click "Detect" to auto-fill your current location, then edit to add
          specific details
        </Form.Text>
      )}

      {wasAutoDetected && !showEditHint && !error && (
        <Form.Text className="text-success small d-flex align-items-center">
          <i className="ti-check me-1"></i>
          Auto-detected location - feel free to edit and add more specific
          details
        </Form.Text>
      )}

      {!hasGeolocationSupport && (
        <Form.Text className="text-muted d-flex align-items-center">
          <i className="ti-info-circle me-1"></i>
          Location auto-detection is not available in this browser
        </Form.Text>
      )}
    </Form.Group>
  );
};

export default LocationAutoDetect;
