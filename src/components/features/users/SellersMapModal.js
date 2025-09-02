"use client";

import { useState, useEffect, useRef } from "react";
import { Modal, Button, Alert, Spinner, Badge, Card } from "react-bootstrap";
import UserAvatar from "@/components/common/UserAvatar";
import { formatDistance } from "@/utils/distanceUtils";
import mapsUsageService from "@/services/GoogleMapsUsageService";

export default function SellersMapModal({
  show,
  onHide,
  sellers = [],
  currentLocation = null,
}) {
  // Debug log to check if currentLocation is being passed
  console.log("SellersMapModal - currentLocation:", currentLocation);
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const activeInfoWindows = useRef([]);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [localCurrentLocation, setLocalCurrentLocation] =
    useState(currentLocation);
  const [locationLoading, setLocationLoading] = useState(false);

  // Load Google Maps script or show fallback
  useEffect(() => {
    if (show) {
      const hasGoogleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

      // Check if maps should be disabled due to usage limits
      if (mapsUsageService.shouldDisableMaps()) {
        const stats = mapsUsageService.getUsageStats();
        setMapError(
          `Map view temporarily disabled. Daily usage: ${stats.used}/${stats.limit} requests (${stats.percentage}%). Resets tomorrow.`
        );
        return;
      }

      if (hasGoogleMapsKey && !window.google) {
        loadGoogleMapsScript();
      } else if (hasGoogleMapsKey && window.google) {
        setMapLoaded(true);
      } else {
        // No Google Maps API key - show fallback message
        setMapError(
          "Map view requires Google Maps API key. Distance calculations work without it."
        );
      }

      // Auto-detect location when dialog opens (if not already available)
      if (!localCurrentLocation && !currentLocation) {
        handleManualLocationDetection(true); // true = isAutoDetection
      }
    } else {
      // Reset states when modal is closed
      setMap(null);
      setMarkers([]);
      setMapError(null);
      activeInfoWindows.current = [];
      // Don't reset mapLoaded - keep Google Maps script loaded
    }
  }, [show]);

  // Initialize map when loaded
  useEffect(() => {
    if (mapLoaded && show && mapRef.current && !map) {
      initializeMap();
    }
  }, [mapLoaded, show, map]);

  // Update markers when sellers or location change
  useEffect(() => {
    if (map && (sellers.length > 0 || localCurrentLocation)) {
      updateMarkers();
    }
  }, [map, sellers, localCurrentLocation]);

  // Update local current location when prop changes
  useEffect(() => {
    setLocalCurrentLocation(currentLocation);
  }, [currentLocation]);

  const handleManualLocationDetection = async (isAutoDetection = false) => {
    setLocationLoading(true);
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation = {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
              accuracy: position.coords.accuracy,
            };
            setLocalCurrentLocation(newLocation);
            console.log("Location detected:", newLocation);
            setLocationLoading(false);

            // The useEffect will automatically update markers when localCurrentLocation changes
          },
          (error) => {
            console.error("Location detection failed:", error);
            setLocationLoading(false);

            // Only show alert for manual detection, not auto-detection
            if (!isAutoDetection) {
              alert(
                "Unable to detect your location. Please enable location services and try again."
              );
            }
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
      } else {
        setLocationLoading(false);
        if (!isAutoDetection) {
          alert("Geolocation is not supported by this browser.");
        }
      }
    } catch (error) {
      console.error("Location detection error:", error);
      setLocationLoading(false);
    }
  };

  const loadGoogleMapsScript = () => {
    // Check if Google Maps script is already loaded
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]'
    );
    if (existingScript) {
      existingScript.onload = () => setMapLoaded(true);
      return;
    }

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
      if (localCurrentLocation) {
        center = {
          lat: localCurrentLocation.lat,
          lng: localCurrentLocation.lon,
        };
        zoom = 12; // Closer zoom to better see the area
      } else if (sellers.length > 0) {
        // Center on first seller with coordinates
        const firstSellerWithCoords = sellers.find((s) => s.coordinates);
        if (firstSellerWithCoords) {
          center = {
            lat: firstSellerWithCoords.coordinates.lat,
            lng: firstSellerWithCoords.coordinates.lon,
          };
          zoom = 10;
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

      // Track map usage
      const newUsage = mapsUsageService.incrementUsage();
      console.log(
        `📊 Map loaded. Usage: ${newUsage}/${mapsUsageService.DAILY_LIMIT}`
      );

      setMap(mapInstance);

      console.log("Map initialized successfully");

      // Update markers after map is set - pass mapInstance directly
      setTimeout(() => {
        updateMarkersWithMap(mapInstance);
      }, 100);
    } catch (error) {
      console.error("Error initializing map:", error);
      setMapError("Failed to initialize map. Please try again.");
    }
  };

  const updateMarkersWithMap = (mapInstance) => {
    if (!mapInstance) {
      console.error("Map instance is null in updateMarkersWithMap");
      return;
    }

    // Clear existing markers and info windows
    markers.forEach((marker) => marker.setMap(null));
    activeInfoWindows.current.forEach((window) => window.close());
    activeInfoWindows.current = [];

    const newMarkers = [];
    const bounds = new window.google.maps.LatLngBounds();

    // Add current location marker if available
    if (localCurrentLocation) {
      console.log("Adding current location marker:", localCurrentLocation);

      // Create a simple blue circle marker for current location
      const currentLocationMarker = new window.google.maps.Marker({
        position: {
          lat: localCurrentLocation.lat,
          lng: localCurrentLocation.lon,
        },
        map: mapInstance,
        title: "Your Current Location",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: "#007bff",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
          strokeOpacity: 1,
        },
        zIndex: 1000, // Ensure it appears above other markers
      });

      // Add info window for current location
      const currentLocationInfo = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; text-align: center;">
            <h6 style="margin: 0 0 6px 0; color: #007bff; font-weight: bold;">
              <i class="ti-navigation" style="margin-right: 4px;"></i>
              Your Current Location
            </h6>
            <div style="color: #666; font-size: 12px; margin-bottom: 4px;">
              📍 ${localCurrentLocation.lat.toFixed(
                6
              )}, ${localCurrentLocation.lon.toFixed(6)}
            </div>
            <div style="color: #007bff; font-size: 11px; font-weight: bold;">
              🎯 YOU ARE HERE
            </div>
          </div>
        `,
      });

      currentLocationMarker.addListener("click", () => {
        // Close all previously opened info windows
        activeInfoWindows.current.forEach((window) => window.close());
        activeInfoWindows.current = [];

        currentLocationInfo.open(mapInstance, currentLocationMarker);
        activeInfoWindows.current.push(currentLocationInfo);
      });

      // Add current location marker to markers array and bounds
      newMarkers.push(currentLocationMarker);
      bounds.extend(
        new window.google.maps.LatLng(
          localCurrentLocation.lat,
          localCurrentLocation.lon
        )
      );

      console.log("Current location marker added successfully");
    }

    sellers.forEach((seller, index) => {
      if (!seller.coordinates) return;

      const position = {
        lat: seller.coordinates.lat,
        lng: seller.coordinates.lon,
      };

      const marker = new window.google.maps.Marker({
        position,
        map: mapInstance,
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
        // Close all previously opened info windows
        activeInfoWindows.current.forEach((window) => window.close());
        activeInfoWindows.current = [];

        infoWindow.open(mapInstance, marker);
        activeInfoWindows.current.push(infoWindow);
      });

      marker.infoWindow = infoWindow;
      newMarkers.push(marker);
      bounds.extend(position);
    });

    setMarkers(newMarkers);

    // Fit map to show all markers
    if (newMarkers.length > 0) {
      mapInstance.fitBounds(bounds);

      // Don't zoom in too much for single marker
      if (newMarkers.length === 1) {
        const listener = window.google.maps.event.addListener(
          mapInstance,
          "idle",
          () => {
            if (mapInstance.getZoom() > 15) mapInstance.setZoom(15);
            window.google.maps.event.removeListener(listener);
          }
        );
      }
    }
  };

  const updateMarkers = () => {
    if (map) {
      updateMarkersWithMap(map);
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
        <Modal.Title className="d-flex align-items-center justify-content-between w-100 me-3">
          <div>
            <i className="ti-map me-2 text-success"></i>
            Find Nearby Members
            <Badge bg="info" className="ms-2">
              {sellers.filter((s) => s.coordinates).length} members
            </Badge>
          </div>
          {!localCurrentLocation && (
            <Button
              variant="outline-warning"
              size="sm"
              onClick={handleManualLocationDetection}
              disabled={locationLoading}
              className="d-flex align-items-center"
            >
              {locationLoading ? (
                <>
                  <Spinner size="sm" className="me-1" />
                  Detecting location...
                </>
              ) : (
                <>
                  <i className="ti-target me-1"></i>
                  Get My Location
                </>
              )}
            </Button>
          )}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-0">
        {mapError ? (
          <div className="p-4">
            <Alert variant="info" className="mb-3">
              <div className="d-flex align-items-start">
                <i className="ti-info-circle me-2 mt-1"></i>
                <div>
                  <h6 className="alert-heading mb-2">Map View Unavailable</h6>
                  <p className="mb-2">
                    Interactive map requires Google Maps API configuration.
                    Distance calculations and seller listings work perfectly
                    without it.
                  </p>
                  <small className="text-muted">
                    <strong>Alternative:</strong> Use the "View on Map" links
                    next to each seller to open their location in your device's
                    default map app.
                  </small>
                </div>
              </div>
            </Alert>

            {/* Show seller list as fallback */}
            <div className="border rounded p-3">
              <h6 className="mb-3">
                <i className="ti-users me-2"></i>
                Sellers Near You ({sellers.length})
              </h6>
              {sellers.length > 0 ? (
                <div className="row g-2">
                  {sellers.map((seller) => (
                    <div key={seller.id} className="col-12">
                      <div className="d-flex align-items-center justify-content-between p-2 border rounded">
                        <div className="d-flex align-items-center">
                          <div className="me-3">
                            <div
                              className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: "32px",
                                height: "32px",
                                fontSize: "0.8rem",
                              }}
                            >
                              {seller.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div>
                            <div className="fw-semibold">{seller.name}</div>
                            {seller.distance && (
                              <small className="text-muted">
                                <i className="ti-map-pin me-1"></i>
                                {formatDistance(seller.distance)} away
                              </small>
                            )}
                          </div>
                        </div>
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() =>
                              window.open(
                                `/users/${seller.id}/listings`,
                                "_blank"
                              )
                            }
                          >
                            <i className="ti-package me-1"></i>
                            Products
                          </Button>
                          {seller.location && (
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => {
                                // Use stored coordinates if available (more reliable than short URLs)
                                if (seller.coordinates) {
                                  window.open(
                                    `https://maps.google.com/?q=${seller.coordinates.lat},${seller.coordinates.lon}`,
                                    "_blank"
                                  );
                                } else if (seller.location) {
                                  // Fallback to original URL if no coordinates
                                  window.open(seller.location, "_blank");
                                }
                              }}
                            >
                              <i className="ti-map me-1"></i>
                              Map
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3 text-muted">
                  <i
                    className="ti-map-off mb-2"
                    style={{ fontSize: "2rem" }}
                  ></i>
                  <p className="mb-0">No sellers found in your area</p>
                </div>
              )}
            </div>
          </div>
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
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="bg-light">
        <div className="d-flex align-items-center justify-content-between w-100">
          <div className="d-flex align-items-center gap-3">
            <small className="text-muted">
              <i className="ti-info me-1"></i>
              Click markers for details
            </small>
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center gap-1">
                <div
                  className="rounded-circle"
                  style={{
                    width: "14px",
                    height: "14px",
                    backgroundColor: "#007bff",
                    border: "2px solid white",
                    flexShrink: 0,
                  }}
                ></div>
                <small className="text-dark">Your Location</small>
              </div>
              <div className="d-flex align-items-center gap-1">
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16">
                    <path
                      d="M8 1C5.5 1 3.5 3 3.5 5.5C3.5 9 8 15 8 15s4.5-6 4.5-9.5C12.5 3 10.5 1 8 1z"
                      fill="#28a745"
                      stroke="white"
                      strokeWidth="1"
                    />
                    <circle cx="8" cy="5.5" r="2" fill="white" />
                  </svg>
                </div>
                <small className="text-dark">Sellers</small>
              </div>
            </div>
          </div>
          <Button variant="secondary" onClick={handleClose}>
            Close Map
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
