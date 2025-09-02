"use client";

import { useState } from "react";
import { Form, Button, InputGroup, Alert, Dropdown } from "react-bootstrap";
import LocationAutoDetect from "./LocationAutoDetect";

const SmartLocationInput = ({
  value = "",
  onChange,
  onCoordinatesChange,
  name = "location",
  placeholder = "Enter your store/farm address",
  required = false,
  className = "",
  disabled = false,
  label = "Store/Farm Location",
  helpText = "",
}) => {
  const [showLocationOptions, setShowLocationOptions] = useState(false);

  const handleCurrentLocationDetect = (coords, accuracy) => {
    // When user chooses to use current location
    if (onCoordinatesChange) {
      onCoordinatesChange(coords, accuracy);
    }
  };

  const handleAddressFromMaps = () => {
    // Show instructions for getting address from Google Maps
    alert(`To get your store/farm address from Google Maps:

1. Open Google Maps
2. Find your store/farm location
3. Right-click on the exact spot
4. Select "What's here?"
5. Copy the address or coordinates
6. Paste it in the location field below

This ensures accurate distance calculations for customers.`);
  };

  return (
    <Form.Group className={className}>
      {label && (
        <Form.Label>
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </Form.Label>
      )}
      
      <InputGroup>
        <Form.Control
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
        />
        
        <Dropdown>
          <Dropdown.Toggle 
            variant="outline-secondary" 
            id="location-options"
            disabled={disabled}
          >
            <i className="ti-map me-1"></i>
          </Dropdown.Toggle>

          <Dropdown.Menu>
            <Dropdown.Header>Location Options</Dropdown.Header>
            
            <Dropdown.Item onClick={handleAddressFromMaps}>
              <i className="ti-map-alt me-2 text-primary"></i>
              Get Address from Google Maps
            </Dropdown.Item>
            
            <Dropdown.Divider />
            
            <Dropdown.Item 
              onClick={() => setShowLocationOptions(true)}
              className="text-warning"
            >
              <i className="ti-location-pin me-2"></i>
              Use My Current Location
              <small className="d-block text-muted">
                Only if your store is at your current location
              </small>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </InputGroup>

      {helpText && (
        <Form.Text className="text-muted">
          {helpText}
        </Form.Text>
      )}

      {/* Show current location detector when requested */}
      {showLocationOptions && (
        <Alert variant="warning" className="mt-2">
          <Alert.Heading className="h6">
            <i className="ti-info-alt me-2"></i>
            Use Current Location?
          </Alert.Heading>
          <p className="mb-3 small">
            This will use your current GPS location as your store/farm address. 
            Only use this if you're currently at your store/farm location.
          </p>
          
          <div className="d-flex gap-2">
            <LocationAutoDetect
              value=""
              onChange={(e) => {
                onChange(e);
                setShowLocationOptions(false);
              }}
              onCoordinatesChange={(coords, accuracy) => {
                handleCurrentLocationDetect(coords, accuracy);
                setShowLocationOptions(false);
              }}
              name={`${name}_temp`}
              placeholder="Detecting location..."
              className="flex-grow-1"
              disabled={disabled}
              label=""
              hideButton={true}
            />
            
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={() => setShowLocationOptions(false)}
            >
              Cancel
            </Button>
          </div>
        </Alert>
      )}

      {/* Show helpful message for Google Maps links */}
      {value && (value.includes("maps.app.goo.gl") || value.includes("goo.gl/maps")) && (
        <Alert variant="info" className="mt-2">
          <small>
            <i className="ti-info-alt me-1"></i>
            <strong>Google Maps Link Detected:</strong> For better distance calculations, 
            consider copying the full address instead of the shortened link.
          </small>
        </Alert>
      )}
    </Form.Group>
  );
};

export default SmartLocationInput;
