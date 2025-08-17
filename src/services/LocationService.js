/**
 * LocationService - Handles all location-related operations
 * Including geolocation, geocoding, distance calculations, and nearby sellers
 */

import { supabase } from "../lib/supabase";

class LocationService {
  constructor() {
    this.defaultRadius = 50; // Default radius in kilometers
    this.geocodingCache = new Map(); // Cache geocoding results
  }

  /**
   * Get user's current location using browser geolocation API
   * @param {Object} options - Geolocation options
   * @returns {Promise<{latitude: number, longitude: number}>}
   */
  async getCurrentPosition(options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes cache
      ...options,
    };

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          let errorMessage = "Unable to get location";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied by user";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
          }
          reject(new Error(errorMessage));
        },
        defaultOptions
      );
    });
  }

  /**
   * Geocode address to coordinates using a free geocoding service
   * @param {string} address - Address to geocode
   * @returns {Promise<{latitude: number, longitude: number, formatted_address: string}>}
   */
  async geocodeAddress(address) {
    try {
      // Check cache first
      const cacheKey = address.toLowerCase().trim();
      if (this.geocodingCache.has(cacheKey)) {
        return this.geocodingCache.get(cacheKey);
      }

      // Using Nominatim (OpenStreetMap) as a free geocoding service
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=in`
      );

      if (!response.ok) {
        throw new Error("Geocoding service unavailable");
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        throw new Error("Address not found");
      }

      const result = {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        formatted_address: data[0].display_name,
        place_id: data[0].place_id,
      };

      // Cache the result
      this.geocodingCache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error("Geocoding error:", error);
      throw new Error(`Failed to geocode address: ${error.message}`);
    }
  }

  /**
   * Reverse geocode coordinates to address
   * @param {number} latitude
   * @param {number} longitude
   * @returns {Promise<{address: string, city: string, state: string, country: string}>}
   */
  async reverseGeocode(latitude, longitude) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      );

      if (!response.ok) {
        throw new Error("Reverse geocoding service unavailable");
      }

      const data = await response.json();

      if (!data || !data.address) {
        throw new Error("Unable to determine address");
      }

      return {
        address: data.display_name,
        city:
          data.address.city || data.address.town || data.address.village || "",
        state: data.address.state || "",
        country: data.address.country || "India",
        postal_code: data.address.postcode || "",
      };
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      throw new Error(`Failed to reverse geocode: ${error.message}`);
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   * @param {number} lat1
   * @param {number} lon1
   * @param {number} lat2
   * @param {number} lon2
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Convert degrees to radians
   * @param {number} degrees
   * @returns {number}
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Update user location in database
   * @param {string} userId
   * @param {Object} locationData
   * @returns {Promise<Object>}
   */
  async updateUserLocation(userId, locationData) {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          address: locationData.address,
          city: locationData.city,
          state: locationData.state,
          country: locationData.country || "India",
          postal_code: locationData.postal_code,
          location_updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error("Error updating user location:", error);
      throw error;
    }
  }

  /**
   * Get nearby sellers using database function
   * @param {number} latitude
   * @param {number} longitude
   * @param {number} radiusKm
   * @returns {Promise<Array>}
   */
  async getNearbySellers(latitude, longitude, radiusKm = this.defaultRadius) {
    try {
      const { data, error } = await supabase.rpc("get_nearby_sellers", {
        user_lat: latitude,
        user_lon: longitude,
        radius_km: radiusKm,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching nearby sellers:", error);
      throw error;
    }
  }

  /**
   * Get nearby products using database function
   * @param {number} latitude
   * @param {number} longitude
   * @param {number} radiusKm
   * @returns {Promise<Array>}
   */
  async getNearbyProducts(latitude, longitude, radiusKm = this.defaultRadius) {
    try {
      const { data, error } = await supabase.rpc("get_nearby_products", {
        user_lat: latitude,
        user_lon: longitude,
        radius_km: radiusKm,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching nearby products:", error);
      throw error;
    }
  }

  /**
   * Get seller details with their products
   * @param {string} sellerId
   * @param {number} userLatitude
   * @param {number} userLongitude
   * @returns {Promise<Object>}
   */
  async getSellerWithProducts(
    sellerId,
    userLatitude = null,
    userLongitude = null
  ) {
    try {
      // Get seller details
      const { data: seller, error: sellerError } = await supabase
        .from("users")
        .select("*")
        .eq("id", sellerId)
        .eq("role", "seller")
        .single();

      if (sellerError) throw sellerError;

      // Get seller's products
      const { data: products, error: productsError } = await supabase
        .from("vegetables")
        .select("*")
        .eq("owner_id", sellerId)
        .eq("available", true)
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;

      // Calculate distance if user coordinates provided
      let distance = null;
      if (
        userLatitude &&
        userLongitude &&
        seller.latitude &&
        seller.longitude
      ) {
        distance = this.calculateDistance(
          userLatitude,
          userLongitude,
          seller.latitude,
          seller.longitude
        );
      }

      return {
        ...seller,
        products: products || [],
        distance_km: distance,
        product_count: products?.length || 0,
      };
    } catch (error) {
      console.error("Error fetching seller with products:", error);
      throw error;
    }
  }

  /**
   * Search sellers by city or state
   * @param {string} searchTerm
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  async searchSellersByLocation(searchTerm, limit = 20) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          `
          id, name, email, phone, whatsapp_number,
          address, city, state, latitude, longitude,
          created_at
        `
        )
        .eq("role", "seller")
        .or(
          `city.ilike.%${searchTerm}%,state.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`
        )
        .limit(limit)
        .order("name");

      if (error) throw error;

      // Get product counts for each seller
      const sellersWithCounts = await Promise.all(
        (data || []).map(async (seller) => {
          const { count } = await supabase
            .from("vegetables")
            .select("*", { count: "exact", head: true })
            .eq("owner_id", seller.id)
            .eq("available", true);

          return {
            ...seller,
            product_count: count || 0,
          };
        })
      );

      return sellersWithCounts;
    } catch (error) {
      console.error("Error searching sellers by location:", error);
      throw error;
    }
  }

  /**
   * Get popular cities with seller counts
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  async getPopularCities(limit = 10) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("city")
        .eq("role", "seller")
        .not("city", "is", null)
        .not("city", "eq", "");

      if (error) throw error;

      // Count cities
      const cityCount = {};
      (data || []).forEach((seller) => {
        if (seller.city) {
          cityCount[seller.city] = (cityCount[seller.city] || 0) + 1;
        }
      });

      // Sort by count and return top cities
      return Object.entries(cityCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([city, count]) => ({ city, seller_count: count }));
    } catch (error) {
      console.error("Error fetching popular cities:", error);
      throw error;
    }
  }

  /**
   * Validate coordinates
   * @param {number} latitude
   * @param {number} longitude
   * @returns {boolean}
   */
  isValidCoordinates(latitude, longitude) {
    return (
      typeof latitude === "number" &&
      typeof longitude === "number" &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  }

  /**
   * Format distance for display
   * @param {number} distanceKm
   * @returns {string}
   */
  formatDistance(distanceKm) {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    }
    return `${distanceKm}km`;
  }

  /**
   * Clear geocoding cache
   */
  clearCache() {
    this.geocodingCache.clear();
  }
}

export default new LocationService();
