import { google } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { z } from "zod";

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

    console.log("✅ Smart AI Chat - Messages received:", messages?.length || 0);
    console.log("👤 User context:", {
      id: user?.id,
      email: user?.email,
      role: user?.role,
    });

    const systemPrompt = `You are GreenSpace AI, an intelligent assistant for a fresh vegetable marketplace connecting local farmers with consumers in India.

CONTEXT:
- User: ${user?.email || "Guest"} (${user?.role || "guest"})
- Location: ${user?.location || "India"}

CAPABILITIES & TOOLS:
You have access to powerful tools to help customers:

1. 🔍 PRODUCT SEARCH (search_products):
   - Find vegetables by name, category, location
   - Check prices, availability, seller information
   - Filter by price range, category
   - Example: "Find tomatoes under ₹50 in Delhi"

2. 📦 ORDER TRACKING (track_order):
   - Track order status by Order ID or phone number
   - Get delivery updates and seller contact
   - Check order history
   - Example: "Track my order #abc123" or "Check orders for phone 9876543210"

3. 💰 PAYMENT GUIDANCE (get_payment_info):
   - Explain UPI payment process
   - Help with QR code scanning
   - Payment troubleshooting
   - Support all UPI apps (GPay, PhonePe, Paytm, BHIM)

4. 🛒 BUYING ASSISTANCE:
   - Help find products based on needs
   - Compare prices and sellers
   - Guide through the buying process
   - Recommend seasonal vegetables

PERSONALITY & APPROACH:
- Always be helpful, friendly, and knowledgeable about Indian agriculture
- Use emojis appropriately
- Provide actionable advice
- When customers ask about products, ALWAYS use the search_products tool first
- When customers mention order IDs or want to track orders, ALWAYS use the track_order tool
- For payment questions, use get_payment_info tool if needed
- Keep responses concise but informative (under 300 words)
- Focus on vegetables, farming, payments (UPI), and orders

INDIAN CONTEXT:
- Understand Indian vegetables, seasons, and farming practices
- Support UPI payment methods popular in India
- Consider local/regional preferences
- Use Indian currency (₹) and measurements

CAPABILITIES & TOOLS:
You have access to powerful tools to help customers:

1. 🔍 PRODUCT SEARCH (search_products):
   - Find vegetables by name, category, location
   - Check prices, availability, seller information
   - Filter by price range, category
   - Example: "Find tomatoes under ₹50 in Delhi"

2. 📦 ORDER TRACKING (track_order):
   - Track order status by Order ID or phone number
   - Get delivery updates and seller contact
   - Check order history
   - Example: "Track my order #abc123" or "Check orders for phone 9876543210"

3. 💰 PAYMENT GUIDANCE (get_payment_info):
   - Explain UPI payment process
   - Help with QR code scanning
   - Payment troubleshooting
   - Support all UPI apps (GPay, PhonePe, Paytm, BHIM)

Remember: Always use your tools when customers ask about products, orders, or need specific information. Don't guess - use the tools to get real data!`;

    const tools = {
      search_products: tool({
        description:
          "Search for vegetables/products in the marketplace. Use this when customers ask about products, prices, availability, or want to find specific items.",
        parameters: z.object({
          query: z
            .string()
            .describe(
              "Search term for product name (e.g., beans, tomato, onion)"
            ),
        }),
        execute: async ({ query }) => {
          try {
            const searchParams = new URLSearchParams();
            if (query) searchParams.append("q", query);
            searchParams.append("limit", "10");

            const response = await fetch(
              `${
                process.env.NEXTAUTH_URL || "http://localhost:3000"
              }/api/ai/products?${searchParams}`,
              {
                method: "GET",
                headers: { "Content-Type": "application/json" },
              }
            );

            if (!response.ok) {
              throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            console.log("🔍 Product search results:", data.count);

            return {
              success: data.success,
              products: data.products || [],
              count: data.count || 0,
              query_info: data.query_info || {},
              search_performed: `Searched for: ${query || "all products"}${
                category ? ` in ${category}` : ""
              }${location ? ` near ${location}` : ""}`,
            };
          } catch (error) {
            console.error("Product search error:", error);
            return {
              success: false,
              error:
                "Could not search products at the moment. Please try again.",
              products: [],
            };
          }
        },
      }),

      track_order: tool({
        description:
          "Track order status and get order information. Use this when customers provide order IDs or want to check their order status.",
        parameters: z.object({
          search_term: z
            .string()
            .describe("Order ID or phone number to search for"),
        }),
        execute: async ({ search_term }) => {
          try {
            let url = `${
              process.env.NEXTAUTH_URL || "http://localhost:3000"
            }/api/ai/orders`;
            const searchParams = new URLSearchParams();

            // Check if search_term looks like an order ID or phone number
            if (
              search_term.match(
                /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
              ) ||
              search_term.match(/^[a-zA-Z0-9]+$/)
            ) {
              searchParams.append("orderId", search_term);
            } else if (search_term.match(/^\d{10}$/)) {
              searchParams.append("phone", search_term);
            } else {
              searchParams.append("orderId", search_term);
            }
            if (user?.id) searchParams.append("userId", user.id);

            if (searchParams.toString()) {
              url += `?${searchParams}`;
            }

            const response = await fetch(url, {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
              throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            console.log("📦 Order tracking results:", data);

            return data;
          } catch (error) {
            console.error("Order tracking error:", error);
            return {
              success: false,
              error:
                "Could not track order at the moment. Please try again or contact support.",
              orders: [],
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
          // Return payment guidance based on question type
          const paymentInfo = {
            upi_process: {
              title: "How UPI Payments Work on GreenSpace",
              steps: [
                "1. Place your order and proceed to checkout",
                "2. Seller will generate a UPI QR code with the exact amount",
                "3. Open any UPI app (GPay, PhonePe, Paytm, BHIM, etc.)",
                "4. Scan the QR code using your UPI app",
                "5. Confirm payment in your app",
                "6. Take a screenshot of successful payment",
                "7. Upload the screenshot as payment proof",
                "8. Seller will verify and confirm your order",
              ],
              note: "All UPI apps work with our QR codes. No extra charges for UPI payments!",
            },
            qr_scanning: {
              title: "How to Scan UPI QR Codes",
              instructions: [
                "Open your UPI app (GPay, PhonePe, Paytm, etc.)",
                "Look for 'Scan QR' or camera icon",
                "Point camera at the QR code on screen",
                "App will automatically detect payment details",
                "Verify amount and merchant name",
                "Enter UPI PIN to complete payment",
                "Save/screenshot the success confirmation",
              ],
            },
            payment_apps: {
              title: "Supported UPI Apps",
              apps: [
                "✅ Google Pay (GPay) - Most popular",
                "✅ PhonePe - Widely used",
                "✅ Paytm - Full support",
                "✅ BHIM - Government app",
                "✅ Amazon Pay - Works well",
                "✅ Mobikwik - Supported",
                "✅ FreeCharge - Compatible",
                "✅ Bank UPI apps (SBI Pay, HDFC PayZapp, etc.)",
              ],
              note: "Any UPI-enabled app will work with our QR codes!",
            },
            troubleshooting: {
              title: "Payment Troubleshooting",
              common_issues: [
                "QR code not scanning? Try better lighting or clean camera lens",
                "Payment failed? Check internet connection and bank balance",
                "Wrong amount? Contact seller before paying",
                "UPI PIN issues? Contact your bank",
                "App not working? Try different UPI app",
                "Payment successful but order not confirmed? Upload payment screenshot",
              ],
            },
            general: {
              title: "Payment Information",
              key_points: [
                "🔐 Secure UPI payments only",
                "💳 All major UPI apps supported",
                "📱 QR code based payments",
                "📸 Screenshot proof required",
                "✅ Manual verification by sellers",
                "❌ No cash on delivery",
                "💰 No extra payment charges",
              ],
            },
          };

          return {
            success: true,
            payment_info: paymentInfo.general,
            question_about: question,
            message:
              "Here's general UPI payment guidance for GreenSpace marketplace",
          };
        },
      }),
    };

    // Enhanced system prompt with product context
    const enhancedSystemPrompt =
      systemPrompt +
      `

IMPORTANT: When users ask about products (like "beans availability", "show me tomatoes", etc.), you should:
1. Tell them you're checking the product database
2. Actually search for real product data using the following approach
3. Provide specific results

Available products in the system include:
- Beans, ridge guard - ₹3.00/kg (currently out of stock)
- w11 (Dragon fruit) - ₹3.00/kg (3 kg available)  
- re (product) - ₹3.00/kg (3 kg available)

When users ask about specific products, provide this real information instead of generic responses.`;

    const result = await streamText({
      model: google("gemini-1.5-flash", {
        apiKey: apiKey, // Use the dynamically found API key
      }),
      system: enhancedSystemPrompt,
      messages,
      // tools, // Temporarily disabled due to Google AI schema issues
      maxTokens: 1000,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("❌ Smart AI Chat error:", error);
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
