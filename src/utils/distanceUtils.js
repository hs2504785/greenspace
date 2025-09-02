/**
 * Distance calculation utilities for geolocation
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number} Radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 * @param {number} distance - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export function formatDistance(distance) {
  // Handle invalid or NaN distances
  if (!distance || isNaN(distance) || distance < 0) {
    return "Distance unavailable";
  }

  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)}km`;
  } else {
    return `${Math.round(distance)}km`;
  }
}

/**
 * Extract coordinates from location string
 * Supports various formats: "lat, lon", "lat,lon", map links, etc.
 * @param {string} location - Location string
 * @returns {Object|null} {lat, lon} or null if not found
 */
export function extractCoordinates(location) {
  if (!location || typeof location !== "string") {
    return null;
  }

  // Try to extract coordinates from various formats

  // Format: "12.345, 67.890" or "12.345,67.890"
  const coordPattern = /(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/;
  const coordMatch = location.match(coordPattern);

  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lon = parseFloat(coordMatch[2]);

    // Validate coordinates (rough bounds for Earth)
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon };
    }
  }

  // Try to extract from Google Maps URLs with @ symbol
  const googleMapsPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/;
  const googleMatch = location.match(googleMapsPattern);

  if (googleMatch) {
    const lat = parseFloat(googleMatch[1]);
    const lon = parseFloat(googleMatch[2]);

    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon };
    }
  }

  // Try to extract from other map URL formats
  const mapUrlPattern = /[?&](?:q|ll|center)=(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/;
  const mapMatch = location.match(mapUrlPattern);

  if (mapMatch) {
    const lat = parseFloat(mapMatch[1]);
    const lon = parseFloat(mapMatch[2]);

    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon };
    }
  }

  // Try to extract from full Google Maps URLs (not shortened)
  const fullGoogleMapsPattern =
    /maps\.google\.com.*[@&](-?\d+\.?\d*),(-?\d+\.?\d*)/;
  const fullGoogleMatch = location.match(fullGoogleMapsPattern);

  if (fullGoogleMatch) {
    const lat = parseFloat(fullGoogleMatch[1]);
    const lon = parseFloat(fullGoogleMatch[2]);

    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon };
    }
  }

  // Check if it's a Google Maps share link (goo.gl) - these can't be parsed directly
  if (
    location.includes("maps.app.goo.gl") ||
    location.includes("goo.gl/maps")
  ) {
    // For now, we can't extract coordinates from shortened Google Maps links
    // This would require following the redirect, which is complex in the browser
    return null;
  }

  // Check if it's a simple location name (no coordinates)
  if (!/\d/.test(location)) {
    return null;
  }

  return null;
}

/**
 * Get current user's location using browser geolocation
 * @returns {Promise<Object>} Promise resolving to {lat, lon} or null
 */
export function getCurrentLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser");
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        console.warn("Error getting current location:", error.message);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  });
}

/**
 * Sort users by distance from a reference point
 * @param {Array} users - Array of user objects with location property
 * @param {Object} referencePoint - {lat, lon} reference coordinates
 * @returns {Array} Users sorted by distance with distance property added
 */
export function sortUsersByDistance(users, referencePoint) {
  if (!referencePoint || !users || !Array.isArray(users)) {
    return users || [];
  }

  const usersWithDistance = users.map((user) => {
    const userCoords = extractCoordinates(user.location);

    if (userCoords) {
      const distance = calculateDistance(
        referencePoint.lat,
        referencePoint.lon,
        userCoords.lat,
        userCoords.lon
      );

      return {
        ...user,
        distance,
        coordinates: userCoords,
      };
    }

    return {
      ...user,
      distance: null,
      coordinates: null,
    };
  });

  // Sort by distance (users with no coordinates go to the end)
  return usersWithDistance.sort((a, b) => {
    if (a.distance === null && b.distance === null) return 0;
    if (a.distance === null) return 1;
    if (b.distance === null) return -1;
    return a.distance - b.distance;
  });
}

/**
 * Filter users within a certain distance
 * @param {Array} users - Array of user objects with distance property
 * @param {number} maxDistance - Maximum distance in kilometers
 * @returns {Array} Filtered users within distance
 */
export function filterUsersByDistance(users, maxDistance) {
  if (!users || !Array.isArray(users) || !maxDistance) {
    return users || [];
  }

  return users.filter(
    (user) => user.distance !== null && user.distance <= maxDistance
  );
}

/**
 * Get distance categories for filtering
 * @returns {Array} Array of distance filter options
 */
export function getDistanceFilterOptions() {
  return [
    { value: "all", label: "All Distances", distance: null },
    { value: "1", label: "Within 1km", distance: 1 },
    { value: "5", label: "Within 5km", distance: 5 },
    { value: "10", label: "Within 10km", distance: 10 },
    { value: "25", label: "Within 25km", distance: 25 },
    { value: "50", label: "Within 50km", distance: 50 },
  ];
}
