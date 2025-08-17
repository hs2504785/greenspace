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
      // Bootstrap utility classes
      /^btn/,
      /^navbar/,
      /^nav/,
      /^container/,
      /^row/,
      /^col/,
      /^d-/,
      /^flex-/,
      /^justify-/,
      /^align-/,
      /^text-/,
      /^bg-/,
      /^border-/,
      /^m[tblrxy]?-/,
      /^p[tblrxy]?-/,
      /^w-/,
      /^h-/,
      /^position-/,

      // React Bootstrap dynamic classes
      /^show$/,
      /^active$/,
      /^disabled$/,
      /^fade$/,
      /^collapse/,
      /^modal/,
      /^dropdown/,
      /^offcanvas/,

      // Tooltip & Popover styles (critical for React Bootstrap)
      /^tooltip/,
      /^popover/,
      /^bs-tooltip/,
      /^bs-popover/,
      "tooltip-inner",
      "tooltip-arrow",
      "popover-header",
      "popover-body",
      "popover-arrow",

      // Custom brand classes for Arya Natural Farms
      /^brand-/,
      /^navbar-sticky/,
      /^mobile-menu/,
      /^fair-share/,

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

      // Cursor pointer for interactive elements
      "cursor-pointer",
    ],
    deep: [
      // Bootstrap component states that might be dynamically applied
      /modal/,
      /tooltip/,
      /popover/,
      /dropdown/,
      /navbar/,
      /carousel/,
      /offcanvas/,

      // All tooltip and popover related classes
      /tooltip-/,
      /popover-/,
      /bs-tooltip/,
      /bs-popover/,
    ],
    greedy: [
      // Responsive classes
      /^.*-sm-.*$/,
      /^.*-md-.*$/,
      /^.*-lg-.*$/,
      /^.*-xl-.*$/,
      /^.*-xxl-.*$/,

      // Bootstrap color variants
      /^.*-primary.*$/,
      /^.*-secondary.*$/,
      /^.*-success.*$/,
      /^.*-danger.*$/,
      /^.*-warning.*$/,
      /^.*-info.*$/,
      /^.*-light.*$/,
      /^.*-dark.*$/,

      // Tooltip and popover positioning classes
      /^.*tooltip.*$/,
      /^.*popover.*$/,
      /^.*placement.*$/,
      /^.*arrow.*$/,
    ],
    variables: [
      // CSS custom properties
      "--bs-*",
      "--brand-*",
    ],
    keyframes: [
      "fadeIn",
      "slideDown",
      "spinner-border",
      "spinner-grow",
      "placeholder-glow",
      "placeholder-wave",
    ],
  },

  // PurgeCSS options
  options: {
    variables: true,
    keyframes: true,
    fontFace: true,
    rejected: true, // This helps with debugging by showing which selectors were removed
    safelist: {
      // Additional programmatic safelist
      standard: [
        // Specific tooltip classes that are dynamically added
        "tooltip",
        "tooltip-inner",
        "tooltip-arrow",
        "bs-tooltip-top",
        "bs-tooltip-bottom",
        "bs-tooltip-start",
        "bs-tooltip-end",
        "bs-tooltip-auto",
        "popover",
        "popover-header",
        "popover-body",
        "popover-arrow",
        "bs-popover-top",
        "bs-popover-bottom",
        "bs-popover-start",
        "bs-popover-end",
        "bs-popover-auto",
        "show",
        "fade",
      ],
      greedy: [
        // Protect all Bootstrap utility classes
        /^(btn|nav|container|row|col|d-|flex-|justify-|align-|text-|bg-|border-|m[tblrxy]?-|p[tblrxy]?-)/,
        // Protect all tooltip and popover related classes
        /^tooltip/,
        /^popover/,
        /^bs-tooltip/,
        /^bs-popover/,
      ],
    },
  },
};
