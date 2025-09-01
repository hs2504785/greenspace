// Configuration for user listing limits to control database growth
export const LISTING_LIMITS = {
  // Default limits for regular users
  DEFAULT: {
    MAX_PRODUCTS: 10,
    MAX_IMAGES_PER_PRODUCT: 3,
    MAX_IMAGE_SIZE_MB: 2,
    MAX_DESCRIPTION_LENGTH: 500,
  },

  // Limits for verified sellers
  VERIFIED_SELLER: {
    MAX_PRODUCTS: 25,
    MAX_IMAGES_PER_PRODUCT: 5,
    MAX_IMAGE_SIZE_MB: 3,
    MAX_DESCRIPTION_LENGTH: 1000,
  },

  // Limits for premium users (future feature)
  PREMIUM: {
    MAX_PRODUCTS: 50,
    MAX_IMAGES_PER_PRODUCT: 8,
    MAX_IMAGE_SIZE_MB: 5,
    MAX_DESCRIPTION_LENGTH: 2000,
  },

  // Admin/superadmin have no limits
  ADMIN: {
    MAX_PRODUCTS: Infinity,
    MAX_IMAGES_PER_PRODUCT: 10,
    MAX_IMAGE_SIZE_MB: 10,
    MAX_DESCRIPTION_LENGTH: 5000,
  },
};

// Get user limits based on role
export function getUserLimits(userRole = "user") {
  switch (userRole.toLowerCase()) {
    case "admin":
    case "superadmin":
      return LISTING_LIMITS.ADMIN;
    case "verified_seller":
    case "seller":
      return LISTING_LIMITS.VERIFIED_SELLER;
    case "premium":
      return LISTING_LIMITS.PREMIUM;
    default:
      return LISTING_LIMITS.DEFAULT;
  }
}

// Check if user can create more products
export function canCreateProduct(currentCount, userRole = "user") {
  const limits = getUserLimits(userRole);
  return currentCount < limits.MAX_PRODUCTS;
}

// Get remaining product slots
export function getRemainingSlots(currentCount, userRole = "user") {
  const limits = getUserLimits(userRole);
  if (limits.MAX_PRODUCTS === Infinity) return Infinity;
  return Math.max(0, limits.MAX_PRODUCTS - currentCount);
}

// Validate product data against limits
export function validateProductData(productData, userRole = "user") {
  const limits = getUserLimits(userRole);
  const errors = [];

  // Check description length
  if (
    productData.description &&
    productData.description.length > limits.MAX_DESCRIPTION_LENGTH
  ) {
    errors.push(
      `Description must be ${limits.MAX_DESCRIPTION_LENGTH} characters or less`
    );
  }

  // Check image count
  if (
    productData.images &&
    productData.images.length > limits.MAX_IMAGES_PER_PRODUCT
  ) {
    errors.push(
      `Maximum ${limits.MAX_IMAGES_PER_PRODUCT} images allowed per product`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    limits,
  };
}
