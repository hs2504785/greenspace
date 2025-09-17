/**
 * Google Drive Image URL Utilities
 * Handles conversion between Google Drive sharing URLs and direct image URLs
 */

/**
 * Converts a Google Drive sharing URL to a direct image URL
 * @param {string} url - The Google Drive sharing URL
 * @returns {string} - Direct image URL or original URL if not a Drive URL
 */
export function convertGoogleDriveUrl(url) {
  if (!url || typeof url !== "string") {
    return url;
  }

  // Check if it's already a direct Google Drive URL
  if (url.includes("drive.google.com/uc?export=view&id=")) {
    return url;
  }

  // Check if it's a Google Drive sharing URL
  const driveShareRegex =
    /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/view/;
  const match = url.match(driveShareRegex);

  if (match && match[1]) {
    const fileId = match[1];
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  // Return original URL if it's not a Google Drive URL
  return url;
}

/**
 * Processes an array of image URLs, converting Google Drive URLs to direct URLs
 * @param {string[]} imageUrls - Array of image URLs
 * @returns {string[]} - Array of processed URLs
 */
export function processImageUrls(imageUrls) {
  if (!Array.isArray(imageUrls)) {
    return [];
  }

  return imageUrls
    .map((url) => url?.trim())
    .filter((url) => url && url.length > 0)
    .map((url) => convertGoogleDriveUrl(url))
    .filter((url) => isValidImageUrl(url));
}

/**
 * Validates if a URL is likely to be a valid image URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if URL appears to be valid
 */
export function isValidImageUrl(url) {
  if (!url || typeof url !== "string") {
    return false;
  }

  try {
    const urlObj = new URL(url);

    // Allow Google Drive URLs
    if (urlObj.hostname === "drive.google.com") {
      return url.includes("uc?export=view&id=");
    }

    // Allow common image hosting domains
    const allowedDomains = [
      "imgur.com",
      "picsum.photos",
      "unsplash.com",
      "images.unsplash.com",
      "cdn.pixabay.com",
      "images.pexels.com",
      "firebasestorage.googleapis.com",
      "supabase.co",
      "amazonaws.com",
      "cloudinary.com",
      "imagekit.io",
    ];

    const isAllowedDomain = allowedDomains.some((domain) =>
      urlObj.hostname.includes(domain)
    );

    if (isAllowedDomain) {
      return true;
    }

    // Check for common image extensions
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
    const hasImageExtension = imageExtensions.some((ext) =>
      urlObj.pathname.toLowerCase().includes(ext)
    );

    return hasImageExtension;
  } catch (error) {
    console.warn("Invalid URL:", url, error.message);
    return false;
  }
}

/**
 * Extracts Google Drive file ID from various URL formats
 * @param {string} url - Google Drive URL
 * @returns {string|null} - File ID or null if not found
 */
export function extractGoogleDriveFileId(url) {
  if (!url || typeof url !== "string") {
    return null;
  }

  // Pattern for sharing URLs: /file/d/FILE_ID/view
  const shareMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)\/view/);
  if (shareMatch && shareMatch[1]) {
    return shareMatch[1];
  }

  // Pattern for direct URLs: id=FILE_ID
  const directMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (directMatch && directMatch[1]) {
    return directMatch[1];
  }

  return null;
}

/**
 * Generates a direct Google Drive image URL from a file ID
 * @param {string} fileId - Google Drive file ID
 * @returns {string} - Direct image URL
 */
export function createGoogleDriveDirectUrl(fileId) {
  if (!fileId) {
    throw new Error("File ID is required");
  }
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

/**
 * Parses comma-separated image URLs and processes them
 * @param {string} imageString - Comma-separated image URLs
 * @returns {string[]} - Array of processed image URLs
 */
export function parseImageString(imageString) {
  if (!imageString || typeof imageString !== "string") {
    return [];
  }

  const urls = imageString
    .split(",")
    .map((url) => url.trim())
    .filter((url) => url.length > 0);

  return processImageUrls(urls);
}

/**
 * Validates and provides feedback on image URLs for sellers
 * @param {string[]} imageUrls - Array of image URLs to validate
 * @returns {Object} - Validation results with feedback
 */
export function validateSellerImages(imageUrls) {
  const results = {
    valid: [],
    invalid: [],
    warnings: [],
    suggestions: [],
  };

  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    results.warnings.push("No images provided");
    results.suggestions.push(
      "Add at least one product image for better visibility"
    );
    return results;
  }

  imageUrls.forEach((url, index) => {
    const trimmedUrl = url?.trim();

    if (!trimmedUrl) {
      results.invalid.push({
        index: index + 1,
        url: url,
        reason: "Empty URL",
      });
      return;
    }

    // Check if it's a Google Drive sharing URL that needs conversion
    if (
      trimmedUrl.includes("drive.google.com/file/d/") &&
      trimmedUrl.includes("/view")
    ) {
      const convertedUrl = convertGoogleDriveUrl(trimmedUrl);
      results.warnings.push({
        index: index + 1,
        message: "Google Drive sharing URL detected",
        suggestion: `Convert to direct URL: ${convertedUrl}`,
      });
      results.valid.push(convertedUrl);
      return;
    }

    // Validate the URL
    if (isValidImageUrl(trimmedUrl)) {
      results.valid.push(trimmedUrl);
    } else {
      results.invalid.push({
        index: index + 1,
        url: trimmedUrl,
        reason: "Invalid or unsupported image URL",
      });
    }
  });

  // Add general suggestions
  if (results.valid.length === 0) {
    results.suggestions.push(
      "Upload images to Google Drive and use direct URLs"
    );
    results.suggestions.push(
      "See our Google Drive Image Guide for step-by-step instructions"
    );
  }

  if (results.valid.length > 5) {
    results.warnings.push("More than 5 images may slow down loading");
  }

  return results;
}

export default {
  convertGoogleDriveUrl,
  processImageUrls,
  isValidImageUrl,
  extractGoogleDriveFileId,
  createGoogleDriveDirectUrl,
  parseImageString,
  validateSellerImages,
};


