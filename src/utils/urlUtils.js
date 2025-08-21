/**
 * Utility functions for URL handling in both client and server contexts
 */

/**
 * Get the correct base URL for API calls
 * @param {Request|Object} req - Request object (server) or null (client)
 * @returns {string} The base URL
 */
export function getBaseUrl(req = null) {
  // Client-side (browser)
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // Server-side (API routes)
  if (req) {
    // In production, use the host from the request
    if (process.env.NODE_ENV === "production") {
      const protocol = req.headers.get("x-forwarded-proto") || "https";
      const host = req.headers.get("host");
      return `${protocol}://${host}`;
    }
  }

  // Development fallback
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
}

/**
 * Generate a full order URL
 * @param {string} orderId - The order ID
 * @param {Request|Object} req - Request object (optional, for server-side)
 * @returns {string} Full order URL
 */
export function getOrderUrl(orderId, req = null) {
  return `${getBaseUrl(req)}/orders/${orderId}`;
}

/**
 * Generate API endpoint URL
 * @param {string} endpoint - API endpoint path (e.g., "/api/orders")
 * @param {Request|Object} req - Request object (optional, for server-side)
 * @returns {string} Full API URL
 */
export function getApiUrl(endpoint, req = null) {
  const baseUrl = getBaseUrl(req);
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}
