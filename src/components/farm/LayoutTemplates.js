"use client";

/**
 * Layout Templates for Farm Grid System
 * Provides predefined templates for different farm layouts
 */

export const LAYOUT_TEMPLATES = {
  "24x24": {
    name: "Standard Block",
    description: "24×24ft blocks (576 sq ft each)",
    blockSize: { width: 24, height: 24 },
    defaultArrangement: "2x4", // 2 columns, 4 rows
    arrangements: ["1x1", "2x2", "2x4", "3x3", "4x2", "5x3"],
    icon: "ti-layout-grid3",
    color: "success",
    useCase: "Perfect for fruit trees and large crops",
  },
  "24x3": {
    name: "Narrow Strip",
    description: "24×3ft strips (72 sq ft each)",
    blockSize: { width: 24, height: 3 },
    defaultArrangement: "8x1", // 8 strips in a row
    arrangements: ["4x1", "6x1", "8x1", "10x1", "12x1", "2x2", "3x2"],
    icon: "ti-layout-column3",
    color: "info",
    useCase: "Ideal for row crops and vegetables",
  },
  "12x12": {
    name: "Medium Block",
    description: "12×12ft blocks (144 sq ft each)",
    blockSize: { width: 12, height: 12 },
    defaultArrangement: "4x4", // 4x4 grid
    arrangements: ["2x2", "3x3", "4x4", "5x5", "6x6", "2x4", "4x2"],
    icon: "ti-layout-grid2",
    color: "primary",
    useCase: "Great for mixed crops and herbs",
  },
  "6x6": {
    name: "Small Plot",
    description: "6×6ft plots (36 sq ft each)",
    blockSize: { width: 6, height: 6 },
    defaultArrangement: "8x8", // 8x8 grid
    arrangements: ["4x4", "6x6", "8x8", "10x10", "4x8", "8x4", "6x8"],
    icon: "ti-layout-grid",
    color: "warning",
    useCase: "Perfect for herbs, flowers, and small vegetables",
  },
  "3x3": {
    name: "Micro Plot",
    description: "3×3ft plots (9 sq ft each)",
    blockSize: { width: 3, height: 3 },
    defaultArrangement: "12x12", // 12x12 grid
    arrangements: ["8x8", "10x10", "12x12", "15x15", "8x12", "12x8"],
    icon: "ti-layout-grid4",
    color: "secondary",
    useCase: "Excellent for intensive herb gardens",
  },
  custom: {
    name: "Custom Size",
    description: "Define your own block dimensions",
    blockSize: { width: 24, height: 24 },
    defaultArrangement: "2x4",
    arrangements: ["1x1", "2x2", "2x4", "3x3", "4x2", "5x3"],
    icon: "ti-settings",
    color: "dark",
    useCase: "Create layouts for specific needs",
  },
};

/**
 * Generate blocks for a given template and arrangement
 * @param {string} templateKey - The template key (e.g., '24x24', 'custom')
 * @param {string} arrangement - The arrangement string (e.g., '2x4', '3x3')
 * @param {Object} customSize - Custom block size for custom template
 * @returns {Array} Array of block objects
 */
export const generateBlocks = (templateKey, arrangement, customSize = null) => {
  const template = LAYOUT_TEMPLATES[templateKey];
  if (!template) {
    throw new Error(`Template ${templateKey} not found`);
  }

  const blockSize =
    templateKey === "custom" && customSize ? customSize : template.blockSize;

  const [cols, rows] = arrangement.split("x").map(Number);
  const blocks = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      blocks.push({
        x: col * blockSize.width,
        y: row * blockSize.height,
        width: blockSize.width,
        height: blockSize.height,
      });
    }
  }

  return blocks;
};

/**
 * Calculate layout statistics
 * @param {Array} blocks - Array of block objects
 * @returns {Object} Layout statistics
 */
export const calculateLayoutStats = (blocks) => {
  if (!blocks || blocks.length === 0) {
    return {
      totalBlocks: 0,
      totalArea: 0,
      averageBlockSize: 0,
      dimensions: { width: 0, height: 0 },
    };
  }

  const totalArea = blocks.reduce(
    (sum, block) => sum + block.width * block.height,
    0
  );

  const averageBlockSize = totalArea / blocks.length;

  const maxX = Math.max(...blocks.map((b) => b.x + b.width));
  const maxY = Math.max(...blocks.map((b) => b.y + b.height));

  return {
    totalBlocks: blocks.length,
    totalArea,
    averageBlockSize: Math.round(averageBlockSize),
    dimensions: { width: maxX, height: maxY },
  };
};

/**
 * Get template by block size
 * @param {number} width - Block width
 * @param {number} height - Block height
 * @returns {string|null} Template key or null if not found
 */
export const getTemplateBySize = (width, height) => {
  for (const [key, template] of Object.entries(LAYOUT_TEMPLATES)) {
    if (
      template.blockSize.width === width &&
      template.blockSize.height === height
    ) {
      return key;
    }
  }
  return "custom";
};

/**
 * Validate arrangement for template
 * @param {string} templateKey - Template key
 * @param {string} arrangement - Arrangement string
 * @returns {boolean} Whether arrangement is valid
 */
export const isValidArrangement = (templateKey, arrangement) => {
  const template = LAYOUT_TEMPLATES[templateKey];
  if (!template) return false;

  return template.arrangements.includes(arrangement);
};

/**
 * Get suggested arrangements for template
 * @param {string} templateKey - Template key
 * @param {number} maxBlocks - Maximum number of blocks desired
 * @returns {Array} Array of suggested arrangements
 */
export const getSuggestedArrangements = (templateKey, maxBlocks = 20) => {
  const template = LAYOUT_TEMPLATES[templateKey];
  if (!template) return [];

  return template.arrangements.filter((arrangement) => {
    const [cols, rows] = arrangement.split("x").map(Number);
    return cols * rows <= maxBlocks;
  });
};

export default LAYOUT_TEMPLATES;
