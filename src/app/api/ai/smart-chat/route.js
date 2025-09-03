import { google } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { z } from "zod";
import { getBaseUrl, getApiUrl } from "@/utils/urlUtils";

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
      phone: user?.whatsapp_number || user?.phone,
      location: user?.location,
    });
    console.log("🔧 First few messages:", messages?.slice(0, 3));

    // Check for empty messages that could cause API errors
    const validMessages =
      messages?.filter((m) => m?.content && m?.content.trim()) || [];
    console.log("🔍 Valid messages after filtering:", validMessages.length);

    if (validMessages.length === 0) {
      console.error("❌ No valid messages found");
      return new Response("No valid messages provided", { status: 400 });
    }

    const systemPrompt = `You are Arya Natural Farms AI, an intelligent assistant for a fresh vegetable marketplace connecting local farmers with consumers in India.

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
- When customers say "buy [item]" or want to purchase something, ALWAYS use the instant_order tool
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

3. 🛒 INSTANT ORDER (instant_order):
   - Place immediate orders for customers
   - Works with "buy [item]" commands  
   - Creates order instantly with "pay later" option
   - Returns formatted order details with tracking URL
   - Example: "buy tomatoes" → displays complete order confirmation with URL
   - ALWAYS show the full order details returned by the tool

4. 💰 PAYMENT GUIDANCE (get_payment_info):
   - Explain UPI payment process
   - Help with QR code scanning
   - Payment troubleshooting
   - Support all UPI apps (GPay, PhonePe, Paytm, BHIM)

SMART ORDER WORKFLOW:
When customers say "buy [item]" or similar:
1. Show order summary with product details
2. Check user profile for existing phone (${
      user?.whatsapp_number || user?.phone || "not available"
    }) and location (${user?.location || "not available"})
3. If user has complete profile info: Create order immediately
4. If missing info: Ask only for what's needed in simple format
5. Use format: "Mobile: 7799111008" or "Address: BHEL Hyderabad 502032"
6. Don't ask for product/quantity/price again - you already know this
7. Show order confirmation with tracking URL

IMPORTANT RULES:
- NEVER mention email confirmations or checking email
- ALWAYS show order details directly in the chat
- ALWAYS provide order tracking URL placeholder
- Respond immediately to buy requests - don't wait

Remember: Always use your tools when customers ask about products, orders, or need specific information. Don't guess - use the tools to get real data!`;

    // OLD TOOLS OBJECT - NOW USING SIMPLIFIED INLINE TOOLS
    const _oldTools = {
      search_products: tool({
        description:
          "Search for vegetables/products in the marketplace. Use this when customers ask about products, prices, availability, or want to find specific items.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description:
                "Search term for product name (e.g., beans, tomato, onion)",
            },
          },
          required: ["query"],
        },
        execute: async ({ query }) => {
          try {
            const searchParams = new URLSearchParams();
            if (query) searchParams.append("q", query);
            searchParams.append("limit", "10");

            const apiUrl = `${getApiUrl(
              "/api/ai/products",
              req
            )}?${searchParams}`;
            console.log("🔗 AI Chat calling products API:", apiUrl);

            const response = await fetch(apiUrl, {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            });

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
        parameters: {
          type: "object",
          properties: {
            search_term: {
              type: "string",
              description: "Order ID or phone number to search for",
            },
          },
          required: ["search_term"],
        },
        execute: async ({ search_term }) => {
          try {
            let url = getApiUrl("/api/ai/orders", req);
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

      instant_order: tool({
        description:
          "Create an instant order for customers who want to buy products immediately. Use this when customers say 'buy [item]' or similar purchase commands. Returns formatted order details that should be displayed directly to the customer.",
        parameters: {
          type: "object",
          properties: {
            item_name: {
              type: "string",
              description:
                "Name of the product/vegetable to order (e.g., tomatoes, onions)",
            },
            quantity: {
              type: "number",
              description: "Quantity in kg (defaults to 1 if not specified)",
              optional: true,
            },
          },
          required: ["item_name"],
        },
        execute: async ({ item_name, quantity = 1 }) => {
          try {
            // First, search for the product to get its details
            const searchParams = new URLSearchParams();
            searchParams.append("q", item_name);
            searchParams.append("limit", "1");

            const searchResponse = await fetch(
              `${getApiUrl("/api/ai/products", req)}?${searchParams}`,
              {
                method: "GET",
                headers: { "Content-Type": "application/json" },
              }
            );

            if (!searchResponse.ok) {
              throw new Error(
                `Product search failed: ${searchResponse.status}`
              );
            }

            const searchData = await searchResponse.json();

            if (
              !searchData.success ||
              !searchData.products ||
              searchData.products.length === 0
            ) {
              return {
                success: false,
                error: `Sorry, I couldn't find "${item_name}" in our inventory. Please try a different product name.`,
              };
            }

            const product = searchData.products[0];

            // Check if product is in stock
            const availableQuantity =
              product.quantity || product.availableQuantity || 0;

            if (availableQuantity <= 0) {
              return {
                success: false,
                error: `❌ Sorry, ${product.name} is currently out of stock! (0 kg available)`,
              };
            }

            if (availableQuantity < quantity) {
              return {
                success: false,
                error: `⚠️ Limited stock for ${product.name}! Only ${availableQuantity} kg available, but you requested ${quantity} kg.`,
              };
            }

            // Calculate total amount
            const totalAmount = (parseFloat(product.price) * quantity).toFixed(
              2
            );

            // Create order via NEW AI orders API (database-persistent)
            const orderResponse = await fetch(
              getApiUrl("/api/ai/orders/create", req),
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  // Forward any cookies from the original request to preserve session
                  Cookie: req.headers.get("cookie") || "",
                },
                body: JSON.stringify({
                  vegetable_id: product.id,
                  seller_id:
                    product.seller_id || "0e13a58b-a5e2-4ed3-9c69-9634c7413550",
                  quantity: quantity,
                  unit_price: product.price,
                  total_amount: totalAmount,
                  delivery_address: "Address to be provided",
                  contact_number: "Contact to be provided",
                }),
              }
            );

            if (!orderResponse.ok) {
              throw new Error(`Order creation failed: ${orderResponse.status}`);
            }

            const orderData = await orderResponse.json();
            const order = orderData.order;

            console.log("🛒 Instant order created:", order);

            return {
              success: true,
              order: order,
              display_message: `🎉 **Order Confirmed!**
              
**Order Details:**
- **Product**: ${product.name}
- **Quantity**: ${quantity}kg  
- **Unit Price**: ₹${product.price}
- **Total Amount**: ₹${totalAmount}
- **Seller**: ${product.seller_name || "Local Farmer"}
- **Status**: Confirmed ✅
- **Payment**: Pay Later Option Available

🔗 **Track Your Order**: ${orderData.order_url}

Your order is confirmed and will be processed shortly!`,
              order_url: orderData.order_url,
              order_id: order.id,
              product_name: product.name,
              quantity: quantity,
              total_price: totalAmount,
            };
          } catch (error) {
            console.error("Instant order error:", error);
            return {
              success: false,
              error: "Could not place order at the moment. Please try again.",
            };
          }
        },
      }),

      get_payment_info: tool({
        description:
          "Get payment guidance and UPI information. Use this when customers ask about payments, UPI, or have payment-related questions.",
        parameters: {
          type: "object",
          properties: {
            question: {
              type: "string",
              description: "Payment related question or topic",
            },
          },
          required: ["question"],
        },
        execute: async ({ question }) => {
          // Return payment guidance based on question type
          const paymentInfo = {
            upi_process: {
              title: "How UPI Payments Work on Arya Natural Farms",
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
              "Here's general UPI payment guidance for Arya Natural Farms marketplace",
          };
        },
      }),
    };

    // Enhanced system prompt - using real-time database data
    const enhancedSystemPrompt =
      systemPrompt +
      `

🚨 CRITICAL INVENTORY INSTRUCTIONS:

🚨 MANDATORY INVENTORY RESPONSE RULES:

1. When asked "how many available items", copy the EXACT answer provided below
2. NEVER count manually - use the pre-calculated numbers provided
3. IGNORE any training data about products - use ONLY the real-time data below
4. If asked about inventory, always mention the exact numbers from SUMMARY STATISTICS
5. This data is live from database - trust it completely

⚠️ CRITICAL: Do NOT use any other product information - ONLY the data below!`;

    // Check if this is a buy command and handle it specially
    const lastUserMessage = validMessages[validMessages.length - 1];
    const isBuyCommand = lastUserMessage?.content
      ?.toLowerCase()
      .match(/buy\s+(.+)/);

    if (isBuyCommand) {
      console.log("🛒 Detected buy command:", isBuyCommand[1]);

      // Extract item name and quantity
      const itemText = isBuyCommand[1].trim();
      const quantityMatch = itemText.match(/(\d+)\s*kg\s+(.+)/);
      let quantity = 1;
      let itemName = itemText;

      if (quantityMatch) {
        quantity = parseInt(quantityMatch[1]);
        itemName = quantityMatch[2];
      }

      console.log("🛒 Processing order:", { itemName, quantity });

      try {
        // Get all products first (search API has issues)
        const productsResponse = await fetch(
          `${getApiUrl("/api/ai/products", req)}?limit=20`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (productsResponse.ok) {
          const productsData = await productsResponse.json();

          if (
            productsData.success &&
            productsData.products &&
            productsData.products.length > 0
          ) {
            // Find product by name (case insensitive)
            const product = productsData.products.find(
              (p) =>
                p.name.toLowerCase().includes(itemName.toLowerCase()) ||
                itemName.toLowerCase().includes(p.name.toLowerCase())
            );

            if (product) {
              // Check if product is in stock
              const availableQuantity =
                product.quantity || product.availableQuantity || 0;

              if (availableQuantity <= 0) {
                return new Response(
                  `❌ **Sorry, ${product.name} is currently out of stock!**\n\n🔍 **Available quantity**: 0 kg\n📦 **Your request**: ${quantity} kg\n\n💡 **Suggestion**: Try checking our other fresh vegetables or come back later when we restock!`,
                  {
                    headers: { "Content-Type": "text/plain" },
                  }
                );
              }

              if (availableQuantity < quantity) {
                return new Response(
                  `⚠️ **Limited stock available for ${product.name}!**\n\n📦 **Available quantity**: ${availableQuantity} kg\n📦 **Your request**: ${quantity} kg\n\n💡 **Options**:\n- Order ${availableQuantity} kg instead\n- Try a different product\n- Come back when we restock!`,
                  {
                    headers: { "Content-Type": "text/plain" },
                  }
                );
              }

              const totalAmount = (
                parseFloat(product.price.replace("₹", "")) * quantity
              ).toFixed(2);

              // Smart order request - use existing user data when available
              const hasPhone =
                (user?.whatsapp_number || user?.phone) &&
                (user?.whatsapp_number || user?.phone).trim();
              const hasLocation = user?.location && user.location.trim();

              let orderRequest = `🛒 **Ready to place your order!**

**Order Summary:**
- **Product**: ${product.name}
- **Quantity**: ${quantity}kg
- **Unit Price**: ₹${product.price.replace("₹", "")}
- **Total**: ₹${totalAmount}
- **Seller**: ${product.seller?.name || "Local Farmer"}`;

              // Check what info we need to ask for
              const needsPhone = !hasPhone;
              const needsAddress = !hasLocation;

              if (needsPhone || needsAddress) {
                orderRequest += `\n\n**To complete your order with "Pay Later" option, please provide:**\n`;

                if (needsPhone) {
                  orderRequest += `\n📱 **Mobile Number**: Your 10-digit mobile number`;
                }
                if (needsAddress) {
                  orderRequest += `\n📍 **Delivery Address**: Complete address for delivery`;
                }

                // Simplified format request
                const missingFields = [];
                if (needsPhone) missingFields.push("Mobile: [your number]");
                if (needsAddress) missingFields.push("Address: [your address]");

                orderRequest += `\n\n**Reply with:**\nProduct: ${
                  product.name
                }\nQuantity: ${quantity}\nPrice: ${product.price.replace(
                  "₹",
                  ""
                )}\n${missingFields.join("\n")}`;

                orderRequest += `\n\n**Example:**\nProduct: ${
                  product.name
                }\nQuantity: ${quantity}\nPrice: ${product.price.replace(
                  "₹",
                  ""
                )}`;
                if (needsPhone) orderRequest += `\nMobile: 7799111008`;
                if (needsAddress)
                  orderRequest += `\nAddress: BHEL Hyderabad 502032`;
              } else {
                // We have all info, create order immediately
                console.log(
                  "🚀 All user info available, creating order immediately..."
                );

                try {
                  const orderResponse = await fetch(
                    getApiUrl("/api/ai/orders/create", req),
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Cookie: req.headers.get("cookie") || "",
                      },
                      body: JSON.stringify({
                        vegetable_id: product.id,
                        seller_id:
                          product.seller?.id ||
                          "0e13a58b-a5e2-4ed3-9c69-9634c7413550",
                        quantity: quantity,
                        unit_price: product.price.replace("₹", ""),
                        total_amount: totalAmount,
                        delivery_address: user.location,
                        contact_number: user.whatsapp_number || user.phone,
                        product_name: product.name,
                      }),
                    }
                  );

                  if (orderResponse.ok) {
                    const orderData = await orderResponse.json();
                    return new Response(
                      `🎉 **Order Placed Successfully!**

**Order Details:**
- **Order ID**: ${orderData.order_id}
- **Product**: ${product.name}
- **Quantity**: ${quantity}kg
- **Unit Price**: ₹${product.price.replace("₹", "")}
- **Total Amount**: ₹${totalAmount}
- **Status**: Confirmed ✅
- **Payment**: Pay Later Option
- **Mobile**: ${user.whatsapp_number || user.phone}
- **Address**: ${user.location}

🔗 **[Track Your Order](${orderData.order_url})**

✅ Seller will be notified via WhatsApp
✅ You'll get order updates on ${user.whatsapp_number || user.phone}

Thank you for shopping with Arya Natural Farms! 🌱`,
                      {
                        headers: { "Content-Type": "text/plain" },
                      }
                    );
                  } else {
                    throw new Error("Order creation failed");
                  }
                } catch (immediateOrderError) {
                  console.error(
                    "❌ Immediate order creation error:",
                    immediateOrderError
                  );
                  orderRequest += `\n\n⚠️ There was an issue creating your order automatically. Please provide the missing details above to complete your order.`;
                }
              }

              // Store product info for this session (we'll extract it later)
              global.pendingOrder = {
                product: product,
                quantity: quantity,
                totalAmount: totalAmount,
                timestamp: Date.now(),
              };

              return new Response(orderRequest, {
                headers: { "Content-Type": "text/plain" },
              });
            }
          }
        }

        // Fallback if product not found or order creation failed
        return new Response(
          `Sorry, I couldn't find "${itemName}" in our inventory or process your order. Please try a different product name.`,
          {
            headers: { "Content-Type": "text/plain" },
          }
        );
      } catch (orderError) {
        console.error("❌ Order creation error:", orderError);
        return new Response(
          "Sorry, I couldn't process your order right now. Please try again.",
          {
            headers: { "Content-Type": "text/plain" },
          }
        );
      }
    }

    // Check for order completion with contact details (more flexible)
    const isOrderCompletion =
      lastUserMessage?.content?.toLowerCase().includes("product:") &&
      (lastUserMessage?.content?.toLowerCase().includes("mobile:") ||
        lastUserMessage?.content?.toLowerCase().includes("address:"));

    if (isOrderCompletion) {
      console.log("📱 Contact details provided, creating order...");

      try {
        const userContent = lastUserMessage.content;

        // Extract product details if provided in new format
        const productMatch = userContent.match(/product:\s*(.+?)(?:\n|$)/i);
        const quantityMatch = userContent.match(/quantity:\s*(\d+)/i);
        const priceMatch = userContent.match(/price:\s*([0-9.]+)/i);

        // Extract mobile and address (flexible - use user profile if not provided)
        const mobileMatch = userContent.match(/mobile:\s*([0-9\s+-]+)/i);
        const addressMatch = userContent.match(/address:\s*(.+?)(?:$|\n)/i);

        // Use provided info or fall back to user profile
        let mobile = mobileMatch
          ? mobileMatch[1].trim().replace(/\s/g, "")
          : (user?.whatsapp_number || user?.phone)?.replace(/\s/g, "");
        let address = addressMatch ? addressMatch[1].trim() : user?.location;

        // Check if we have the minimum required info
        if (!mobile && !address) {
          return new Response(
            "Please provide your contact details:\n\nMobile: [your 10-digit number]\nAddress: [your complete address]",
            {
              headers: { "Content-Type": "text/plain" },
            }
          );
        }

        if (!mobile) {
          return new Response(
            "Please provide your mobile number:\n\nMobile: [your 10-digit number]",
            {
              headers: { "Content-Type": "text/plain" },
            }
          );
        }

        if (!address) {
          return new Response(
            "Please provide your delivery address:\n\nAddress: [your complete address]",
            {
              headers: { "Content-Type": "text/plain" },
            }
          );
        }

        // Validate mobile number (basic validation)
        if (mobile.length < 10) {
          return new Response(
            "Please provide a valid 10-digit mobile number.\n\nExample: Mobile: 9876543210",
            {
              headers: { "Content-Type": "text/plain" },
            }
          );
        }

        // Use extracted product details or fallback to pending order or default
        let productName = "Selected Product";
        let quantity = 1;
        let unitPrice = 3;
        let vegetableId = null;
        let sellerId = "0e13a58b-a5e2-4ed3-9c69-9634c7413550";

        if (productMatch && priceMatch) {
          productName = productMatch[1].trim();
          quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
          unitPrice = parseFloat(priceMatch[1]);
          console.log("📦 Using product details from message:", {
            productName,
            quantity,
            unitPrice,
          });
        } else if (
          global.pendingOrder &&
          Date.now() - global.pendingOrder.timestamp < 300000
        ) {
          // 5 minute timeout
          const pending = global.pendingOrder;
          productName = pending.product.name;
          quantity = pending.quantity;
          unitPrice = parseFloat(pending.product.price.replace("₹", ""));
          vegetableId = pending.product.id;
          sellerId = pending.product.seller?.id || sellerId;
          console.log("📦 Using pending order details:", {
            productName,
            quantity,
            unitPrice,
            vegetableId,
          });
        }

        // If we don't have vegetableId from pending order, try to find it in database
        if (!vegetableId) {
          console.log(
            "🔍 Searching for vegetable ID for product:",
            productName
          );

          const productsResponse = await fetch(
            `${getApiUrl("/api/ai/products", req)}?query=${encodeURIComponent(
              productName
            )}&limit=1`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            }
          );

          if (productsResponse.ok) {
            const productsData = await productsResponse.json();
            if (
              productsData.success &&
              productsData.products &&
              productsData.products.length > 0
            ) {
              const product = productsData.products[0];
              vegetableId = product.id;
              sellerId = product.seller?.id || sellerId;
              console.log("✅ Found vegetable in database:", {
                id: vegetableId,
                name: product.name,
              });
            }
          }

          // Final fallback - find any available product
          if (!vegetableId) {
            console.log(
              "🔄 No specific product found, using any available product..."
            );
            const fallbackResponse = await fetch(
              `${getApiUrl("/api/ai/products", req)}?limit=1`,
              {
                method: "GET",
                headers: { "Content-Type": "application/json" },
              }
            );

            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              if (
                fallbackData.success &&
                fallbackData.products &&
                fallbackData.products.length > 0
              ) {
                const fallbackProduct = fallbackData.products[0];
                vegetableId = fallbackProduct.id;
                sellerId = fallbackProduct.seller?.id || sellerId;
                productName = fallbackProduct.name; // Update to actual available product
                console.log("✅ Using fallback product:", {
                  id: vegetableId,
                  name: productName,
                });
              }
            }
          }
        }

        // Absolute fallback if everything fails
        if (!vegetableId) {
          throw new Error(
            "No valid product found in database for order creation"
          );
        }

        // Create order using the new AI orders API that properly saves to database
        const totalAmount = unitPrice * quantity;

        console.log("🛒 Creating order with details:", {
          vegetableId,
          sellerId,
          quantity,
          unitPrice,
          totalAmount,
          productName,
          mobile,
          address,
        });

        const orderResponse = await fetch(
          getApiUrl("/api/ai/orders/create", req),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // Forward any cookies from the original request to preserve session
              Cookie: req.headers.get("cookie") || "",
            },
            body: JSON.stringify({
              vegetable_id: vegetableId,
              seller_id: sellerId,
              quantity: quantity,
              unit_price: unitPrice,
              total_amount: totalAmount,
              delivery_address: address,
              contact_number: mobile,
              product_name: productName,
            }),
          }
        );

        // Clear pending order after successful creation attempt
        if (global.pendingOrder) {
          delete global.pendingOrder;
        }

        if (orderResponse.ok) {
          const orderData = await orderResponse.json();
          const orderConfirmation = `🎉 **Order Placed Successfully!**

**Order Details:**
- **Order ID**: ${orderData.order_id}
- **Product**: ${productName}
- **Quantity**: ${quantity}kg
- **Unit Price**: ₹${unitPrice}
- **Total Amount**: ₹${totalAmount.toFixed(2)}
- **Status**: Confirmed ✅
- **Payment**: Pay Later Option
- **Mobile**: ${mobile}
- **Address**: ${address}

🔗 **[Track Your Order](${orderData.order_url})**

✅ Seller will be notified via WhatsApp
✅ You'll get order updates on ${mobile}

Thank you for shopping with GreenSpace! 🌱`;

          return new Response(orderConfirmation, {
            headers: { "Content-Type": "text/plain" },
          });
        } else {
          throw new Error("Order creation failed");
        }
      } catch (error) {
        console.error("❌ Order creation error:", error);
        return new Response(
          "Sorry, I couldn't process your order right now. Please try again or contact support.",
          {
            headers: { "Content-Type": "text/plain" },
          }
        );
      }
    }

    // Normal AI response for non-buy commands
    console.log(
      "🤖 Sending to AI with",
      validMessages.length,
      "valid messages"
    );
    console.log(
      "📝 Messages being sent:",
      JSON.stringify(validMessages, null, 2)
    );
    console.log("🛠 Fetching real-time product data from database...");

    // Fetch real products before responding
    let currentProducts = [];
    try {
      const productsResponse = await fetch(
        `${getApiUrl("/api/ai/products", req)}?limit=20`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        if (productsData.success && productsData.products) {
          currentProducts = productsData.products;
          console.log(
            "✅ Fetched",
            currentProducts.length,
            "products from database"
          );
          console.log(
            "📦 Products:",
            currentProducts
              .map(
                (p) => `${p.name}: ${p.quantity || 0} kg (${p.availability})`
              )
              .join(", ")
          );
        }
      }
    } catch (error) {
      console.error("❌ Error fetching products:", error);
    }

    // Calculate exact numbers for AI
    const totalProducts = currentProducts.length;
    const availableProducts = currentProducts.filter(
      (p) => (p.quantity || 0) > 0
    ).length;
    const outOfStockProducts = currentProducts.filter(
      (p) => (p.quantity || 0) === 0
    ).length;

    // Add current products to system prompt
    const productsInfo =
      currentProducts.length > 0
        ? `

🔥 REAL-TIME INVENTORY DATA (Just fetched from database):

🚨 EXACT ANSWER FOR "how many available items" (timestamp: ${Date.now()}):
"We have ${totalProducts} products in our catalog: ${availableProducts} available, ${outOfStockProducts} out of stock."

🔥 CRITICAL: Use the numbers above (${totalProducts} total, ${availableProducts} available)

PRODUCT LIST:
${currentProducts
  .map(
    (p) =>
      `- ${p.name} - ${p.price}/kg (${p.quantity || 0} kg available) - ${
        p.availability
      }`
  )
  .join("\n")}

SUMMARY STATISTICS:
- Total products: ${totalProducts}
- Available: ${availableProducts}  
- Out of stock: ${outOfStockProducts}
- Last updated: ${new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
          })}

USE THESE EXACT NUMBERS IN YOUR RESPONSE!
`
        : "\n\nNo products currently available in inventory.";

    // Debug: Show what's being sent to AI
    const fullSystemPrompt = enhancedSystemPrompt + productsInfo;
    console.log("🧠 System prompt being sent to AI:");
    console.log("📊 Products section:", productsInfo);
    console.log("📈 Total products in prompt:", currentProducts.length);
    console.log("🔢 Calculated stats:", {
      totalProducts,
      availableProducts,
      outOfStockProducts,
    });

    const result = await streamText({
      model: google("gemini-1.5-flash", {
        apiKey: apiKey,
      }),
      system: fullSystemPrompt,
      messages: validMessages,
      // NO TOOLS - Using direct database fetch instead
      maxTokens: 1000,
      temperature: 0.7,
    });

    console.log("✅ AI Response received");
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
