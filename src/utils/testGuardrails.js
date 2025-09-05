/**
 * Test script for AI Guardrails
 * Run this to test various scenarios and ensure guardrails work correctly
 */

import {
  isFarmingRelated,
  isConversationFarmingFocused,
  generateRejectionMessage,
  analyzeMessageTopic,
  validateResponse,
} from "./aiGuardrails.js";

// Test cases for farming-related questions (should PASS)
const FARMING_QUESTIONS = [
  "How to grow tomatoes in winter?",
  "What fertilizer is best for vegetables?",
  "When should I plant onions?",
  "How to control pests in organic farming?",
  "What vegetables grow well in monsoon?",
  "How to prepare soil for planting?",
  "Best irrigation method for small farms?",
  "How to make compost at home?",
  "What is crop rotation?",
  "How to grow vegetables in containers?",
  "I want to buy fresh tomatoes",
  "Track my order #123",
  "How to pay using UPI?",
  "What vegetables are available in Delhi?",
  "How much do potatoes cost?",
  "I need organic vegetables",
  "How to become a seller on your platform?",
  "What payment methods do you accept?",
  "How long does delivery take?",
  "Can I get vegetables delivered to Bangalore?",
];

// Test cases for non-farming questions (should be REJECTED)
const NON_FARMING_QUESTIONS = [
  "What's the weather like today?",
  "How to cook pasta?",
  "What's the latest movie in theaters?",
  "How to learn programming?",
  "What's the capital of France?",
  "How to lose weight?",
  "What's the best smartphone to buy?",
  "How to write a resume?",
  "What's happening in politics?",
  "How to play guitar?",
  "What's the score of today's cricket match?",
  "How to book a flight ticket?",
  "What's the best restaurant nearby?",
  "How to fix my computer?",
  "What's the meaning of life?",
  "How to get a job?",
  "What's the latest fashion trend?",
  "How to meditate?",
  "What's the best college for engineering?",
  "How to invest in stocks?",
];

// Edge cases (borderline questions)
const EDGE_CASES = [
  "How to cook vegetables?", // Cooking - should be rejected
  "What are the health benefits of tomatoes?", // Health - should be rejected
  "How to store vegetables in refrigerator?", // Storage - borderline
  "What nutrients do vegetables provide?", // Nutrition - should be rejected
  "How to start a vegetable business?", // Business but farming-related
  "What's the price of vegetables in market?", // Market prices - should pass
  "How to transport vegetables?", // Logistics - farming-related
  "What equipment is needed for farming?", // Farming equipment - should pass
  "How to preserve vegetables?", // Preservation - borderline
  "What's the difference between organic and regular vegetables?", // Should pass
];

function runTests() {
  console.log("🧪 Running AI Guardrails Tests...\n");

  let passCount = 0;
  let failCount = 0;

  // Test farming questions (should pass)
  console.log("✅ Testing FARMING questions (should PASS):");
  FARMING_QUESTIONS.forEach((question, index) => {
    const analysis = analyzeMessageTopic(question);
    const isRelated = isFarmingRelated(question);

    if (isRelated && analysis.isFarmingRelated) {
      console.log(`  ✓ ${index + 1}. "${question}" - PASSED`);
      passCount++;
    } else {
      console.log(
        `  ❌ ${index + 1}. "${question}" - FAILED (Score: ${
          analysis.farmingScore
        }, Confidence: ${analysis.confidence}%)`
      );
      failCount++;
    }
  });

  console.log("\n🚫 Testing NON-FARMING questions (should be REJECTED):");
  NON_FARMING_QUESTIONS.forEach((question, index) => {
    const analysis = analyzeMessageTopic(question);
    const isRelated = isFarmingRelated(question);

    if (!isRelated && !analysis.isFarmingRelated) {
      console.log(`  ✓ ${index + 1}. "${question}" - CORRECTLY REJECTED`);
      passCount++;
    } else {
      console.log(
        `  ❌ ${index + 1}. "${question}" - INCORRECTLY PASSED (Score: ${
          analysis.farmingScore
        }, Confidence: ${analysis.confidence}%)`
      );
      failCount++;
    }
  });

  console.log("\n⚠️ Testing EDGE CASES:");
  EDGE_CASES.forEach((question, index) => {
    const analysis = analyzeMessageTopic(question);
    const isRelated = isFarmingRelated(question);
    const status = isRelated ? "PASSED" : "REJECTED";

    console.log(
      `  ${index + 1}. "${question}" - ${status} (Score: ${
        analysis.farmingScore
      }, Confidence: ${analysis.confidence}%)`
    );
  });

  // Test conversation context
  console.log("\n💬 Testing CONVERSATION CONTEXT:");

  const farmingConversation = [
    { role: "user", content: "How to grow tomatoes?" },
    { role: "assistant", content: "Here are tips for growing tomatoes..." },
    { role: "user", content: "What about fertilizers?" },
  ];

  const mixedConversation = [
    { role: "user", content: "How to grow tomatoes?" },
    { role: "assistant", content: "Here are tips for growing tomatoes..." },
    { role: "user", content: "What's the weather today?" },
  ];

  const nonFarmingConversation = [
    { role: "user", content: "What's the latest movie?" },
    { role: "assistant", content: "I can help with farming questions..." },
    { role: "user", content: "How to cook pasta?" },
  ];

  console.log(
    `  Farming conversation: ${
      isConversationFarmingFocused(farmingConversation)
        ? "FOCUSED"
        : "NOT FOCUSED"
    }`
  );
  console.log(
    `  Mixed conversation: ${
      isConversationFarmingFocused(mixedConversation)
        ? "FOCUSED"
        : "NOT FOCUSED"
    }`
  );
  console.log(
    `  Non-farming conversation: ${
      isConversationFarmingFocused(nonFarmingConversation)
        ? "FOCUSED"
        : "NOT FOCUSED"
    }`
  );

  // Test rejection messages
  console.log("\n📝 Testing REJECTION MESSAGES:");
  const rejectionSamples = [
    "What's the weather?",
    "How to cook?",
    "Latest movies?",
  ];

  rejectionSamples.forEach((question, index) => {
    const rejection = generateRejectionMessage(question);
    console.log(`  ${index + 1}. "${question}"`);
    console.log(`     → "${rejection}"`);
  });

  // Summary
  console.log(`\n📊 TEST SUMMARY:`);
  console.log(`  ✅ Passed: ${passCount}`);
  console.log(`  ❌ Failed: ${failCount}`);
  console.log(
    `  📈 Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(
      1
    )}%`
  );

  if (failCount === 0) {
    console.log(`\n🎉 All tests passed! Guardrails are working correctly.`);
  } else {
    console.log(`\n⚠️ Some tests failed. Please review the guardrails logic.`);
  }
}

// Export for use in other files
export { runTests };

// Run tests if this file is executed directly
if (
  typeof window === "undefined" &&
  import.meta.url === `file://${process.argv[1]}`
) {
  runTests();
}
