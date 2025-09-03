/**
 * Geocoding Service for converting addresses to coordinates
 * Supports multiple geocoding providers for better coverage
 */

/**
 * Convert an address string to coordinates using multiple geocoding services
 * @param {string} address - The address to geocode
 * @returns {Promise<Object|null>} {lat, lon, accuracy, source} or null if failed
 */
export async function geocodeAddress(address) {
  if (!address || typeof address !== "string") {
    return null;
  }

  // Clean the address
  const cleanAddress = address.trim();

  // If it's already coordinates, return them
  const existingCoords = extractCoordinatesFromText(cleanAddress);
  if (existingCoords) {
    return {
      ...existingCoords,
      accuracy: 10, // Assume high accuracy for explicit coordinates
      source: "existing_coordinates",
    };
  }

  // Try multiple geocoding services in order of preference
  const geocodingResults = await Promise.allSettled([
    tryGoogleGeocoding(cleanAddress),
    tryPositionStackGeocoding(cleanAddress),
    tryNominatimGeocoding(cleanAddress),
  ]);

  // Return the first successful result
  for (const result of geocodingResults) {
    if (result.status === "fulfilled" && result.value) {
      return result.value;
    }
  }

  return null;
}

/**
 * Extract coordinates from text if they exist
 * @param {string} text - Text that might contain coordinates
 * @returns {Object|null} {lat, lon} or null
 */
function extractCoordinatesFromText(text) {
  // Format: "12.345, 67.890" or "12.345,67.890"
  const coordPattern = /(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/;
  const coordMatch = text.match(coordPattern);

  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lon = parseFloat(coordMatch[2]);

    // Validate coordinates (rough bounds for Earth)
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon };
    }
  }

  return null;
}

/**
 * Google Maps Geocoding API
 * @param {string} address - Address to geocode
 * @returns {Promise<Object|null>} Geocoding result or null
 */
async function tryGoogleGeocoding(address) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.log("Google Maps API key not found, skipping Google geocoding");
      return null;
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${apiKey}&region=in`
    );

    if (!response.ok) {
      throw new Error("Google geocoding service unavailable");
    }

    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const result = data.results[0];
      const location = result.geometry.location;

      // Determine accuracy based on location type
      const locationType = result.geometry.location_type;
      let accuracy = 1000; // Default accuracy in meters

      switch (locationType) {
        case "ROOFTOP":
          accuracy = 10;
          break;
        case "RANGE_INTERPOLATED":
          accuracy = 50;
          break;
        case "GEOMETRIC_CENTER":
          accuracy = 100;
          break;
        case "APPROXIMATE":
          accuracy = 1000;
          break;
      }

      return {
        lat: location.lat,
        lon: location.lng,
        accuracy,
        source: "google_maps",
        formatted_address: result.formatted_address,
      };
    }

    return null;
  } catch (error) {
    console.error("Google geocoding error:", error);
    return null;
  }
}

/**
 * PositionStack Geocoding API
 * @param {string} address - Address to geocode
 * @returns {Promise<Object|null>} Geocoding result or null
 */
async function tryPositionStackGeocoding(address) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_POSITIONSTACK_API_KEY;

    if (!apiKey) {
      console.log(
        "PositionStack API key not found, skipping PositionStack geocoding"
      );
      return null;
    }

    const response = await fetch(
      `https://api.positionstack.com/v1/forward?access_key=${apiKey}&query=${encodeURIComponent(
        address
      )}&country=IN&limit=1`
    );

    if (!response.ok) {
      throw new Error("PositionStack geocoding service unavailable");
    }

    const data = await response.json();

    if (data.data && data.data.length > 0) {
      const result = data.data[0];

      // Determine accuracy based on result type
      let accuracy = 500; // Default accuracy
      if (result.type === "address") accuracy = 50;
      else if (result.type === "street") accuracy = 100;
      else if (result.type === "locality") accuracy = 1000;
      else if (result.type === "region") accuracy = 5000;

      return {
        lat: result.latitude,
        lon: result.longitude,
        accuracy,
        source: "positionstack",
        formatted_address: result.label,
      };
    }

    return null;
  } catch (error) {
    console.error("PositionStack geocoding error:", error);
    return null;
  }
}

/**
 * OpenStreetMap Nominatim Geocoding (Free)
 * @param {string} address - Address to geocode
 * @returns {Promise<Object|null>} Geocoding result or null
 */
async function tryNominatimGeocoding(address) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}&countrycodes=in&limit=1&addressdetails=1`,
      {
        headers: {
          "User-Agent": "AryaNaturalFarms-App/1.0 (Location Services)",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Nominatim geocoding service unavailable");
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const result = data[0];

      // Determine accuracy based on OSM class and type
      let accuracy = 1000; // Default accuracy
      if (result.class === "building") accuracy = 20;
      else if (result.class === "highway" && result.type === "residential")
        accuracy = 50;
      else if (result.class === "place" && result.type === "house")
        accuracy = 30;
      else if (result.class === "place" && result.type === "neighbourhood")
        accuracy = 200;
      else if (result.class === "place" && result.type === "suburb")
        accuracy = 500;
      else if (result.class === "place" && result.type === "city")
        accuracy = 2000;

      return {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        accuracy,
        source: "nominatim",
        formatted_address: result.display_name,
      };
    }

    return null;
  } catch (error) {
    console.error("Nominatim geocoding error:", error);
    return null;
  }
}

/**
 * Batch geocode multiple addresses
 * @param {Array<string>} addresses - Array of addresses to geocode
 * @param {number} batchSize - Number of addresses to process at once
 * @param {number} delay - Delay between batches in milliseconds
 * @returns {Promise<Array>} Array of geocoding results
 */
export async function batchGeocodeAddresses(
  addresses,
  batchSize = 5,
  delay = 1000
) {
  const results = [];

  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize);

    console.log(
      `Geocoding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
        addresses.length / batchSize
      )}`
    );

    const batchPromises = batch.map(async (address, index) => {
      const result = await geocodeAddress(address);
      return {
        originalIndex: i + index,
        address,
        result,
      };
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Add delay between batches to respect API rate limits
    if (i + batchSize < addresses.length) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return results;
}

/**
 * Create a migration script to update existing user locations with coordinates
 * @param {Array} users - Array of user objects with location field
 * @returns {Promise<Array>} Array of SQL update statements
 */
export async function generateLocationUpdateScript(users) {
  const updates = [];

  console.log(`Starting geocoding for ${users.length} users...`);

  const geocodingResults = await batchGeocodeAddresses(
    users.map((user) => user.location).filter(Boolean)
  );

  geocodingResults.forEach(({ originalIndex, address, result }) => {
    if (result) {
      const user = users.find((u) => u.location === address);
      if (user) {
        updates.push({
          userId: user.id,
          sql: `UPDATE users SET 
            latitude = ${result.lat}, 
            longitude = ${result.lon}, 
            location_accuracy = ${result.accuracy},
            coordinates_updated_at = NOW()
            WHERE id = '${user.id}';`,
        });
      }
    }
  });

  return updates;
}
