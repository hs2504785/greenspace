import toast from "react-hot-toast";

// Enhanced Toast Service
// Provides consistent, visually distinct toast notifications

/**
 * Default toast configuration
 */
const defaultConfig = {
  duration: 4000,
  style: {
    minWidth: "300px",
    fontSize: "14px",
    fontWeight: "500",
  },
};

/**
 * Enhanced Success Toast
 * @param {string} message - The success message to display
 * @param {Object} options - Additional options to override defaults
 */
export const toastSuccess = (message, options = {}) => {
  return toast.success(message, {
    ...defaultConfig,
    duration: options.duration || 4000,
    className: "toast-success",
    style: {
      ...defaultConfig.style,
      ...options.style,
    },
    iconTheme: {
      primary: "#28a745",
      secondary: "#ffffff",
    },
    ...options,
  });
};

/**
 * Enhanced Error Toast
 * @param {string} message - The error message to display
 * @param {Object} options - Additional options to override defaults
 */
export const toastError = (message, options = {}) => {
  return toast.error(message, {
    ...defaultConfig,
    duration: options.duration || 6000, // Longer duration for errors
    className: "toast-error",
    style: {
      ...defaultConfig.style,
      ...options.style,
    },
    iconTheme: {
      primary: "#dc3545",
      secondary: "#ffffff",
    },
    ...options,
  });
};

/**
 * Enhanced Warning Toast
 * @param {string} message - The warning message to display
 * @param {Object} options - Additional options to override defaults
 */
export const toastWarning = (message, options = {}) => {
  return toast(message, {
    ...defaultConfig,
    duration: options.duration || 5000,
    className: "toast-warning",
    icon: "⚠️",
    style: {
      ...defaultConfig.style,
      ...options.style,
    },
    iconTheme: {
      primary: "#ffc107",
      secondary: "#212529",
    },
    ...options,
  });
};

/**
 * Enhanced Info Toast
 * @param {string} message - The info message to display
 * @param {Object} options - Additional options to override defaults
 */
export const toastInfo = (message, options = {}) => {
  return toast(message, {
    ...defaultConfig,
    duration: options.duration || 4000,
    className: "toast-info",
    icon: "ℹ️",
    style: {
      ...defaultConfig.style,
      ...options.style,
    },
    iconTheme: {
      primary: "#17a2b8",
      secondary: "#ffffff",
    },
    ...options,
  });
};

/**
 * Enhanced Loading Toast
 * @param {string} message - The loading message to display
 * @param {Object} options - Additional options to override defaults
 */
export const toastLoading = (message, options = {}) => {
  return toast.loading(message, {
    ...defaultConfig,
    className: "toast-loading",
    style: {
      ...defaultConfig.style,
      ...options.style,
    },
    iconTheme: {
      primary: "#6c757d",
      secondary: "#ffffff",
    },
    ...options,
  });
};

/**
 * Enhanced Promise Toast
 * Shows loading, then success or error based on promise result
 * @param {Promise} promise - The promise to track
 * @param {Object} messages - Object with loading, success, and error messages
 * @param {Object} options - Additional options to override defaults
 */
export const toastPromise = (promise, messages, options = {}) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading || "Loading...",
      success: messages.success || "Success!",
      error: messages.error || "Something went wrong",
    },
    {
      ...defaultConfig,
      loading: {
        className: "toast-loading",
        ...options.loading,
      },
      success: {
        className: "toast-success",
        duration: 4000,
        ...options.success,
      },
      error: {
        className: "toast-error",
        duration: 6000,
        ...options.error,
      },
      ...options,
    }
  );
};

/**
 * Custom toast with advanced options
 * @param {string} message - The message to display
 * @param {Object} options - Toast configuration
 */
