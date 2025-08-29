/**
 * Tree Type Classifier Utility
 * Classifies trees as Big, Medium, or Small based on their grid position
 * within a 24x24 block layout
 */

/**
 * Determines the tree type based on grid position
 * @param {number} gridX - X position in the grid
 * @param {number} gridY - Y position in the grid
 * @param {number} blockWidth - Width of the block (default 24)
 * @param {number} blockHeight - Height of the block (default 24)
 * @returns {string} - 'big', 'centerBig', 'medium', 'small', or 'tiny'
 */
export const getTreeType = (
  gridX,
  gridY,
  blockWidth = 24,
  blockHeight = 24
) => {
  // Big trees (B): At corners of 24x24 blocks
  const isCorner =
    (gridX === 0 && gridY === 0) || // Top-left corner
    (gridX === blockWidth && gridY === 0) || // Top-right corner
    (gridX === 0 && gridY === blockHeight) || // Bottom-left corner
    (gridX === blockWidth && gridY === blockHeight); // Bottom-right corner

  if (isCorner) {
    return "big";
  }

  // Center Big trees (CB): Center of each 24x24 block
  const midX = blockWidth / 2;
  const midY = blockHeight / 2;

  const isCenter = gridX === midX && gridY === midY; // Center-center (12,12)

  if (isCenter) {
    return "centerBig";
  }

  // Medium trees (M): Edge mid-points between big trees (NOT center)
  const isMidPoint =
    (gridX === midX && gridY === 0) || // Top-center
    (gridX === blockWidth && gridY === midY) || // Right-center
    (gridX === midX && gridY === blockHeight) || // Bottom-center
    (gridX === 0 && gridY === midY); // Left-center

  if (isMidPoint) {
    return "medium";
  }

  // Small trees (S): Only at 6ft intervals (quarter positions)
  const quarterX = blockWidth / 4; // 6ft for 24ft block
  const threeQuarterX = (3 * blockWidth) / 4; // 18ft for 24ft block
  const quarterY = blockHeight / 4; // 6ft for 24ft block
  const threeQuarterY = (3 * blockHeight) / 4; // 18ft for 24ft block

  const isSmallPosition =
    (gridX === quarterX && gridY === 0) || // Top-quarter
    (gridX === threeQuarterX && gridY === 0) || // Top-three-quarter
    (gridX === blockWidth && gridY === quarterY) || // Right-quarter
    (gridX === blockWidth && gridY === threeQuarterY) || // Right-three-quarter
    (gridX === threeQuarterX && gridY === blockHeight) || // Bottom-three-quarter
    (gridX === quarterX && gridY === blockHeight) || // Bottom-quarter
    (gridX === 0 && gridY === threeQuarterY) || // Left-three-quarter
    (gridX === 0 && gridY === quarterY) || // Left-quarter
    (gridX === quarterX && gridY === midY) || // Center-left-quarter
    (gridX === threeQuarterX && gridY === midY) || // Center-right-quarter
    (gridX === midX && gridY === quarterY) || // Center-top-quarter
    (gridX === midX && gridY === threeQuarterY); // Center-bottom-quarter

  if (isSmallPosition) {
    return "small";
  }

  // Tiny trees: All other positions (3ft, 9ft, 15ft, 21ft intervals)
  return "tiny";
};

/**
 * Gets CSS class name for tree type
 * @param {string} treeType - 'big', 'centerBig', 'medium', 'small', or 'tiny'
 * @returns {string} - CSS class name
 */
export const getTreeTypeClass = (treeType) => {
  switch (treeType) {
    case "big":
      return "treeCircleBig";
    case "centerBig":
      return "treeCircleCenterBig";
    case "medium":
      return "treeCircleMedium";
    case "small":
      return "treeCircle"; // Cyan for small trees
    case "tiny":
    default:
      return "treeCircleTiny"; // Smallest size for tiny trees
  }
};

/**
 * Gets tree type from grid position and returns appropriate CSS class
 * @param {number} gridX - X position in the grid
 * @param {number} gridY - Y position in the grid
 * @param {number} blockWidth - Width of the block (default 24)
 * @param {number} blockHeight - Height of the block (default 24)
 * @returns {string} - CSS class name
 */
export const getTreeClassFromPosition = (
  gridX,
  gridY,
  blockWidth = 24,
  blockHeight = 24
) => {
  const treeType = getTreeType(gridX, gridY, blockWidth, blockHeight);
  return getTreeTypeClass(treeType);
};

/**
 * Gets planting guide CSS class based on tree type and edge position
 * @param {number} gridX - X position in the grid
 * @param {number} gridY - Y position in the grid
 * @param {number} blockWidth - Width of the block (default 24)
 * @param {number} blockHeight - Height of the block (default 24)
 * @param {boolean} isEdge - Whether this is an edge position
 * @returns {string} - CSS class name for planting guide
 */
export const getPlantingGuideClass = (
  gridX,
  gridY,
  blockWidth = 24,
  blockHeight = 24,
  isEdge = false
) => {
  const treeType = getTreeType(gridX, gridY, blockWidth, blockHeight);

  if (isEdge) {
    switch (treeType) {
      case "big":
        return "edgeGuideBig";
      case "centerBig":
        return "edgeGuideCenterBig";
      case "medium":
        return "edgeGuideMedium";
      case "small":
        return "edgeGuide"; // Cyan for small trees
      case "tiny":
      default:
        return "edgeGuideTiny"; // Smallest for tiny trees
    }
  } else {
    switch (treeType) {
      case "big":
        return "interiorGuideBig";
      case "centerBig":
        return "interiorGuideCenterBig";
      case "medium":
        return "interiorGuideMedium";
      case "small":
        return "interiorGuide"; // Cyan for small trees
      case "tiny":
      default:
        return "interiorGuideTiny"; // Smallest for tiny trees
    }
  }
};
