/**
 * LocationInput Component
 * Handles location input with current location detection and address search
 */

import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

const LocationInput = ({
  onLocationSelect,
  placeholder = "Enter your location or address",
  showCurrentLocation = true,
  className = "",
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Handle input change with debounced search
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setSelectedIndex(-1);

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce search
    if (value.trim().length >= 2) {
      debounceTimeoutRef.current = setTimeout(() => {
        searchLocations(value.trim());
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Search for location suggestions
  const searchLocations = async (query) => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `/api/locations?action=search_suggestions&query=${encodeURIComponent(
          query
        )}&limit=5`
      );

      if (!response.ok) throw new Error("Failed to fetch suggestions");

      const data = await response.json();

      if (data.success) {
        // Combine location suggestions and seller locations
        const locationSugs = data.data.location_suggestions.map((loc) => ({
          type: "location",
          name: loc,
          display: loc,
        }));

        const sellerSugs = data.data.sellers.slice(0, 3).map((seller) => ({
          type: "seller",
          name: seller.name,
          display: `${seller.name} - ${seller.city || seller.address}`,
          seller: seller,
        }));

        setSuggestions([...locationSugs, ...sellerSugs]);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Error searching locations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get user's current location
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser");
      return;
    }

    setIsGettingLocation(true);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        });
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode to get address
      const response = await fetch("/api/nearby-sellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reverse_geocode",
          latitude,
          longitude,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const locationData = {
          latitude,
          longitude,
          address: data.data.address,
          city: data.data.city,
          state: data.data.state,
          country: data.data.country,
          type: "current_location",
        };

        setInputValue(data.data.address);
        setShowSuggestions(false);
        onLocationSelect(locationData);
        toast.success("Current location detected");
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error getting current location:", error);

      let errorMessage = "Unable to get current location";
      if (error.code === 1) {
        errorMessage =
          "Location access denied. Please enable location services.";
      } else if (error.code === 2) {
        errorMessage = "Location information unavailable.";
      } else if (error.code === 3) {
        errorMessage = "Location request timed out.";
      }

      toast.error(errorMessage);
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Handle suggestion selection
  const selectSuggestion = async (suggestion) => {
    setInputValue(suggestion.display);
    setShowSuggestions(false);
    setSelectedIndex(-1);

    if (suggestion.type === "seller") {
      // For seller suggestions, use seller's location
      const seller = suggestion.seller;
      if (seller.latitude && seller.longitude) {
        onLocationSelect({
          latitude: seller.latitude,
          longitude: seller.longitude,
          address: seller.address,
          city: seller.city,
          state: seller.state,
          country: seller.country,
          type: "seller_location",
          seller: seller,
        });
      } else {
        // Geocode seller's address
        await geocodeAndSelect(seller.address || seller.city);
      }
    } else {
      // For location suggestions, geocode the location
      await geocodeAndSelect(suggestion.name);
    }
  };

  // Geocode address and select location
  const geocodeAndSelect = async (address) => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/nearby-sellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "geocode",
          address,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onLocationSelect({
          latitude: data.data.latitude,
          longitude: data.data.longitude,
          address: data.data.formatted_address,
          type: "geocoded",
        });
        toast.success("Location found");
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error geocoding address:", error);
      toast.error("Unable to find location");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      geocodeAndSelect(inputValue.trim());
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          selectSuggestion(suggestions[selectedIndex]);
        } else {
          handleSubmit(e);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`position-relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            ref={inputRef}
            type="text"
            className="form-control"
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            disabled={disabled || isGettingLocation}
          />

          {showCurrentLocation && (
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={getCurrentLocation}
              disabled={disabled || isGettingLocation || isLoading}
              title="Use current location"
            >
              {isGettingLocation ? (
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                ></span>
              ) : (
                <i className="ti-location-pin"></i>
              )}
            </button>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={
              disabled || isLoading || isGettingLocation || !inputValue.trim()
            }
          >
            {isLoading ? (
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              ></span>
            ) : (
              <i className="ti-search"></i>
            )}
          </button>
        </div>
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="list-group position-absolute w-100 shadow-sm"
          style={{ zIndex: 1000, top: "100%" }}
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className={`list-group-item list-group-item-action d-flex align-items-center ${
                index === selectedIndex ? "active" : ""
              }`}
              onClick={() => selectSuggestion(suggestion)}
            >
              <i
                className={`me-2 ${
                  suggestion.type === "seller"
                    ? "ti-user text-success"
                    : "ti-location-pin text-primary"
                }`}
              ></i>
              <div className="flex-grow-1 text-start">
                <div className="fw-medium">{suggestion.display}</div>
                {suggestion.type === "seller" && suggestion.seller && (
                  <small className="text-muted">
                    Seller • {suggestion.seller.city}
                  </small>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationInput;
