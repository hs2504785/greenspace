import { google } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { z } from "zod";
import { getBaseUrl, getApiUrl } from "@/utils/urlUtils";
import {
  isFarmingRelated,
  isConversationFarmingFocused,
  generateRejectionMessage,
  analyzeMessageTopic,
  validateResponse,
} from "@/utils/aiGuardrails";

export async function POST(req) {
  try {
    const { messages, user } = await req.json();

    // Check for API key
    const apiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      console.error("❌ Google AI API key not found in environment");
      return new Response("AI service not configured", { status: 503 });
    }

    console.log(
      "✅ Enhanced Smart AI Chat - Messages received:",
      messages?.length || 0
    );
    console.log("👤 User context:", {
      id: user?.id,
      email: user?.email,
      role: user?.role,
      phone: user?.whatsapp_number || user?.phone,
      location: user?.location,
    });

    // Check for empty messages that could cause API errors
    const validMessages =
      messages?.filter((m) => m?.content && m?.content.trim()) || [];
    console.log("🔍 Valid messages after filtering:", validMessages.length);

    if (validMessages.length === 0) {
      console.error("❌ No valid messages found");
      return new Response("No valid messages provided", { status: 400 });
    }

    // 🛡️ GUARDRAILS: Check if the conversation is farming-related
    const lastUserMessage = validMessages[validMessages.length - 1];
    if (lastUserMessage?.role === "user") {
      const topicAnalysis = analyzeMessageTopic(lastUserMessage.content);
      console.log("🔍 Topic Analysis:", topicAnalysis);

      if (!topicAnalysis.isFarmingRelated) {
        console.log("🚫 Non-farming topic detected, generating rejection");
        const rejectionMessage = generateRejectionMessage(
          lastUserMessage.content,
          topicAnalysis.detectedTopics
        );

        return new Response(
          JSON.stringify({
            role: "assistant",
            content: rejectionMessage,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    const systemPrompt = `You are Arya Natural Farms AI, an intelligent assistant EXCLUSIVELY for farming, agriculture, and vegetable marketplace topics.

🚨 STRICT TOPIC RESTRICTIONS:
- ONLY answer questions about: farming, agriculture, vegetables, crops, gardening, plant care, soil, irrigation, fertilizers, pesticides, organic farming, seasonal advice, marketplace orders, payments (UPI), and delivery
- NEVER answer questions about: technology, entertainment, politics, personal advice, health/medical, education, travel, cooking recipes, or any non-farming topics
- If asked about non-farming topics, politely redirect to farming questions
- Always stay focused on agricultural and marketplace assistance

CONTEXT:
- User: ${user?.email || "Guest"} (${user?.role || "guest"})
- Location: ${user?.location || "India"}

🛠️ ENHANCED CAPABILITIES & TOOLS:
You have access to powerful tools to help customers:

1. 🔍 PRODUCT SEARCH (search_products):
   - Find vegetables by name, category, location, price range
   - Check prices, availability, seller information
   - Example: "Find organic tomatoes under ₹50 in Delhi"

2. 🌾 SELLER DISCOVERY (find_nearby_sellers):
   - Find verified sellers and farms near user location
   - Filter by farming methods (organic, natural, conventional)
   - Get seller profiles, trust scores, and farm details
   - Example: "Find organic farmers near me" or "Show sellers within 5km"

3. 📅 SEASONAL GUIDANCE (seasonal_recommendations):
   - Get seasonal vegetable recommendations
   - Planting calendar for Indian agriculture
   - Regional farming advice and tips
   - Example: "What vegetables are in season now?" or "What should I plant this month?"

4. 🎯 WISHLIST MANAGEMENT (manage_wishlist):
   - Add items to wishlist with price alerts
   - Remove items or view saved items
   - Set availability notifications
   - Example: "Add organic tomatoes to my wishlist" or "Show my wishlist"

5. 📦 ORDER TRACKING (track_order):
   - Track order status by Order ID or phone number
   - Get delivery updates and seller contact
   - Check order history
   - Example: "Track my order #abc123" or "Check orders for phone 9876543210"

6. 🛒 INSTANT ORDER (instant_order):
   - Place immediate orders with "pay later" option
   - Works with "buy [item]" commands  
   - IMPORTANT: Extract quantity from user message (e.g., "buy 2kg tomatoes" = quantity: 2)
   - Parse patterns like "2kg", "3 kg", "buy 5kg", "order 1.5kg"
   - Creates order instantly with tracking URL
   - Example: "buy 2kg tomatoes" → displays complete order confirmation with 2kg quantity

7. 💰 PAYMENT GUIDANCE (get_payment_info):
   - Explain UPI payment process
   - Help with QR code scanning and troubleshooting
   - Support all UPI apps (GPay, PhonePe, Paytm, BHIM)

PERSONALITY & APPROACH:
- Always be helpful, friendly, and knowledgeable about Indian agriculture
- Use emojis appropriately to make conversations engaging
- Provide actionable advice and specific recommendations
- When customers ask about products, ALWAYS use search_products tool first
- When customers want to find sellers or farms, use find_nearby_sellers tool
- For seasonal questions, use seasonal_recommendations tool
- When customers say "buy [item]" or want to purchase, use instant_order tool
- For wishlist requests, use manage_wishlist tool
- When customers mention order IDs or tracking, use track_order tool
- For payment questions, use get_payment_info tool
- Keep responses concise but informative (under 400 words)
- Focus on vegetables, farming, payments (UPI), and orders

INDIAN CONTEXT:
- Understand Indian vegetables, seasons, and farming practices
- Support UPI payment methods popular in India
- Consider local/regional preferences and climate
- Use Indian currency (₹) and measurements
- Provide region-specific advice when possible

SMART COMMAND RECOGNITION:
- "find sellers" / "who sells" → use find_nearby_sellers
- "what's in season" / "seasonal vegetables" → use seasonal_recommendations  
- "add to wishlist" / "save for later" → use manage_wishlist
- "buy [item]" / "order [item]" → use instant_order
  * CRITICAL: Parse quantity from user message accurately
  * "buy 2kg tomatoes" → itemName: "tomatoes", quantity: 2
  * "order 3 kg onions" → itemName: "onions", quantity: 3
  * "buy 1.5kg potatoes" → itemName: "potatoes", quantity: 1.5
  * "buy tomatoes" → itemName: "tomatoes", quantity: 1 (default)
- "track order" / "order status" → use track_order
- "payment help" / "UPI issue" → use get_payment_info
- "search [product]" / "find [product]" → use search_products

Always use your tools when customers ask questions - don't guess or provide generic answers when you can get real, specific data!`;

    const result = await streamText({
      model: google("gemini-1.5-flash", {
        apiKey: apiKey,
      }),
      system: systemPrompt,
      messages: validMessages,
      tools: {
        search_products: tool({
          description:
            "Search for vegetables/products in the marketplace. Use this when customers ask about products, prices, availability, or want to find specific items.",
          parameters: z.object({
            query: z
              .string()
              .describe(
                "Search term for product name (e.g., beans, tomato, onion)"
              ),
            category: z.string().optional().describe("Product category filter"),
            location: z.string().optional().describe("Location filter"),
            maxPrice: z.number().optional().describe("Maximum price filter"),
          }),
          execute: async ({ query, category, location, maxPrice }) => {
            try {
              const searchParams = new URLSearchParams();
              if (query) searchParams.append("q", query);
              if (category) searchParams.append("category", category);
              if (location) searchParams.append("location", location);
              if (maxPrice)
                searchParams.append("maxPrice", maxPrice.toString());
              searchParams.append("limit", "10");

              const apiUrl = `${getApiUrl(
                "/api/ai/products",
                req
              )}?${searchParams}`;
              const response = await fetch(apiUrl, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
              });

              if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
              }

              const data = await response.json();
              return {
                success: data.success,
                products: data.products || [],
                count: data.count || 0,
                query_info: data.query_info || {},
              };
            } catch (error) {
              return {
                success: false,
                error:
                  "Could not search products at the moment. Please try again.",
                products: [],
              };
            }
          },
        }),

        find_nearby_sellers: tool({
          description:
            "Find verified sellers and farms near user location with distance filtering. Use when customers want to find sellers, farms, or ask about who sells specific items nearby.",
          parameters: z.object({
            location: z
              .string()
              .optional()
              .describe("User location or area to search"),
            radius: z
              .number()
              .default(10)
              .describe("Search radius in kilometers"),
            farmingMethod: z
              .string()
              .optional()
              .describe(
                "Farming method filter: organic, natural, conventional, or all"
              ),
          }),
          execute: async ({ location, radius, farmingMethod }) => {
            try {
              const searchParams = new URLSearchParams();
              if (location) searchParams.append("location", location);
              searchParams.append("radius", radius.toString());
              if (farmingMethod)
                searchParams.append("farmingMethod", farmingMethod);
              searchParams.append("limit", "10");

              const apiUrl = `${getApiUrl(
                "/api/ai/sellers",
                req
              )}?${searchParams}`;
              const response = await fetch(apiUrl, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
              });

              if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
              }

              const data = await response.json();
              return {
                success: data.success,
                sellers: data.sellers || [],
                count: data.count || 0,
                query_info: data.query_info || {},
              };
            } catch (error) {
              return {
                success: false,
                error:
                  "Could not find sellers at the moment. Please try again.",
                sellers: [],
              };
            }
          },
        }),

        seasonal_recommendations: tool({
          description:
            "Get seasonal vegetable recommendations and planting calendar for Indian agriculture. Use when customers ask about what's in season, what to plant, or seasonal farming advice.",
          parameters: z.object({
            month: z
              .string()
              .optional()
              .describe(
                "Month number (1-12) or current month if not specified"
              ),
            location: z
              .string()
              .default("India")
              .describe("Location for regional recommendations"),
            type: z
              .string()
              .default("both")
              .describe("Type of info: vegetables, planting, or both"),
          }),
          execute: async ({ month, location, type }) => {
            try {
              const searchParams = new URLSearchParams();
              if (month) searchParams.append("month", month);
              searchParams.append("location", location);
              searchParams.append("type", type);

              const apiUrl = `${getApiUrl(
                "/api/ai/seasonal",
                req
              )}?${searchParams}`;
              const response = await fetch(apiUrl, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
              });

              if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
              }

              const data = await response.json();
              return data;
            } catch (error) {
              return {
                success: false,
                error: "Could not get seasonal information. Please try again.",
              };
            }
          },
        }),

        manage_wishlist: tool({
          description:
            "Add items to wishlist, remove items, or view user's wishlist. Use when customers want to save items for later or set availability alerts.",
          parameters: z.object({
            action: z
              .enum(["add", "remove", "view"])
              .describe("Action to perform on wishlist"),
            itemName: z
              .string()
              .optional()
              .describe("Name of the item to add/remove"),
            maxPrice: z
              .number()
              .optional()
              .describe("Maximum price alert for the item"),
            preferredLocation: z
              .string()
              .optional()
              .describe("Preferred location for the item"),
          }),
          execute: async ({
            action,
            itemName,
            maxPrice,
            preferredLocation,
          }) => {
            try {
              if (!user?.id) {
                return {
                  success: false,
                  error: "Please sign in to use wishlist features.",
                };
              }

              if (action === "view") {
                const searchParams = new URLSearchParams();
                searchParams.append("userId", user.id);

                const apiUrl = `${getApiUrl(
                  "/api/ai/wishlist",
                  req
                )}?${searchParams}`;
                const response = await fetch(apiUrl, {
                  method: "GET",
                  headers: { "Content-Type": "application/json" },
                });

                if (!response.ok) {
                  throw new Error(`API Error: ${response.status}`);
                }

                const data = await response.json();
                return data;
              } else {
                const apiUrl = getApiUrl("/api/ai/wishlist", req);
                const response = await fetch(apiUrl, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    userId: user.id,
                    action,
                    itemName,
                    maxPrice,
                    preferredLocation,
                  }),
                });

                if (!response.ok) {
                  throw new Error(`API Error: ${response.status}`);
                }

                const data = await response.json();
                return data;
              }
            } catch (error) {
              return {
                success: false,
                error: "Could not update wishlist. Please try again.",
              };
            }
          },
        }),

        track_order: tool({
          description:
            "Track order status and get order information. Use this when customers provide order IDs or want to check their order status.",
          parameters: z.object({
            searchTerm: z
              .string()
              .describe("Order ID or phone number to search for"),
          }),
          execute: async ({ searchTerm }) => {
            try {
              let url = getApiUrl("/api/ai/orders", req);
              const searchParams = new URLSearchParams();

              if (
                searchTerm.match(
                  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
                ) ||
                searchTerm.match(/^[a-zA-Z0-9]+$/)
              ) {
                searchParams.append("orderId", searchTerm);
              } else if (searchTerm.match(/^\d{10}$/)) {
                searchParams.append("phone", searchTerm);
              } else {
                searchParams.append("orderId", searchTerm);
              }
              if (user?.id) searchParams.append("userId", user.id);

              url += `?${searchParams}`;
              const response = await fetch(url, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
              });

              if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
              }

              const data = await response.json();
              return data;
            } catch (error) {
              return {
                success: false,
                error: "Could not track order at the moment. Please try again.",
                orders: [],
              };
            }
          },
        }),

        instant_order: tool({
          description:
            "Create an instant order for customers who want to buy products immediately. Use this when customers say 'buy [item]' or similar purchase commands. IMPORTANT: Always extract the quantity from the user's message - if they say 'buy 2kg tomatoes', set quantity to 2, not 1.",
          parameters: z.object({
            itemName: z
              .string()
              .describe(
                "Name of the product/vegetable to order (extract from user message, e.g., 'tomatoes' from 'buy 2kg tomatoes')"
              ),
            quantity: z
              .number()
              .default(1)
              .describe(
                "Quantity to order in kg (extract from user message: '2kg' = 2, '3 kg' = 3, '1.5kg' = 1.5, default = 1)"
              ),
            maxPrice: z.number().optional().describe("Maximum price per kg"),
          }),
          execute: async ({ itemName, quantity, maxPrice }) => {
            try {
              const apiUrl = getApiUrl("/api/ai/instant-order", req);
              const response = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: user?.id,
                  itemName,
                  quantity,
                  maxPrice,
                  userPhone: user?.whatsapp_number || user?.phone,
                  userLocation: user?.location,
                }),
              });

              if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
              }

              const data = await response.json();
              return data;
            } catch (error) {
              return {
                success: false,
                error:
                  "Could not create order at the moment. Please try again.",
              };
            }
          },
        }),

        get_payment_info: tool({
          description:
            "Get payment guidance and UPI information. Use this when customers ask about payments, UPI, or have payment-related questions.",
          parameters: z.object({
            question: z.string().describe("Payment related question or topic"),
          }),
          execute: async ({ question }) => {
            return {
              success: true,
              paymentInfo: {
                supportedMethods: [
                  "UPI",
                  "Google Pay",
                  "PhonePe",
                  "Paytm",
                  "BHIM",
                ],
                process: [
                  "1. Complete your order in the chat",
                  "2. Scan the UPI QR code with any UPI app",
                  "3. Enter the exact amount shown",
                  "4. Complete payment and take screenshot",
                  "5. Share screenshot with seller for verification",
                ],
                tips: [
                  "All major UPI apps work with our QR codes",
                  "No extra charges for UPI payments",
                  "Payment verification is manual by sellers",
                  "Keep payment screenshot for your records",
                ],
                troubleshooting: {
                  "QR not scanning":
                    "Try different UPI app or check camera permissions",
                  "Payment failed":
                    "Check bank balance and internet connection",
                  "Amount mismatch":
                    "Enter exact amount shown in order details",
                },
              },
            };
          },
        }),
      },
      maxTokens: 1000,
      temperature: 0.7,
    });

    console.log("✅ Enhanced AI Response received");
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("❌ Enhanced Smart AI Chat error:", error);
    return new Response(
      JSON.stringify({
        error: "AI service temporarily unavailable. Please try again.",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
