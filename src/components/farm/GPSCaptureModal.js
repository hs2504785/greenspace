"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  Alert,
  Spinner,
  Badge,
  Row,
  Col,
  Card,
  InputGroup,
} from "react-bootstrap";
import { toast } from "react-hot-toast";

const GPSCaptureModal = ({
  show,
  onHide,
  selectedTree,
  selectedPosition,
  onLocationUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [locationData, setLocationData] = useState({
    latitude: "",
    longitude: "",
    altitude: "",
    accuracy: null,
    source: "manual",
  });
  const [gpsSupported, setGpsSupported] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    // Check if geolocation is supported
    setGpsSupported("geolocation" in navigator);

    // Pre-fill with existing coordinates if available from any source
    let existingCoords = null;

    if (selectedPosition) {
      existingCoords = selectedPosition;
    } else if (
      selectedTree?.tree_positions &&
      selectedTree.tree_positions.length > 0
    ) {
      existingCoords = selectedTree.tree_positions[0];
    } else if (selectedTree?.latitude !== undefined) {
      existingCoords = selectedTree;
    }

    if (existingCoords) {
      setLocationData({
        latitude: existingCoords.latitude || "",
        longitude: existingCoords.longitude || "",
        altitude: existingCoords.altitude || "",
        accuracy: existingCoords.gps_accuracy || null,
        source: existingCoords.coordinate_source || "manual",
      });
    }
  }, [selectedPosition, selectedTree]);

  const captureCurrentLocation = () => {
    if (!gpsSupported) {
      toast.error("GPS is not supported on this device");
      return;
    }

    setCapturing(true);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, altitude, accuracy } = position.coords;

        setLocationData({
          latitude: latitude.toFixed(8),
          longitude: longitude.toFixed(8),
          altitude: altitude ? altitude.toFixed(2) : "",
          accuracy: Math.round(accuracy),
          source: "gps",
        });

        setCurrentLocation({
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          timestamp: new Date(),
        });

        setCapturing(false);
        toast.success(
          `Location captured with ±${Math.round(accuracy)}m accuracy`
        );
      },
      (error) => {
        setCapturing(false);
        let errorMessage = "Failed to get location";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Location access denied. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
        }

        toast.error(errorMessage);
        console.error("Geolocation error:", error);
      },
      options
    );
  };

  const handleInputChange = (field, value) => {
    setLocationData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateCoordinates = () => {
    const lat = parseFloat(locationData.latitude);
    const lon = parseFloat(locationData.longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      toast.error("Latitude must be between -90 and 90 degrees");
      return false;
    }

    if (isNaN(lon) || lon < -180 || lon > 180) {
      toast.error("Longitude must be between -180 and 180 degrees");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    // Try to get position ID from different sources
    let positionId = null;

    if (selectedPosition?.id) {
      positionId = selectedPosition.id;
    } else if (
      selectedTree?.tree_positions &&
      selectedTree.tree_positions.length > 0
    ) {
      // If selectedTree has tree_positions array, use the first one
      positionId = selectedTree.tree_positions[0].id;
    } else if (selectedTree?.id && selectedTree?.grid_x !== undefined) {
      // If selectedTree is actually a tree position object
      positionId = selectedTree.id;
    }

    if (!positionId) {
      toast.error(
        "No tree position selected. Please select a planted tree from the farm layout."
      );
      console.error("Debug - selectedPosition:", selectedPosition);
      console.error("Debug - selectedTree:", selectedTree);
      return;
    }

    if (!locationData.latitude || !locationData.longitude) {
      toast.error("Please provide both latitude and longitude");
      return;
    }

    if (!validateCoordinates()) {
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        latitude: parseFloat(locationData.latitude),
        longitude: parseFloat(locationData.longitude),
        coordinate_source: locationData.source,
      };

      if (locationData.altitude) {
        updateData.altitude = parseFloat(locationData.altitude);
      }

      if (locationData.accuracy) {
        updateData.gps_accuracy = parseInt(locationData.accuracy);
      }

      console.log(
        "Updating tree position:",
        positionId,
        "with data:",
        updateData
      );

      const response = await fetch(`/api/tree-positions/${positionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update location");
      }

      const updatedPosition = await response.json();

      toast.success("GPS coordinates saved successfully!");

      if (onLocationUpdated) {
        onLocationUpdated(updatedPosition);
      }

      onHide();
    } catch (error) {
      console.error("Error saving GPS coordinates:", error);
      toast.error(error.message || "Failed to save GPS coordinates");
    } finally {
      setLoading(false);
    }
  };

  const getAccuracyBadge = (accuracy) => {
    if (!accuracy) return null;

    let variant = "secondary";
    let text = "Unknown";

    if (accuracy < 5) {
      variant = "success";
      text = "High Precision";
    } else if (accuracy < 15) {
      variant = "warning";
      text = "Medium Precision";
    } else {
      variant = "danger";
      text = "Low Precision";
    }

    return (
      <Badge bg={variant}>
        {text} (±{accuracy}m)
      </Badge>
    );
  };

  const formatCoordinates = (lat, lon) => {
    if (!lat || !lon) return "Not available";
    return `${parseFloat(lat).toFixed(6)}°N, ${parseFloat(lon).toFixed(6)}°E`;
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title className="d-flex align-items-center">
          <i className="ti-location-pin me-2"></i>
          GPS Location Capture
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="mb-4">
          <h6 className="text-muted mb-2">Tree Information</h6>
          <div className="d-flex align-items-center">
            <Badge bg="secondary" className="me-2">
              {selectedTree?.code || selectedTree?.trees?.code}
            </Badge>
            <span className="fw-bold">
              {selectedTree?.name || selectedTree?.trees?.name}
            </span>
            <span className="text-muted ms-2">
              {selectedPosition ? (
                <>
                  • Block {(selectedPosition.block_index || 0) + 1}, Position (
                  {selectedPosition.grid_x}, {selectedPosition.grid_y})
                </>
              ) : selectedTree?.tree_positions &&
                selectedTree.tree_positions.length > 0 ? (
                <>
                  • Block{" "}
                  {(selectedTree.tree_positions[0].block_index || 0) + 1},
                  Position ({selectedTree.tree_positions[0].grid_x},{" "}
                  {selectedTree.tree_positions[0].grid_y})
                </>
              ) : selectedTree?.grid_x !== undefined ? (
                <>
                  • Block {(selectedTree.block_index || 0) + 1}, Position (
                  {selectedTree.grid_x}, {selectedTree.grid_y})
                </>
              ) : (
                "• Position information not available"
              )}
            </span>
          </div>
        </div>

        {/* Current Location Status */}
        {(() => {
          // Find existing GPS coordinates from any available source
          let existingCoords = null;

          if (selectedPosition?.latitude && selectedPosition?.longitude) {
            existingCoords = selectedPosition;
          } else if (
            selectedTree?.tree_positions &&
            selectedTree.tree_positions.length > 0
          ) {
            const pos = selectedTree.tree_positions[0];
            if (pos.latitude && pos.longitude) {
              existingCoords = pos;
            }
          } else if (selectedTree?.latitude && selectedTree?.longitude) {
            existingCoords = selectedTree;
          }

          return existingCoords ? (
            <Alert variant="info" className="mb-4">
              <Alert.Heading className="h6">
                <i className="ti-check me-2"></i>
                Current GPS Location
              </Alert.Heading>
              <div className="mb-2">
                <strong>Coordinates:</strong>{" "}
                {formatCoordinates(
                  existingCoords.latitude,
                  existingCoords.longitude
                )}
              </div>
              {existingCoords.gps_accuracy && (
                <div className="mb-2">
                  <strong>Accuracy:</strong>{" "}
                  {getAccuracyBadge(existingCoords.gps_accuracy)}
                </div>
              )}
              {existingCoords.coordinates_captured_at && (
                <div>
                  <strong>Captured:</strong>{" "}
                  {new Date(
                    existingCoords.coordinates_captured_at
                  ).toLocaleString()}
                </div>
              )}
            </Alert>
          ) : null;
        })()}

        {/* GPS Capture Section */}
        <Card className="mb-4">
          <Card.Header className="bg-light">
            <h6 className="mb-0">
              <i className="ti-target me-2"></i>
              Automatic GPS Capture
            </h6>
          </Card.Header>
          <Card.Body>
            {gpsSupported ? (
              <div>
                <p className="text-muted mb-3">
                  Use your device's GPS to automatically capture the current
                  location. This provides the most accurate coordinates.
                </p>
                <Button
                  variant="success"
                  onClick={captureCurrentLocation}
                  disabled={capturing}
                  className="d-flex align-items-center"
                >
                  {capturing ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Capturing Location...
                    </>
                  ) : (
                    <>
                      <i className="ti-location-pin me-2"></i>
                      Capture Current Location
                    </>
                  )}
                </Button>

                {currentLocation && (
                  <Alert variant="success" className="mt-3 mb-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>Location Captured!</strong>
                        <br />
                        <small>
                          {formatCoordinates(
                            currentLocation.latitude,
                            currentLocation.longitude
                          )}
                          {getAccuracyBadge(currentLocation.accuracy) && (
                            <span className="ms-2">
                              {getAccuracyBadge(currentLocation.accuracy)}
                            </span>
                          )}
                        </small>
                      </div>
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => {
                          const url = `https://www.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}`;
                          window.open(url, "_blank");
                        }}
                      >
                        <i className="ti-map"></i>
                      </Button>
                    </div>
                  </Alert>
                )}
              </div>
            ) : (
              <Alert variant="warning" className="mb-0">
                <i className="ti-alert-triangle me-2"></i>
                GPS is not supported on this device. Please enter coordinates
                manually.
              </Alert>
            )}
          </Card.Body>
        </Card>

        {/* Manual Entry Section */}
        <Card>
          <Card.Header className="bg-light">
            <h6 className="mb-0">
              <i className="ti-pencil me-2"></i>
              Manual Coordinate Entry
            </h6>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Latitude *</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      step="0.00000001"
                      placeholder="e.g., 12.9716"
                      value={locationData.latitude}
                      onChange={(e) =>
                        handleInputChange("latitude", e.target.value)
                      }
                    />
                    <InputGroup.Text>°N</InputGroup.Text>
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Range: -90 to 90 degrees
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Longitude *</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      step="0.00000001"
                      placeholder="e.g., 77.5946"
                      value={locationData.longitude}
                      onChange={(e) =>
                        handleInputChange("longitude", e.target.value)
                      }
                    />
                    <InputGroup.Text>°E</InputGroup.Text>
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Range: -180 to 180 degrees
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Altitude (optional)</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      step="0.01"
                      placeholder="e.g., 920.5"
                      value={locationData.altitude}
                      onChange={(e) =>
                        handleInputChange("altitude", e.target.value)
                      }
                    />
                    <InputGroup.Text>meters</InputGroup.Text>
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Height above sea level
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Accuracy (optional)</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      placeholder="e.g., 5"
                      value={locationData.accuracy || ""}
                      onChange={(e) =>
                        handleInputChange("accuracy", e.target.value)
                      }
                    />
                    <InputGroup.Text>±meters</InputGroup.Text>
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Estimated accuracy radius
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Coordinate Source</Form.Label>
              <Form.Select
                value={locationData.source}
                onChange={(e) => handleInputChange("source", e.target.value)}
              >
                <option value="manual">Manual Entry</option>
                <option value="gps">GPS Device</option>
                <option value="survey">Professional Survey</option>
                <option value="satellite">Satellite Imagery</option>
                <option value="map">Map Estimation</option>
              </Form.Select>
            </Form.Group>

            {/* Preview */}
            {locationData.latitude && locationData.longitude && (
              <Alert variant="info" className="mb-0">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>Preview:</strong>
                    <br />
                    <small>
                      {formatCoordinates(
                        locationData.latitude,
                        locationData.longitude
                      )}
                    </small>
                    {locationData.accuracy && (
                      <span className="ms-2">
                        {getAccuracyBadge(parseInt(locationData.accuracy))}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="outline-info"
                    size="sm"
                    onClick={() => {
                      const url = `https://www.google.com/maps?q=${locationData.latitude},${locationData.longitude}`;
                      window.open(url, "_blank");
                    }}
                  >
                    <i className="ti-map me-1"></i>
                    View on Map
                  </Button>
                </div>
              </Alert>
            )}
          </Card.Body>
        </Card>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={
            loading || !locationData.latitude || !locationData.longitude
          }
        >
          {loading ? (
            <>
              <Spinner size="sm" className="me-2" />
              Saving...
            </>
          ) : (
            <>
              <i className="ti-check me-2"></i>
              Save GPS Location
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default GPSCaptureModal;
