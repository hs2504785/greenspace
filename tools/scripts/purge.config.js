const sourceDir = ".next/static/css";

/**
 * Shared configuration for PurgeCSS and UnCSS for Next.js Arya Natural Farms
 */
module.exports = {
  // Source directory for built CSS files
  sourceDir,

  // Files to analyze for used CSS - Next.js structure
  content: [
    ".next/server/app/**/*.html",
    ".next/server/app/**/*.rsc",
    ".next/static/chunks/**/*.js",
    "src/**/*.js",
    "src/**/*.jsx",
    "src/**/*.ts",
    "src/**/*.tsx",
  ],

  // CSS files to process (Next.js generates hashed CSS files)
  css: [`${sourceDir}/*.css`],

  // Safelist configuration for Bootstrap 5 + React Bootstrap + Custom styles
  safelist: {
    standard: [
      // React Bootstrap dynamic classes
      /^show$/,
      /^active$/,
      /^disabled$/,
      /^fade$/,
      /^collapse/,
      /^modal/,
      /^dropdown/,
      /^offcanvas/,
      /^col/,

      // Critical state classes for Bootstrap components
      "show",
      "fade",
      "showing",
      "hiding",
      "active",
      "disabled",

      // ESSENTIAL STRUCTURAL CLASSES + DYNAMIC CLASSES
      // Some structural classes might not be detected by static analysis

      // Modal structural classes (essential for functionality)
      "modal",
      "modal-dialog",
      "modal-content", // CRITICAL: Modal structure
      "modal-header",
      "modal-title",
      "modal-body",
      "modal-footer",
      "modal-dialog-centered",
      "modal-lg",
      // JavaScript-added backdrop elements
      "offcanvas-backdrop", // JS creates backdrop element
      "modal-backdrop", // JS creates backdrop element

      // Essential positioning classes (some are set via JS props like placement="end")
      "offcanvas-end", // Used via React prop placement="end" - might not be detected statically

      // Offcanvas structural classes
      "offcanvas",
      "offcanvas-header",
      "offcanvas-title",
      "offcanvas-body",

      // Dropdown structural classes
      "dropdown",
      "dropdown-toggle",
      "dropdown-menu",
      "dropdown-menu-end",
      "dropdown-item",
      "dropdown-header",
      "dropdown-divider",

      // Tooltip structural classes (CRITICAL - was missing!)
      "tooltip",
      "tooltip-inner", // CRITICAL: Tooltip content container
      "tooltip-arrow", // CRITICAL: Tooltip arrow/pointer

      // Animation classes
      /^animate/,
      /^transition/,
      /^transform/,

      // React Hot Toast classes
      /^Toastify/,
      /^toast/,

      // Themify icons
      /^ti-/,
      /^themify/,
    ],
    deep: [
      // Bootstrap component states that might be dynamically applied
      /modal/,
      /tooltip/,
      /popover/,
      /dropdown/,
    ],
    greedy: [
      // Spinner/Loading patterns
      /spinner/, // All spinner classes: spinner-border, spinner-grow, etc.

      // Offcanvas structural patterns
      /offcanvas/, // All offcanvas classes

      // JS-added backdrop elements
      /modal-backdrop/, // JS creates backdrop
      /offcanvas-backdrop/, // JS creates backdrop

      // === CRITICAL COMPONENT STATES (JS-added classes) ===
      /^show$/, // Bootstrap JS adds these
      /^showing$/,
      /^hide$/,
      /^hiding$/,
      /^fade$/,
      /^active$/,
      /^disabled$/,
      /arrow/,
      /tooltip-arrow/,
    ],
  },
  variables: true,
  keyframes: true,
};
