"use client";

/**
 * Nearby Sellers Page
 * Main page for discovering nearby gardeners/farmers selling produce
 */

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import LocationInput from "../../components/features/location/LocationInput";
import SellerCard, {
  SellerCardSkeleton,
} from "../../components/features/sellers/SellerCard";
import SellerMap from "../../components/features/map/SellerMap";

const NearbySellerPage = () => {
  // State management
  const [sellers, setSellers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(50);
  const [viewMode, setViewMode] = useState("grid"); // 'grid', 'list', 'map'
  const [sortBy, setSortBy] = useState("distance"); // 'distance', 'products', 'name'
  const [popularCities, setPopularCities] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);

  // Load popular cities on component mount
  useEffect(() => {
    loadPopularCities();
  }, []);

  // Auto-detect location on mount
  useEffect(() => {
    const autoDetectLocation = async () => {
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 5000,
              maximumAge: 300000,
            });
          });

          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            type: "auto_detected",
          };

          setUserLocation(locationData);
          searchNearbySellersByLocation(locationData);
        } catch (error) {
          console.log("Auto location detection failed, showing popular cities");
        }
      }
    };

    autoDetectLocation();
  }, []);

  // Load popular cities
  const loadPopularCities = async () => {
    try {
      const response = await fetch(
        "/api/locations?action=popular_cities&limit=8"
      );
      const data = await response.json();

      if (data.success) {
        setPopularCities(data.data);
      }
    } catch (error) {
      console.error("Error loading popular cities:", error);
    }
  };

  // Handle location selection from LocationInput
  const handleLocationSelect = (locationData) => {
    setUserLocation(locationData);
    searchNearbySellersByLocation(locationData);
  };

  // Search nearby sellers by location
  const searchNearbySellersByLocation = async (
    location,
    radius = searchRadius
  ) => {
    if (!location.latitude || !location.longitude) {
      toast.error("Invalid location coordinates");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/nearby-sellers?latitude=${location.latitude}&longitude=${location.longitude}&radius=${radius}`
      );

      const data = await response.json();

      if (data.success) {
        setSellers(data.data);
        if (data.data.length === 0) {
          toast(
            `No sellers found within ${radius}km. Try increasing the search radius.`
          );
        } else {
          toast.success(`Found ${data.data.length} sellers nearby`);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error searching nearby sellers:", error);
      toast.error("Failed to search nearby sellers");
      setSellers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle city selection
  const handleCitySelect = async (cityName) => {
    try {
      const response = await fetch(
        `/api/nearby-sellers?city=${encodeURIComponent(cityName)}`
      );

      const data = await response.json();

      if (data.success) {
        setSellers(data.data);
        setUserLocation({ city: cityName, type: "city_search" });
        toast.success(`Found ${data.data.length} sellers in ${cityName}`);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error searching sellers by city:", error);
      toast.error(`Failed to search sellers in ${cityName}`);
    }
  };

  // Handle radius change
  const handleRadiusChange = (newRadius) => {
    setSearchRadius(newRadius);
    if (userLocation && userLocation.latitude && userLocation.longitude) {
      searchNearbySellersByLocation(userLocation, newRadius);
    }
  };

  // Sort sellers
  const sortedSellers = [...sellers].sort((a, b) => {
    switch (sortBy) {
      case "distance":
        return (a.distance_km || 999) - (b.distance_km || 999);
      case "products":
        return (b.product_count || 0) - (a.product_count || 0);
      case "name":
        return (a.seller_name || "").localeCompare(b.seller_name || "");
      default:
        return 0;
    }
  });

  // Handle seller contact tracking
  const handleSellerContact = (contactType, seller) => {
    // Track contact interactions for analytics
    console.log(`Contact via ${contactType}:`, seller.seller_name);
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        {/* Header */}
        <div className="col-12 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h1 className="mb-1">
                <i className="ti-map-alt text-success me-2"></i>
                Discover Nearby Farmers
              </h1>
              <p className="text-muted mb-0">
                Find fresh produce from local gardeners and farmers in your area
              </p>
            </div>

            {/* View mode toggles */}
            <div className="btn-group" role="group">
              <button
                type="button"
                className={`btn ${
                  viewMode === "grid" ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setViewMode("grid")}
                title="Grid view"
              >
                <i className="ti-layout-grid3"></i>
              </button>
              <button
                type="button"
                className={`btn ${
                  viewMode === "list" ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setViewMode("list")}
                title="List view"
              >
                <i className="ti-list"></i>
              </button>
              <button
                type="button"
                className={`btn ${
                  viewMode === "map" ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setViewMode("map")}
                title="Map view"
              >
                <i className="ti-map"></i>
              </button>
            </div>
          </div>

          {/* Search and filters */}
          <div className="row g-3 mb-4">
            <div className="col-lg-6">
              <LocationInput
                onLocationSelect={handleLocationSelect}
                placeholder="Enter your location to find nearby sellers"
                className="w-100"
              />
            </div>

            <div className="col-lg-3">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="ti-target"></i>
                </span>
                <select
                  className="form-select"
                  value={searchRadius}
                  onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                  disabled={!userLocation?.latitude}
                >
                  <option value={5}>Within 5km</option>
                  <option value={10}>Within 10km</option>
                  <option value={25}>Within 25km</option>
                  <option value={50}>Within 50km</option>
                  <option value={100}>Within 100km</option>
                </select>
              </div>
            </div>

            <div className="col-lg-3">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="ti-sort-descending"></i>
                </span>
                <select
                  className="form-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="distance">Sort by Distance</option>
                  <option value="products">Sort by Products</option>
                  <option value="name">Sort by Name</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Popular cities (shown when no location selected) */}
        {!userLocation && popularCities.length > 0 && (
          <div className="col-12 mb-4">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title mb-3">
                  <i className="ti-location-pin text-primary me-2"></i>
                  Popular Cities
                </h5>
                <div className="row g-2">
                  {popularCities.map((city, index) => (
                    <div key={index} className="col-6 col-md-3">
                      <button
                        className="btn btn-outline-primary w-100"
                        onClick={() => handleCitySelect(city.city)}
                      >
                        {city.city}
                        <span className="badge bg-primary ms-2">
                          {city.seller_count}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results section */}
        <div className="col-12">
          {/* Results header */}
          {(sellers.length > 0 || isLoading) && (
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="mb-0">
                  {isLoading
                    ? "Searching..."
                    : `${sellers.length} Sellers Found`}
                </h5>
                {userLocation && userLocation.address && (
                  <small className="text-muted">
                    Near {userLocation.address}
                  </small>
                )}
              </div>

              {sellers.length > 0 && (
                <div className="text-muted small">
                  Showing sellers within {searchRadius}km
                </div>
              )}
            </div>
          )}

          {/* Map view */}
          {viewMode === "map" && (
            <div className="mb-4">
              <SellerMap
                sellers={sortedSellers}
                userLocation={userLocation}
                onSellerClick={setSelectedSeller}
                height="500px"
              />
            </div>
          )}

          {/* Sellers grid/list */}
          {(viewMode === "grid" || viewMode === "list") && (
            <div className="row g-4">
              {isLoading ? (
                <div className={viewMode === "grid" ? "row g-4" : "col-12"}>
                  {viewMode === "grid" ? (
                    Array(6)
                      .fill(0)
                      .map((_, index) => (
                        <div key={index} className="col-md-6 col-lg-4">
                          <SellerCardSkeleton count={1} />
                        </div>
                      ))
                  ) : (
                    <SellerCardSkeleton count={3} />
                  )}
                </div>
              ) : sellers.length > 0 ? (
                sortedSellers.map((seller, index) => (
                  <div
                    key={seller.seller_id || index}
                    className={
                      viewMode === "grid" ? "col-md-6 col-lg-4" : "col-12"
                    }
                  >
                    <SellerCard
                      seller={seller}
                      onContactClick={handleSellerContact}
                      className={viewMode === "list" ? "seller-card-list" : ""}
                    />
                  </div>
                ))
              ) : (
                userLocation && (
                  <div className="col-12">
                    <div className="text-center py-5">
                      <i className="ti-map-alt display-4 text-muted d-block mb-3"></i>
                      <h4>No sellers found in your area</h4>
                      <p className="text-muted mb-4">
                        Try increasing your search radius or searching in a
                        different location
                      </p>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleRadiusChange(100)}
                        disabled={searchRadius >= 100}
                      >
                        <i className="ti-target me-2"></i>
                        Search within 100km
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* Empty state for no location */}
          {!userLocation && !isLoading && sellers.length === 0 && (
            <div className="text-center py-5">
              <i className="ti-location-pin display-4 text-muted d-block mb-3"></i>
              <h4>Find Local Farmers Near You</h4>
              <p className="text-muted mb-4">
                Enter your location above or select a popular city to discover
                fresh produce from nearby gardeners and farmers
              </p>
              <div className="d-flex justify-content-center">
                <LocationInput
                  onLocationSelect={handleLocationSelect}
                  placeholder="Enter your location"
                  className="w-auto"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSS for list view */}
      <style jsx>{`
        .seller-card-list .card {
          flex-direction: row;
        }

        .seller-card-list .card-body {
          flex: 1;
        }

        @media (max-width: 768px) {
          .seller-card-list .card {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default NearbySellerPage;
