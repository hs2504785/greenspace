import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export async function POST(req) {
  try {
    const { messages } = await req.json();

    // Check for API key with either expected variable name
    const apiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      console.error("❌ Google AI API key not found in environment");
      console.error(
        "❌ Checked GOOGLE_GENERATIVE_AI_API_KEY and GOOGLE_AI_API_KEY"
      );
      return new Response("AI service not configured", { status: 503 });
    }

    console.log("✅ API Key found:", apiKey.substring(0, 10) + "...");
    console.log("📨 Messages received:", messages?.length || 0);

    const systemPrompt = `You are a helpful AI assistant for Arya Natural Farms, a fresh vegetable marketplace connecting local farmers with consumers in India.

KEY INFORMATION:
- This is a FREE AI service using Google's Gemini
- Keep responses concise but helpful (under 200 words)
- Focus on vegetables, farming, payments (UPI/GPay/PhonePe), and orders
- Be friendly and use appropriate emojis
- Promote fresh, local, seasonal produce

PAYMENT HELP:
- UPI QR codes work with all apps (GPay, PhonePe, Paytm, BHIM, etc.)
- Just scan the QR code in any UPI app to pay
- Take a screenshot of successful payment for verification
- Sellers manually verify payments and approve orders
- No extra charges for UPI payments

VEGETABLES & FARMING:
- Suggest seasonal vegetables based on current month in India
- Provide basic organic farming tips
- Recommend companion planting
- Mention benefits of local, fresh produce
- Focus on Indian vegetables and farming practices

ORDER HELP:
- Orders go through: Pending → Payment → Confirmed → Processing → Delivered
- Users can track orders in their dashboard
- Guest orders are also supported
- Sellers process and update order status

FARMING ADVICE:
- Provide season-specific advice for Indian climate
- Suggest organic methods for pest control
- Recommend proper watering and soil preparation
- Mention crop rotation benefits

LIMITATIONS:
- Cannot access real-time order data
- Cannot process payments directly
- Cannot access user's personal information
- Provide general advice, not medical recommendations

Be helpful, friendly, and focus on promoting sustainable, local agriculture!`;

    const result = await streamText({
      model: google("gemini-1.5-flash", {
        apiKey: apiKey, // Use the dynamically found API key
      }),
      system: systemPrompt,
      messages,
      maxTokens: 300, // Keep within free tier limits
      temperature: 0.7,
    });

    console.log("✅ AI request successful, using toTextStreamResponse");

    // Use the correct API method available in this SDK version
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("❌ Free AI Chat Error:", error);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);

    // Handle specific error types
    if (error.message?.includes("quota")) {
      console.error("❌ Quota exceeded error");
      return new Response("Free AI quota reached. Please try again later.", {
        status: 429,
      });
    }

    if (
      error.message?.includes("API_KEY") ||
      error.message?.includes("credential")
    ) {
      console.error("❌ API key error");
      return new Response(
        "AI service configuration issue. Please check API key.",
        {
          status: 500,
        }
      );
    }

    if (error.message?.includes("model") || error.message?.includes("gemini")) {
      console.error("❌ Model error");
      return new Response("AI model error. Please try again.", {
        status: 500,
      });
    }

    console.error("❌ Generic error, returning 500");
    return new Response(`AI service error: ${error.message}`, {
      status: 500,
    });
  }
}
