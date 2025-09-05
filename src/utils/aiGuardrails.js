/**
 * AI Guardrails Utility
 * Ensures AI chat only responds to farming-related questions
 */

// Farming-related keywords and topics
const FARMING_KEYWORDS = [
  // Vegetables & Crops
  "vegetable",
  "vegetables",
  "crop",
  "crops",
  "tomato",
  "potato",
  "onion",
  "carrot",
  "cabbage",
  "cauliflower",
  "brinjal",
  "okra",
  "spinach",
  "lettuce",
  "cucumber",
  "pumpkin",
  "gourd",
  "beans",
  "peas",
  "corn",
  "maize",
  "wheat",
  "rice",
  "barley",
  "millet",
  "quinoa",

  // Farming Terms
  "farm",
  "farming",
  "agriculture",
  "agricultural",
  "cultivation",
  "harvest",
  "harvesting",
  "planting",
  "sowing",
  "seeding",
  "irrigation",
  "fertilizer",
  "pesticide",
  "organic",
  "soil",
  "compost",
  "manure",
  "mulch",
  "greenhouse",
  "nursery",
  "garden",
  "gardening",

  // Farming Practices
  "crop rotation",
  "companion planting",
  "intercropping",
  "hydroponics",
  "aquaponics",
  "permaculture",
  "sustainable",
  "natural farming",
  "bio farming",
  "drip irrigation",
  "sprinkler",
  "tractor",
  "plow",
  "tilling",
  "weeding",
  "pruning",
  "grafting",

  // Seasons & Weather (farming context)
  "season",
  "seasonal",
  "monsoon",
  "kharif",
  "rabi",
  "zaid",
  "summer crop",
  "winter crop",
  "rainfall",
  "drought",
  "climate change",
  "farming weather",
  "crop temperature",
  "soil humidity",

  // Plant Health & Pests
  "pest",
  "disease",
  "fungus",
  "bacteria",
  "virus",
  "insect",
  "aphid",
  "caterpillar",
  "nematode",
  "blight",
  "rot",
  "wilt",
  "mold",
  "treatment",
  "spray",
  "neem",

  // Marketplace Terms
  "buy",
  "sell",
  "order",
  "payment",
  "delivery",
  "price",
  "cost",
  "market",
  "seller",
  "farmer",
  "produce",
  "fresh",
  "local",
  "organic",
  "quality",
  "upi",
  "gpay",
  "phonepay",
  "paytm",
  "qr code",
  "track order",
  "shipping",

  // Indian Context
  "india",
  "indian",
  "delhi",
  "mumbai",
  "bangalore",
  "hyderabad",
  "chennai",
  "punjab",
  "haryana",
  "uttar pradesh",
  "maharashtra",
  "karnataka",
  "tamil nadu",
  "rupee",
  "rupees",
  "₹",
  "kg",
  "kilogram",
  "quintal",
  "acre",
  "hectare",
];

// Non-farming topics to explicitly reject
const REJECTED_TOPICS = [
  // Technology (non-farming)
  "programming",
  "coding",
  "software",
  "computer",
  "laptop",
  "mobile phone",
  "app development",
  "website",
  "database",
  "algorithm",
  "javascript",
  "python",
  "artificial intelligence",
  "machine learning",
  "blockchain",
  "cryptocurrency",

  // Entertainment
  "movie",
  "film",
  "music",
  "song",
  "game",
  "gaming",
  "sports",
  "cricket",
  "football",
  "bollywood",
  "hollywood",
  "celebrity",
  "actor",
  "actress",

  // Weather (general, non-farming)
  "weather today",
  "current weather",
  "weather forecast",
  "temperature today",
  "will it rain",
  "sunny today",
  "cloudy",
  "hot today",
  "cold today",

  // Politics & News
  "politics",
  "politician",
  "election",
  "government",
  "minister",
  "president",
  "prime minister",
  "party",
  "vote",
  "democracy",
  "news",
  "media",

  // Personal & General
  "relationship",
  "dating",
  "marriage",
  "family",
  "personal",
  "psychology",
  "philosophy",
  "religion",
  "spiritual",
  "meditation",
  "yoga",
  "fitness",
  "health",
  "medicine",
  "doctor",
  "hospital",
  "disease",
  "treatment",

  // Education (non-farming)
  "school",
  "college",
  "university",
  "degree",
  "exam",
  "study",
  "student",
  "teacher",
  "professor",
  "course",
  "subject",
  "mathematics",
  "physics",
  "chemistry",
  "biology",
  "history",
  "geography",

  // Travel & Lifestyle
  "travel",
  "vacation",
  "hotel",
  "restaurant",
  "food",
  "recipe",
  "cooking",
  "fashion",
  "shopping",
  "beauty",
  "makeup",
  "lifestyle",
  "hobby",
];

/**
 * Check if a message is farming-related
 * @param {string} message - User message to validate
 * @returns {boolean} - True if farming-related, false otherwise
 */
