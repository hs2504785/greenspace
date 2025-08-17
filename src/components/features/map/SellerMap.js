/**
 * SellerMap Component
 * A simple map component to show sellers geographically
 * Note: This is a basic implementation. For production, integrate with Google Maps or Mapbox
 */

import React, { useState, useEffect } from "react";

const SellerMap = ({
  sellers = [],
  userLocation = null,
  onSellerClick = null,
  height = "400px",
  className = "",
}) => {
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 28.6139, lng: 77.209 }); // Delhi default

  useEffect(() => {
    // Set map center based on user location or first seller
    if (userLocation) {
      setMapCenter({
        lat: userLocation.latitude,
        lng: userLocation.longitude,
      });
    } else if (sellers.length > 0 && sellers[0].seller_latitude) {
      setMapCenter({
        lat: sellers[0].seller_latitude,
        lng: sellers[0].seller_longitude,
      });
    }
  }, [userLocation, sellers]);

  const handleSellerClick = (seller) => {
    setSelectedSeller(seller);
    if (onSellerClick) {
      onSellerClick(seller);
    }
  };

  // Simple distance calculation for positioning
  const getRelativePosition = (seller) => {
    if (!userLocation || !seller.seller_latitude || !seller.seller_longitude) {
      return { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 };
    }

    // Simple relative positioning based on lat/lng difference
    const latDiff = seller.seller_latitude - userLocation.latitude;
    const lngDiff = seller.seller_longitude - userLocation.longitude;

    // Convert to percentage positions (simplified)
    const x = Math.max(5, Math.min(95, 50 + lngDiff * 1000));
    const y = Math.max(5, Math.min(95, 50 - latDiff * 1000));

    return { x, y };
  };

  // Render placeholder map until proper map integration
  return (
    <div className={`seller-map ${className}`}>
      <div
        className="map-container bg-light border rounded position-relative overflow-hidden"
        style={{ height, minHeight: "300px" }}
      >
        {/* Map background with grid pattern */}
        <div
          className="position-absolute w-100 h-100"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
          }}
        />

        {/* Map title */}
        <div className="position-absolute top-0 start-0 p-2 bg-white bg-opacity-90 rounded-bottom">
          <h6 className="mb-0 fw-bold text-primary">
            <i className="ti-map me-1"></i>
            Nearby Sellers Map
          </h6>
          <small className="text-muted">{sellers.length} sellers found</small>
        </div>

        {/* User location marker */}
        {userLocation && (
          <div
            className="position-absolute translate-middle"
            style={{
              left: "50%",
              top: "50%",
              zIndex: 10,
            }}
            title="Your location"
          >
            <div className="user-location-marker">
              <div
                className="bg-primary rounded-circle border border-white shadow"
                style={{
                  width: "16px",
                  height: "16px",
                  animation: "pulse 2s infinite",
                }}
              />
              <div
                className="bg-primary rounded-circle opacity-25"
                style={{
                  width: "32px",
                  height: "32px",
                  position: "absolute",
                  top: "-8px",
                  left: "-8px",
                  zIndex: -1,
                }}
              />
            </div>
          </div>
        )}

        {/* Seller markers */}
        {sellers.map((seller, index) => {
          const position = getRelativePosition(seller);
          const isSelected = selectedSeller?.seller_id === seller.seller_id;

          return (
            <div
              key={seller.seller_id || index}
              className="position-absolute translate-middle seller-marker"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                zIndex: isSelected ? 20 : 15,
                cursor: "pointer",
              }}
              onClick={() => handleSellerClick(seller)}
              title={`${seller.seller_name} - ${seller.distance_km}km away`}
            >
              {/* Seller marker */}
              <div
                className={`bg-success rounded-circle border border-white shadow d-flex align-items-center justify-content-center text-white fw-bold ${
                  isSelected ? "border-3" : ""
                }`}
                style={{
                  width: isSelected ? "32px" : "24px",
                  height: isSelected ? "32px" : "24px",
                  fontSize: isSelected ? "14px" : "12px",
                  transition: "all 0.2s ease",
                }}
              >
                <i className="ti-user"></i>
              </div>

              {/* Seller info popup on hover/select */}
              {isSelected && (
                <div
                  className="position-absolute bg-white border rounded shadow-sm p-2"
                  style={{
                    bottom: "100%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    marginBottom: "8px",
                    minWidth: "180px",
                    zIndex: 30,
                  }}
                >
                  <div className="small">
                    <div className="fw-bold text-success mb-1">
                      {seller.seller_name}
                    </div>
                    <div className="text-muted">
                      <i className="ti-location-pin me-1"></i>
                      {seller.distance_km}km away
                    </div>
                    <div className="text-muted">
                      <i className="ti-package me-1"></i>
                      {seller.product_count} products
                    </div>
                  </div>

                  {/* Arrow pointing down */}
                  <div
                    className="position-absolute bg-white border-end border-bottom"
                    style={{
                      top: "100%",
                      left: "50%",
                      transform: "translateX(-50%) rotate(45deg)",
                      width: "8px",
                      height: "8px",
                      marginTop: "-4px",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Legend */}
        <div className="position-absolute bottom-0 end-0 p-2 bg-white bg-opacity-90 rounded-top">
          <div className="small">
            <div className="d-flex align-items-center mb-1">
              <div
                className="bg-primary rounded-circle me-2"
                style={{ width: "12px", height: "12px" }}
              />
              <span>Your location</span>
            </div>
            <div className="d-flex align-items-center">
              <div
                className="bg-success rounded-circle me-2"
                style={{ width: "12px", height: "12px" }}
              />
              <span>Sellers</span>
            </div>
          </div>
        </div>

        {/* No location warning */}
        {!userLocation && (
          <div className="position-absolute top-50 start-50 translate-middle text-center p-3">
            <div className="text-muted">
              <i className="ti-map-alt display-4 d-block mb-2"></i>
              <p className="mb-0">Enable location for better map experience</p>
            </div>
          </div>
        )}
      </div>

      {/* Map upgrade notice */}
      <div className="mt-2 text-center">
        <small className="text-muted">
          <i className="ti-info-alt me-1"></i>
          Interactive map coming soon! Currently showing relative positions.
        </small>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(13, 110, 253, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(13, 110, 253, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(13, 110, 253, 0);
          }
        }

        .seller-marker:hover .bg-success {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};

export default SellerMap;
