"use client";

import { useState, useEffect, useRef } from "react";
import { Modal, Button, Alert, Spinner, Badge, Card } from "react-bootstrap";
import UserAvatar from "@/components/common/UserAvatar";
import { formatDistance } from "@/utils/distanceUtils";

export default function SellersMapModal({
  show,
  onHide,
  sellers = [],
  currentLocation = null,
}) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);

  // Load Google Maps script
  useEffect(() => {
    if (show && !window.google) {
      loadGoogleMapsScript();
    } else if (show && window.google) {
      setMapLoaded(true);
    }
  }, [show]);

  // Initialize map when loaded
  useEffect(() => {
    if (mapLoaded && show && mapRef.current && !map) {
      initializeMap();
    }
  }, [mapLoaded, show, map]);

  // Update markers when sellers change
  useEffect(() => {
    if (map && sellers.length > 0) {
      updateMarkers();
    }
  }, [map, sellers]);

  const loadGoogleMapsScript = () => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
    }&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setMapLoaded(true);
    };

    script.onerror = () => {
      setMapError(
        "Failed to load Google Maps. Please check your internet connection."
      );
    };

    document.head.appendChild(script);
  };

  const initializeMap = () => {
    try {
      // Default center (India)
      let center = { lat: 20.5937, lng: 78.9629 };
      let zoom = 5;

      // If we have current location, center on it
      if (currentLocation) {
        center = { lat: currentLocation.lat, lng: currentLocation.lon };
        zoom = 10;
      } else if (sellers.length > 0) {
        // Center on first seller with coordinates
        const firstSellerWithCoords = sellers.find((s) => s.coordinates);
        if (firstSellerWithCoords) {
          center = {
            lat: firstSellerWithCoords.coordinates.lat,
            lng: firstSellerWithCoords.coordinates.lon,
          };
          zoom = 8;
        }
      }

      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeId: "roadmap",
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      setMap(mapInstance);

      // Add current location marker if available
      if (currentLocation) {
        new window.google.maps.Marker({
          position: { lat: currentLocation.lat, lng: currentLocation.lon },
          map: mapInstance,
          title: "Your Location",
          icon: {
            url:
              "data:image/svg+xml;charset=UTF-8," +
              encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="8" fill="#007bff" stroke="white" stroke-width="3"/>
                <circle cx="16" cy="16" r="3" fill="white"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 16),
          },
        });
      }
    } catch (error) {
      console.error("Error initializing map:", error);
      setMapError("Failed to initialize map. Please try again.");
    }
  };

  const updateMarkers = () => {
    // Clear existing markers
    markers.forEach((marker) => marker.setMap(null));

    const newMarkers = [];
    const bounds = new window.google.maps.LatLngBounds();

    // Add current location to bounds if available
    if (currentLocation) {
      bounds.extend(
        new window.google.maps.LatLng(currentLocation.lat, currentLocation.lon)
      );
    }

    sellers.forEach((seller, index) => {
      if (!seller.coordinates) return;

      const position = {
        lat: seller.coordinates.lat,
        lng: seller.coordinates.lon,
      };

      const marker = new window.google.maps.Marker({
        position,
        map,
        title: seller.name,
        icon: {
          url:
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 2C13.383 2 8 7.383 8 14c0 9 12 22 12 22s12-13 12-22c0-6.617-5.383-12-12-12z" 
                    fill="#28a745" stroke="white" stroke-width="2"/>
              <circle cx="20" cy="14" r="6" fill="white"/>
              <text x="20" y="18" text-anchor="middle" font-family="Arial" font-size="10" font-weight="bold" fill="#28a745">
                ${index + 1}
              </text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 40),
        },
      });

      // Create info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: createInfoWindowContent(seller),
      });

      marker.addListener("click", () => {
        // Close other info windows
        markers.forEach((m) => m.infoWindow?.close());

        infoWindow.open(map, marker);
        setSelectedSeller(seller);
      });

      marker.infoWindow = infoWindow;
      newMarkers.push(marker);
      bounds.extend(position);
    });

    setMarkers(newMarkers);

    // Fit map to show all markers
    if (newMarkers.length > 0) {
      map.fitBounds(bounds);

      // Don't zoom in too much for single marker
      if (newMarkers.length === 1) {
        const listener = window.google.maps.event.addListener(
          map,
          "idle",
          () => {
            if (map.getZoom() > 15) map.setZoom(15);
            window.google.maps.event.removeListener(listener);
          }
        );
      }
    }
  };

  const createInfoWindowContent = (seller) => {
    return `
      <div style="max-width: 250px; padding: 8px;">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: #28a745; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px;">
            ${seller.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style="font-weight: bold; color: #333; margin-bottom: 2px;">${
              seller.name
            }</div>
            ${
              seller.farm_name
                ? `<div style="font-size: 12px; color: #666;">${seller.farm_name}</div>`
                : ""
            }
          </div>
        </div>
        
        <div style="margin-bottom: 8px;">
          ${
            seller.distance
              ? `<span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px;">${formatDistance(
                  seller.distance
                )} away</span>`
              : ""
          }
          ${
            seller.average_rating > 0
              ? `<span style="background: #ffc107; color: #333; padding: 2px 6px; border-radius: 10px; font-size: 11px; margin-left: 4px;">⭐ ${seller.average_rating.toFixed(
                  1
                )}</span>`
              : ""
          }
        </div>
        
        <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
          ${
            seller.product_count > 0
              ? `📦 ${seller.product_count} products`
              : ""
          }
          ${
            seller.total_orders > 0 ? ` • 🛒 ${seller.total_orders} orders` : ""
          }
        </div>
        
        <div style="display: flex; gap: 4px;">
          <button onclick="window.open('/users/${
            seller.id
          }/listings', '_blank')" 
                  style="background: #007bff; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;"
                  ${seller.product_count === 0 ? "disabled" : ""}>
            View Products
          </button>
          ${
            seller.whatsapp_store_link
              ? `
            <button onclick="window.open('${seller.whatsapp_store_link}', '_blank')" 
                    style="background: #25d366; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">
              WhatsApp
            </button>
          `
              : ""
          }
        </div>
      </div>
    `;
  };

  const handleClose = () => {
    setSelectedSeller(null);
    onHide();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      markers.forEach((marker) => marker.setMap(null));
    };
  }, []);

  if (!show) return null;

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="xl"
      centered
      backdrop="static"
    >
      <Modal.Header closeButton className="bg-light">
        <Modal.Title>
          <i className="ti-map me-2 text-success"></i>
          Find Nearby Members
          <Badge bg="info" className="ms-2">
            {sellers.filter((s) => s.coordinates).length} members
          </Badge>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-0">
        {mapError ? (
          <Alert variant="danger" className="m-3">
            <i className="ti-alert-triangle me-2"></i>
            {mapError}
          </Alert>
        ) : !mapLoaded ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="success" className="mb-3" />
            <p className="text-muted">Loading map...</p>
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            <div
              ref={mapRef}
              style={{
                width: "100%",
                height: "500px",
                borderRadius: "0 0 8px 8px",
              }}
            />

            {/* Legend */}
            <div
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "white",
                padding: "12px",
                borderRadius: "8px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                fontSize: "12px",
                maxWidth: "200px",
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
                Legend
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "4px",
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    background: "#007bff",
                    borderRadius: "50%",
                    marginRight: "8px",
                  }}
                ></div>
                Your Location
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <div
                  style={{
                    width: "0",
                    height: "0",
                    borderLeft: "8px solid transparent",
                    borderRight: "8px solid transparent",
                    borderTop: "12px solid #28a745",
                    marginRight: "8px",
                  }}
                ></div>
                Members
              </div>
            </div>

            {/* Selected seller info */}
            {selectedSeller && (
              <Card
                style={{
                  position: "absolute",
                  bottom: "10px",
                  left: "10px",
                  maxWidth: "300px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                }}
              >
                <Card.Body className="p-3">
                  <div className="d-flex align-items-center mb-2">
                    <UserAvatar
                      user={{
                        name: selectedSeller.name,
                        image: selectedSeller.avatar_url,
                      }}
                      size={40}
                      className="me-3"
                    />
                    <div>
                      <h6 className="mb-0">{selectedSeller.name}</h6>
                      {selectedSeller.farm_name && (
                        <small className="text-muted">
                          {selectedSeller.farm_name}
                        </small>
                      )}
                    </div>
                  </div>

                  <div className="d-flex gap-1 mb-2">
                    {selectedSeller.distance && (
                      <Badge bg="success" className="small">
                        {formatDistance(selectedSeller.distance)} away
                      </Badge>
                    )}
                    {selectedSeller.average_rating > 0 && (
                      <Badge bg="warning" className="small">
                        ⭐ {selectedSeller.average_rating.toFixed(1)}
                      </Badge>
                    )}
                  </div>

                  <div className="small text-muted mb-3">
                    {selectedSeller.product_count > 0 && (
                      <span className="me-3">
                        📦 {selectedSeller.product_count} products
                      </span>
                    )}
                    {selectedSeller.total_orders > 0 && (
                      <span>🛒 {selectedSeller.total_orders} orders</span>
                    )}
                  </div>

                  <div className="d-flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        window.open(
                          `/users/${selectedSeller.id}/listings`,
                          "_blank"
                        )
                      }
                      disabled={selectedSeller.product_count === 0}
                    >
                      View Products
                    </Button>
                    {selectedSeller.whatsapp_store_link && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() =>
                          window.open(
                            selectedSeller.whatsapp_store_link,
                            "_blank"
                          )
                        }
                      >
                        WhatsApp
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="bg-light">
        <div className="d-flex align-items-center justify-content-between w-100">
          <small className="text-muted">
            <i className="ti-info me-1"></i>
            Click on markers to see member details
          </small>
          <Button variant="secondary" onClick={handleClose}>
            Close Map
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