function isFarmingRelated(message) {
  if (!message || typeof message !== "string") {
    return false;
  }

  const lowerMessage = message.toLowerCase();

  // Check for rejected topics first
  const hasRejectedTopic = REJECTED_TOPICS.some((topic) =>
    lowerMessage.includes(topic.toLowerCase())
  );

  if (hasRejectedTopic) {
    return false;
  }

  // Check for farming keywords
  const hasFarmingKeyword = FARMING_KEYWORDS.some((keyword) =>
    lowerMessage.includes(keyword.toLowerCase())
  );

  return hasFarmingKeyword;
}

/**
 * Validate if conversation context is farming-related
 * @param {Array} messages - Array of conversation messages
 * @returns {boolean} - True if conversation is farming-focused
 */
function isConversationFarmingFocused(messages) {
  if (!messages || messages.length === 0) {
    return true; // Allow initial conversation
  }

  // Check last few messages for farming context
  const recentMessages = messages.slice(-3);
  const farmingMessages = recentMessages.filter(
    (msg) => msg.role === "user" && isFarmingRelated(msg.content)
  );

  // At least 50% of recent messages should be farming-related
  return (
    farmingMessages.length >=
    Math.ceil(recentMessages.filter((m) => m.role === "user").length * 0.5)
  );
}

/**
 * Generate polite rejection message for off-topic questions
 * @param {string} userMessage - The off-topic message
 * @returns {string} - Polite rejection response
 */
function generateRejectionMessage(userMessage) {
  const responses = [
    "🌱 I'm specialized in helping with farming, vegetables, and agricultural questions. Could you ask me something related to farming, crops, or our marketplace?",

    "🥬 I'm here to assist with farming advice, vegetable growing, and marketplace queries. Please ask me about agriculture, crops, or buying/selling produce!",

    "🚜 My expertise is in farming and agriculture. I'd be happy to help with questions about vegetables, farming techniques, orders, or payments. What would you like to know about farming?",

    "🌾 I focus on agricultural topics like farming, vegetables, crop management, and our marketplace. Please ask me something related to farming or growing produce!",

    "🥕 I'm designed to help with farming questions, vegetable cultivation, and marketplace assistance. Could you ask me about agriculture, crops, or our services instead?",
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Advanced topic detection using pattern matching
 * @param {string} message - User message
 * @returns {Object} - Analysis result with confidence score
 */
function analyzeMessageTopic(message) {
  const lowerMessage = message.toLowerCase();

  // Calculate farming relevance score
  let farmingScore = 0;
  let rejectionScore = 0;

  // Check farming keywords with weights
  FARMING_KEYWORDS.forEach((keyword) => {
    if (lowerMessage.includes(keyword.toLowerCase())) {
      farmingScore += keyword.length > 5 ? 2 : 1; // Longer keywords get higher weight
    }
  });

  // Check rejection keywords
  REJECTED_TOPICS.forEach((topic) => {
    if (lowerMessage.includes(topic.toLowerCase())) {
      rejectionScore += topic.length > 5 ? 3 : 2; // Higher penalty for specific topics
    }
  });

  // Question patterns that might be farming-related even without keywords
  const farmingPatterns = [
    /how to (grow|plant|cultivate|harvest)/i,
    /when to (plant|sow|harvest)/i,
    /what (fertilizer|pesticide|treatment)/i,
    /best (season|time|method) for/i,
    /organic (farming|method|way)/i,
    /crop (rotation|management|yield)/i,
    /soil (preparation|health|quality)/i,
    /irrigation (system|method|schedule)/i,
    /pest (control|management|treatment)/i,
    /vegetable (garden|farming|growing)/i,
  ];

  const hasPatternMatch = farmingPatterns.some((pattern) =>
    pattern.test(message)
  );
  if (hasPatternMatch) {
    farmingScore += 3;
  }

  const confidence = Math.max(
    0,
    Math.min(100, (farmingScore - rejectionScore) * 10)
  );
  const isFarming =
    farmingScore > rejectionScore && (farmingScore > 0 || hasPatternMatch);

  return {
    isFarmingRelated: isFarming,
    confidence,
    farmingScore,
    rejectionScore,
    hasPatternMatch,
  };
}

/**
 * Validate response content to ensure it stays on topic
 * @param {string} response - AI generated response
 * @returns {boolean} - True if response is appropriate
 */
function validateResponse(response) {
  if (!response) return false;

  const lowerResponse = response.toLowerCase();

  // Check if response contains rejected topics
  const hasRejectedContent = REJECTED_TOPICS.some((topic) =>
    lowerResponse.includes(topic.toLowerCase())
  );

  if (hasRejectedContent) {
    return false;
  }

  // Response should contain farming-related content or be a polite rejection
  const hasFarmingContent = FARMING_KEYWORDS.some((keyword) =>
    lowerResponse.includes(keyword.toLowerCase())
  );

  const isPoliteRejection =
    lowerResponse.includes("farming") ||
    lowerResponse.includes("agriculture") ||
    lowerResponse.includes("specialized in");

  return hasFarmingContent || isPoliteRejection;
}

// Export individual functions for ES modules
export {
  isFarmingRelated,
  isConversationFarmingFocused,
  generateRejectionMessage,
  analyzeMessageTopic,
  validateResponse,
};

// Default export for compatibility
export default {
  isFarmingRelated,
  isConversationFarmingFocused,
  generateRejectionMessage,
  analyzeMessageTopic,
  validateResponse,
};
