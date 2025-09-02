/**
 * Utility functions for handling location data
 */

/**
 * Checks if a location string is a map link
 * @param {string} location - The location string to check
 * @returns {boolean} - True if it's a map link, false otherwise
 */
export function isMapLink(location) {
  if (!location || typeof location !== "string") {
    return false;
  }

  const trimmedLocation = location.trim();

  // Check if it's coordinates (lat, lon format) - make these clickable too
  const coordPattern = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/;
  if (coordPattern.test(trimmedLocation)) {
    return true;
  }

  // Common map link patterns
  const mapLinkPatterns = [
    /^https?:\/\/maps\.google\.com/i,
    /^https?:\/\/www\.google\.com\/maps/i,
    /^https?:\/\/goo\.gl\/maps/i,
    /^https?:\/\/maps\.app\.goo\.gl/i,
    /^https?:\/\/maps\.apple\.com/i,
    /^https?:\/\/www\.bing\.com\/maps/i,
    /^https?:\/\/waze\.com/i,
    /^https?:\/\/www\.waze\.com/i,
    /^geo:/i, // geo: protocol
  ];

  return mapLinkPatterns.some((pattern) => pattern.test(trimmedLocation));
}

/**
 * Gets the display text for a location
 * For map links, returns a shorter, user-friendly text
 * @param {string} location - The location string
 * @param {boolean} compact - Whether to use compact text for limited space
 * @returns {string} - Display text for the location
 */
export function getLocationDisplayText(location, compact = false) {
  if (!location) return "";

  if (isMapLink(location)) {
    // For map links, return a generic "View on Map" text
    // or try to extract meaningful info from the URL
    if (compact) {
      return "View on Map";
    }

    // Try to extract place name from Google Maps URLs
    if (location.includes("google.com/maps")) {
      // Check for place name in various URL formats
      const placeMatch =
        location.match(/place\/([^/@]+)/) || location.match(/search\/([^/@]+)/);
      if (placeMatch) {
        const placeName = decodeURIComponent(placeMatch[1]).replace(/\+/g, " ");
        return `${placeName} (View on Map)`;
      }

      // Check if it's a coordinate-based URL
      const coordMatch = location.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (coordMatch) {
        return "View Location on Map";
      }

      return "View on Google Maps";
    } else if (location.includes("maps.app.goo.gl")) {
      return "View Location on Map";
    } else if (location.includes("apple.com")) {
      return "View on Apple Maps";
    } else if (location.includes("waze.com")) {
      return "View on Waze";
    } else {
      return "View Location on Map";
    }
  }

  // Check if it's coordinates (lat, lon format)
  const coordPattern = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/;
  if (coordPattern.test(location.trim())) {
    if (compact) {
      return "View Coordinates";
    }
    return `${location} (Click to view on map)`;
  }

  // For regular text, return as-is
  return location;
}

/**
 * Opens a map link in a new tab/window
 * @param {string} mapUrl - The map URL to open
 */
export function openMapLink(mapUrl) {
  if (!mapUrl || !isMapLink(mapUrl)) {
    return;
  }

  // Check if it's coordinates - convert to Google Maps URL
  const coordPattern = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/;
  const coordMatch = mapUrl.trim().match(coordPattern);

  if (coordMatch) {
    const lat = coordMatch[1];
    const lon = coordMatch[2];
    const googleMapsUrl = `https://maps.google.com/@${lat},${lon},15z`;
    window.open(googleMapsUrl, "_blank", "noopener,noreferrer");
  } else {
    // It's already a URL, open directly
    window.open(mapUrl, "_blank", "noopener,noreferrer");
  }
}