export const toastCustom = (message, options = {}) => {
  const {
    type = "default",
    title,
    description,
    action,
    ...restOptions
  } = options;

  let className = "toast-custom";
  let icon = null;

  // Set className and icon based on type
  switch (type) {
    case "success":
      className = "toast-success";
      icon = "✅";
      break;
    case "error":
      className = "toast-error";
      icon = "❌";
      break;
    case "warning":
      className = "toast-warning";
      icon = "⚠️";
      break;
    case "info":
      className = "toast-info";
      icon = "ℹ️";
      break;
    default:
      icon = options.icon;
  }

  // Create custom content if title or description is provided
  let content = message;
  if (title || description) {
    content = (
      <div className="toast-content">
        <div className="toast-icon">{icon}</div>
        <div className="toast-text">
          {title && <div className="toast-title">{title}</div>}
          <div className="toast-message">{description || message}</div>
        </div>
        {action && <div className="toast-action">{action}</div>}
      </div>
    );
  }

  return toast(content, {
    ...defaultConfig,
    className,
    icon: !title && !description ? icon : false,
    ...restOptions,
  });
};

/**
 * Dismiss a specific toast
 * @param {string} toastId - The ID of the toast to dismiss
 */
export const toastDismiss = (toastId) => {
  return toast.dismiss(toastId);
};

/**
 * Dismiss all toasts
 */
export const toastDismissAll = () => {
  return toast.dismiss();
};

/**
 * Update an existing toast
 * @param {string} toastId - The ID of the toast to update
 * @param {string} message - The new message
 * @param {Object} options - Additional options
 */
export const toastUpdate = (toastId, message, options = {}) => {
  return toast.success(message, {
    id: toastId,
    ...options,
  });
};

// Enhanced toast presets for common use cases
export const toastPresets = {
  // Authentication
  loginSuccess: () => toastSuccess("Welcome back!", { icon: "👋" }),
  loginError: () => toastError("Login failed. Please check your credentials."),
  logoutSuccess: () => toastInfo("You have been logged out.", { icon: "👋" }),

  // Orders
  orderSuccess: () =>
    toastSuccess("Order placed successfully!", { icon: "🛒", duration: 5000 }),
  orderError: () => toastError("Failed to place order. Please try again."),
  orderUpdated: () => toastInfo("Order status updated.", { icon: "📦" }),

  // Products
  productAdded: () => toastSuccess("Product added to cart!", { icon: "🛍️" }),
  productRemoved: () => toastInfo("Product removed from cart.", { icon: "🗑️" }),

  // General operations
  saveSuccess: () =>
    toastSuccess("Changes saved successfully!", { icon: "💾" }),
  saveError: () => toastError("Failed to save changes. Please try again."),
  deleteSuccess: () =>
    toastSuccess("Item deleted successfully!", { icon: "🗑️" }),
  deleteError: () => toastError("Failed to delete item. Please try again."),

  // Network
  networkError: () =>
    toastError("Network error. Please check your connection.", { icon: "🌐" }),
  serverError: () =>
    toastError("Server error. Please try again later.", { icon: "⚠️" }),

  // Validation
  validationError: (message) => toastWarning(message, { icon: "📝" }),
  formSuccess: () =>
    toastSuccess("Form submitted successfully!", { icon: "✅" }),

  // File operations
  uploadSuccess: () =>
    toastSuccess("File uploaded successfully!", { icon: "📤" }),
  uploadError: () =>
    toastError("File upload failed. Please try again.", { icon: "📤" }),

  // Permissions
  permissionDenied: () =>
    toastError("You don't have permission to perform this action.", {
      icon: "🔒",
    }),
};

// Export default object with all functions
const toastService = {
  success: toastSuccess,
  error: toastError,
  warning: toastWarning,
  info: toastInfo,
  loading: toastLoading,
  promise: toastPromise,
  custom: toastCustom,
  dismiss: toastDismiss,
  dismissAll: toastDismissAll,
  update: toastUpdate,
  presets: toastPresets,
};

export default toastService;
