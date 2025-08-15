import OrderService from "@/services/OrderService";

/**
 * Utility functions for validating free item constraints
 */

/**
 * Check if two product names are similar (e.g., "Marigold Sapling" vs "Marigold Seeds")
 * @param {string} name1 - First product name
 * @param {string} name2 - Second product name
 * @returns {boolean} - True if names are similar
 */
export function areProductNamesSimilar(name1, name2) {
  if (!name1 || !name2) return false;

  const normalizedName1 = name1.toLowerCase().trim();
  const normalizedName2 = name2.toLowerCase().trim();

  console.log(
    `[DEBUG] Similarity check: "${normalizedName1}" vs "${normalizedName2}"`
  );

  // If names are exactly the same, they're similar
  if (normalizedName1 === normalizedName2) {
    console.log(`[DEBUG] Exact match - returning true`);
    return true;
  }

  // Extract the main product name (first word)
  const mainName1 = normalizedName1.split(" ")[0];
  const mainName2 = normalizedName2.split(" ")[0];

  console.log(`[DEBUG] First words: "${mainName1}" vs "${mainName2}"`);

  // Only consider similar if:
  // 1. First words are the same AND both have more than one word
  // 2. OR one name completely contains the other (for variations like "Marigold" vs "Marigold Plant")
  const bothHaveMultipleWords =
    normalizedName1.includes(" ") && normalizedName2.includes(" ");
  const firstWordsMatch = mainName1 === mainName2;
  const oneContainsOther =
    normalizedName1.includes(normalizedName2) ||
    normalizedName2.includes(normalizedName1);

  console.log(
    `[DEBUG] bothHaveMultipleWords: ${bothHaveMultipleWords}, firstWordsMatch: ${firstWordsMatch}, oneContainsOther: ${oneContainsOther}`
  );

  // More strict matching: only similar if they share the same base name with meaningful variations
  const result =
    (firstWordsMatch && bothHaveMultipleWords) ||
    (oneContainsOther &&
      Math.abs(normalizedName1.length - normalizedName2.length) <= 10);

  console.log(`[DEBUG] Final similarity result: ${result}`);
  return result;
}

/**
 * Check if user has similar free items in their cart
 * @param {Array} cartItems - Current cart items
 * @param {string} newItemName - Name of item being added
 * @returns {Object} - {hasConflict: boolean, conflictingItem: Object|null}
 */
export function checkCartForSimilarFreeItems(cartItems, newItemName) {
  console.log(`[DEBUG] Checking cart for similar items to: "${newItemName}"`);

  const conflictingItem = cartItems.find((item) => {
    if (item.price === 0) {
      console.log(
        `[DEBUG] Comparing "${newItemName}" with cart item: "${item.name}"`
      );
      const isSimilar = areProductNamesSimilar(item.name, newItemName);
      console.log(`[DEBUG] Are they similar? ${isSimilar}`);
      return isSimilar;
    }
    return false;
  });

  console.log(`[DEBUG] Cart check result - hasConflict: ${!!conflictingItem}`);

  return {
    hasConflict: !!conflictingItem,
    conflictingItem,
  };
}

/**
 * Check if user has previously ordered similar free items
 * @param {string} userId - User ID
 * @param {string} itemName - Name of item being added
 * @returns {Promise<Object>} - {hasConflict: boolean, conflictingOrder: Object|null}
 */
export async function checkOrderHistoryForSimilarFreeItems(userId, itemName) {
  try {
    if (!userId) {
      return { hasConflict: false, conflictingOrder: null };
    }

    const orders = await OrderService.getOrdersByUser(userId);

    console.log(`[DEBUG] Checking order history for item: "${itemName}"`);

    // Look through all order items for similar free items
    for (const order of orders) {
      if (order.items) {
        for (const orderItem of order.items) {
          // Check if this was a free item (price_per_unit = 0) and has similar name
          if (orderItem.price_per_unit === 0 && orderItem.vegetable) {
            console.log(
              `[DEBUG] Comparing "${itemName}" with previous order item: "${orderItem.vegetable.name}"`
            );
            const isSimilar = areProductNamesSimilar(
              orderItem.vegetable.name,
              itemName
            );
            console.log(`[DEBUG] Are they similar? ${isSimilar}`);

            if (isSimilar) {
              console.log(
                `[DEBUG] BLOCKING: Found similar free item in order history`
              );
              return {
                hasConflict: true,
                conflictingOrder: {
                  orderId: order.id,
                  itemName: orderItem.vegetable.name,
                  orderDate: order.created_at,
                  status: order.status,
                },
              };
            }
          }
        }
      }
    }

    console.log(`[DEBUG] No similar items found in order history`);
    return { hasConflict: false, conflictingOrder: null };
  } catch (error) {
    console.error("Error checking order history for free items:", error);
    // Don't block the user if we can't check history
    return { hasConflict: false, conflictingOrder: null };
  }
}

/**
 * Get the main product category from a name (e.g., "Marigold" from "Marigold Sapling")
 * @param {string} name - Product name
 * @returns {string} - Main category name
 */
export function getProductCategory(name) {
  if (!name) return "";
  return name.split(" ")[0].toLowerCase();
}

// Temporary test function - remove after debugging
export function testSimilarityLogic() {
  console.log("=== Testing Product Name Similarity ===");

  const testCases = [
    ["free1", "free2", false],
    ["free1", "free1", true],
    ["Marigold Sapling", "Marigold Seeds", true],
    ["Marigold", "Tomato", false],
    ["Marigold Plant", "Marigold", true],
    ["Free Item 1", "Free Item 2", true], // Both start with "Free" and have multiple words
    ["FreeItem1", "FreeItem2", false], // Single words, different
    ["Apple", "Apple Tree", true], // One contains the other
  ];

  testCases.forEach(([name1, name2, expected]) => {
    const result = areProductNamesSimilar(name1, name2);
    const status = result === expected ? "✅ PASS" : "❌ FAIL";
    console.log(
      `${status} "${name1}" vs "${name2}" = ${result} (expected: ${expected})`
    );
  });

  console.log("=== End Test ===");
}

// Uncomment to run tests
// testSimilarityLogic();
