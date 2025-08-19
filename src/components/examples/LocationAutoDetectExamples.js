"use client";

import { useState } from "react";
import { Container, Row, Col, Card, Form } from "react-bootstrap";
import LocationAutoDetect from "@/components/common/LocationAutoDetect";

/**
 * Examples of how to use the LocationAutoDetect component
 * This component can be used anywhere in the application where location input is needed
 */
export default function LocationAutoDetectExamples() {
  const [basicLocation, setBasicLocation] = useState("");
  const [profileLocation, setProfileLocation] = useState("");
  const [propertyLocation, setPropertyLocation] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");

  const handleLocationChange = (setter) => (e) => {
    setter(e.target.value);
  };

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <h2 className="mb-4">LocationAutoDetect Component Examples</h2>
          <p className="text-muted mb-4">
            Demonstrations of the reusable LocationAutoDetect component in
            different contexts.
          </p>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Basic Usage */}
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">Basic Usage</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted small mb-3">
                Simple location input with auto-detect functionality
              </p>

              <LocationAutoDetect
                value={basicLocation}
                onChange={handleLocationChange(setBasicLocation)}
                placeholder="Type location or click 'Detect' to auto-fill"
                label="Your Location"
                helpText="Auto-detect provides a starting point, then you can edit for precision"
              />

              {basicLocation && (
                <div className="mt-3 p-2 bg-light rounded">
                  <small className="text-muted">Selected: </small>
                  <strong>{basicLocation}</strong>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Required Field */}
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">Required Field</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted small mb-3">
                Location input with required validation and visual indicator
              </p>

              <LocationAutoDetect
                value={profileLocation}
                onChange={handleLocationChange(setProfileLocation)}
                placeholder="Enter your home address"
                label="Home Address"
                required
                showRequiredIndicator
                helpText="This will be used for delivery calculations"
              />

              {profileLocation && (
                <div className="mt-3 p-2 bg-light rounded">
                  <small className="text-muted">Address: </small>
                  <strong>{profileLocation}</strong>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Auto-Detect + Edit Workflow Example */}
        <Col md={12}>
          <Card className="border-success">
            <Card.Header className="bg-success bg-opacity-10">
              <h5 className="mb-0 text-success">
                <i className="ti-target me-2"></i>
                Auto-Detect + Edit Workflow Demo
              </h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted small mb-4">
                <strong>How it works:</strong> Click "Detect" to auto-fill
                approximate location (like "Narendra Nagar, Ameenapur,
                Telangana, 502032"), then edit the field to add specific details
                like "Plot No: 24, Shankar Green Homes, Ameenpur, Miyapur,
                Hyderabad, Telangana 502032"
              </p>

              <LocationAutoDetect
                value={propertyLocation}
                onChange={handleLocationChange(setPropertyLocation)}
                placeholder="Type or auto-detect, then customize with plot number, building name, etc."
                label="Property Address"
                required
                showRequiredIndicator
                helpText="Start with auto-detection, then refine with exact plot number, building/complex name, and landmarks"
                className="mb-3"
              />

              <div className="bg-info bg-opacity-10 p-3 rounded mb-3">
                <h6 className="text-info mb-2">
                  <i className="ti-bulb me-1"></i>
                  Pro Tips for Better Location Accuracy:
                </h6>
                <ul className="small mb-0 text-muted">
                  <li>
                    Use auto-detect to get neighborhood/area automatically
                  </li>
                  <li>Add plot number: "Plot 24, " at the beginning</li>
                  <li>Include building/complex name: "Shankar Green Homes"</li>
                  <li>
                    Add landmarks: "Near Metro Station" or "Opposite Park"
                  </li>
                  <li>
                    Include city if different from detected: "Miyapur,
                    Hyderabad"
                  </li>
                </ul>
              </div>

              {propertyLocation && (
                <div className="mt-3 p-3 bg-success bg-opacity-10 border border-success rounded">
                  <div className="d-flex align-items-center">
                    <i className="ti-map-pin text-success me-2"></i>
                    <div>
                      <small className="text-success fw-medium">
                        Final Address:
                      </small>
                      <div className="fw-bold">{propertyLocation}</div>
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Delivery Form Example */}
        <Col md={12}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Complete Delivery Form Example</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted small mb-4">
                Example of using LocationAutoDetect in a complete delivery form
              </p>

              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Customer Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter customer name"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number</Form.Label>
                      <Form.Control
                        type="tel"
                        placeholder="Enter phone number"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <LocationAutoDetect
                  value={deliveryLocation}
                  onChange={handleLocationChange(setDeliveryLocation)}
                  placeholder="Enter delivery address"
                  label="Delivery Address"
                  required
                  showRequiredIndicator
                  helpText="Please provide the complete address for accurate delivery"
                  className="mb-3"
                />

                <Form.Group className="mb-3">
                  <Form.Label>Special Instructions</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Any special delivery instructions..."
                  />
                </Form.Group>
              </Form>

              {deliveryLocation && (
                <div className="mt-3 p-3 bg-success bg-opacity-10 border border-success rounded">
                  <div className="d-flex align-items-center">
                    <i className="ti-map-pin text-success me-2"></i>
                    <div>
                      <small className="text-success fw-medium">
                        Delivery Address Set:
                      </small>
                      <div className="fw-bold">{deliveryLocation}</div>
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Component API Documentation */}
      <Row className="mt-4">
        <Col>
          <Card className="border-info">
            <Card.Header className="bg-info bg-opacity-10">
              <h5 className="mb-0 text-info">
                <i className="ti-code me-2"></i>
                Component API
              </h5>
            </Card.Header>
            <Card.Body>
              <h6>Props:</h6>
              <ul className="small mb-0">
                <li>
                  <code>value</code> - Current location value (string)
                </li>
                <li>
                  <code>onChange</code> - Change handler function
                </li>
                <li>
                  <code>placeholder</code> - Input placeholder text
                </li>
                <li>
                  <code>required</code> - Whether the field is required
                  (boolean)
                </li>
                <li>
                  <code>className</code> - Additional CSS classes
                </li>
                <li>
                  <code>disabled</code> - Disable the input (boolean)
                </li>
                <li>
                  <code>label</code> - Field label text
                </li>
                <li>
                  <code>showRequiredIndicator</code> - Show * for required
                  fields (boolean)
                </li>
                <li>
                  <code>helpText</code> - Helper text below the input
                </li>
              </ul>

              <h6 className="mt-3">Features:</h6>
              <ul className="small mb-0">
                <li>
                  🌍 Automatic location detection using browser geolocation
                </li>
                <li>
                  🔄 Reverse geocoding to convert coordinates to readable
                  addresses
                </li>
                <li>⚡ Responsive design with Bootstrap 5</li>
                <li>🛡️ Comprehensive error handling and permissions</li>
                <li>♿ Accessibility-friendly with proper ARIA labels</li>
                <li>🎨 Consistent styling with the application theme</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
