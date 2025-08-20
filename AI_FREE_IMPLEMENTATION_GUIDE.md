# 🆓 FREE AI Implementation Guide for GreenSpace

## Overview

Implement powerful AI features using only FREE services - no credit card required!

## 🚀 FREE AI Stack Setup

### 1. Install Dependencies (FREE)

```bash
npm install ai @ai-sdk/google
npm install @google/generative-ai
```

### 2. Get FREE Google AI API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account (no credit card required)
3. Click "Create API Key"
4. Copy your free API key

### 3. Environment Variables

```env
# Google AI - FREE TIER (No credit card needed)
GOOGLE_AI_API_KEY=your_free_google_ai_key
NEXT_PUBLIC_AI_ENABLED=true

# Feature flags
NEXT_PUBLIC_AI_CHAT_ENABLED=true
NEXT_PUBLIC_AI_RECOMMENDATIONS_ENABLED=true
```

## 🤖 FREE AI Chat Assistant

```javascript
// src/components/ai/FreeAIChatAssistant.js
"use client";

import { useState } from "react";
import { useChat } from "ai/react";
import { Button, Card, Form, Alert } from "react-bootstrap";

export default function FreeAIChatAssistant({ user }) {
  const [isOpen, setIsOpen] = useState(false);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      api: "/api/ai/free-chat",
      initialMessages: [
        {
          id: "welcome",
          role: "assistant",
          content: `🌱 Hello! I'm your FREE GreenSpace AI assistant powered by Google AI!

I can help you with:
🥬 Finding vegetables and seasonal produce
💳 Payment guidance (UPI, GPay, PhonePe)
📦 Order information and tracking
🌱 Basic farming tips and advice
📍 Local produce availability

What would you like to know?`,
        },
      ],
    });

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        className="position-fixed"
        style={{
          bottom: "20px",
          right: "20px",
          zIndex: 1000,
          borderRadius: "50%",
          width: "60px",
          height: "60px",
          background: "linear-gradient(45deg, #4CAF50, #45a049)",
          border: "none",
          boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        🤖
      </Button>

      {/* Chat Interface */}
      {isOpen && (
        <Card
          className="position-fixed"
          style={{
            bottom: "90px",
            right: "20px",
            width: "350px",
            height: "500px",
            zIndex: 1000,
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            border: "2px solid #4CAF50",
          }}
        >
          <Card.Header className="bg-success text-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <i className="ti-comments me-2"></i>
                AI Assistant (FREE)
              </div>
              <Button
                variant="link"
                size="sm"
                className="text-white p-0"
                onClick={() => setIsOpen(false)}
              >
                ✕
              </Button>
            </div>
          </Card.Header>

          <Card.Body className="d-flex flex-column p-0">
            {/* Error Message */}
            {error && (
              <Alert variant="warning" className="m-2 mb-0">
                <small>
                  AI temporarily unavailable. Free tier limits may be reached.
                </small>
              </Alert>
            )}

            {/* Messages */}
            <div
              className="flex-grow-1 overflow-auto p-3"
              style={{ maxHeight: "350px" }}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-3 ${
                    message.role === "user" ? "text-end" : ""
                  }`}
                >
                  <div
                    className={`d-inline-block px-3 py-2 rounded-3 ${
                      message.role === "user"
                        ? "bg-primary text-white"
                        : "bg-light border"
                    }`}
                    style={{ maxWidth: "85%" }}
                  >
                    <div className="small mb-1 opacity-75">
                      {message.role === "user" ? "You" : "🤖 AI"}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap", fontSize: "14px" }}>
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="text-center py-2">
                  <div className="spinner-border spinner-border-sm text-success me-2"></div>
                  <small className="text-muted">AI is thinking...</small>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="px-3 pb-2">
              <div className="d-flex flex-wrap gap-1">
                {[
                  "💳 Payment help",
                  "🥬 Seasonal vegetables",
                  "📦 Track order",
                  "🌱 Farming tips",
                ].map((action, index) => (
                  <Button
                    key={index}
                    variant="outline-success"
                    size="sm"
                    className="rounded-pill"
                    onClick={() =>
                      handleSubmit({ preventDefault: () => {} }, action)
                    }
                    disabled={isLoading}
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <div className="border-top p-3">
              <Form onSubmit={handleSubmit}>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="text"
                    placeholder="Ask about vegetables, payments, orders..."
                    value={input}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    size="sm"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isLoading || !input.trim()}
                    style={{ minWidth: "60px" }}
                  >
                    {isLoading ? "..." : "Send"}
                  </Button>
                </div>
              </Form>
            </div>
          </Card.Body>
        </Card>
      )}
    </>
  );
}
```

## 🆓 FREE AI API Route

```javascript
// src/app/api/ai/free-chat/route.js
import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export async function POST(req) {
  try {
    const { messages } = await req.json();

    // Check if API key is available
    if (!process.env.GOOGLE_AI_API_KEY) {
      return new Response("AI service not configured", { status: 503 });
    }

    const systemPrompt = `You are a helpful AI assistant for GreenSpace, a fresh vegetable marketplace connecting local farmers with consumers.

KEY INFORMATION:
- This is a FREE AI service using Google's Gemini
- Keep responses concise but helpful (under 200 words)
- Focus on vegetables, farming, payments (UPI/GPay/PhonePe), and orders
- Be friendly and use appropriate emojis
- Promote fresh, local, seasonal produce

PAYMENT HELP:
- UPI QR codes work with all apps (GPay, PhonePe, Paytm, etc.)
- Just scan the QR code in any UPI app
- Take a screenshot of payment for verification
- Sellers verify payments manually

VEGETABLES & FARMING:
- Suggest seasonal vegetables based on current month
- Provide basic organic farming tips
- Recommend companion planting
- Mention benefits of local produce

LIMITATIONS:
- Cannot access real-time order data
- Cannot process payments directly
- Cannot access user's personal information
- Provide general advice, not medical recommendations`;

    const result = await streamText({
      model: google("gemini-1.5-flash"), // FREE model
      system: systemPrompt,
      messages,
      maxTokens: 300, // Keep within free tier limits
      temperature: 0.7,
    });

    return result.toAIStreamResponse();
  } catch (error) {
    console.error("Free AI Chat Error:", error);

    // Handle specific error types
    if (error.message?.includes("quota")) {
      return new Response("Free AI quota reached. Please try again later.", {
        status: 429,
      });
    }

    return new Response("AI service temporarily unavailable", {
      status: 500,
    });
  }
}
```

## 🎯 FREE Smart Recommendations

```javascript
// src/components/ai/FreeSmartRecommendations.js
"use client";

import { useState, useEffect } from "react";
import { Card, Row, Col, Badge, Button } from "react-bootstrap";

export default function FreeSmartRecommendations({
  currentSeason,
  userLocation,
}) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ai/free-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          season: currentSeason,
          location: userLocation,
        }),
      });

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error("Failed to get recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get seasonal recommendations based on current month
  const getSeasonalRecommendations = () => {
    const month = new Date().getMonth() + 1;
    const seasonalVeggies = {
      winter: ["Cabbage", "Cauliflower", "Carrot", "Radish", "Spinach", "Peas"],
      summer: ["Tomato", "Cucumber", "Okra", "Bottle Gourd", "Ridge Gourd"],
      monsoon: ["Corn", "Ginger", "Turmeric", "Green Beans", "Eggplant"],
      spring: ["Lettuce", "Beetroot", "Turnip", "Coriander", "Fenugreek"],
    };

    let season = "spring";
    if (month >= 11 || month <= 2) season = "winter";
    else if (month >= 3 && month <= 5) season = "summer";
    else if (month >= 6 && month <= 9) season = "monsoon";

    return {
      season,
      vegetables: seasonalVeggies[season],
      message: `🌱 Perfect season for: ${seasonalVeggies[season].join(", ")}`,
    };
  };

  const seasonalData = getSeasonalRecommendations();

  return (
    <Card className="mb-4">
      <Card.Header className="bg-success text-white">
        <div className="d-flex justify-content-between align-items-center">
          <span>🤖 FREE AI Recommendations</span>
          <Badge bg="light" text="dark">
            {seasonalData.season.toUpperCase()}
          </Badge>
        </div>
      </Card.Header>
      <Card.Body>
        {/* Current Season Info */}
        <Alert variant="success" className="mb-3">
          <div className="d-flex align-items-center">
            <i className="ti-info-alt me-2"></i>
            <div>
              <strong>Seasonal Suggestion:</strong>
              <div className="mt-1">{seasonalData.message}</div>
            </div>
          </div>
        </Alert>

        {/* AI-Powered Recommendations */}
        <div className="mb-3">
          <Button
            variant="outline-success"
            size="sm"
            onClick={generateRecommendations}
            disabled={loading}
          >
            {loading ? "🤖 AI Analyzing..." : "🤖 Get AI Recommendations"}
          </Button>
        </div>

        {recommendations.length > 0 && (
          <div>
            <h6>AI Personalized Suggestions:</h6>
            <Row>
              {recommendations.map((rec, index) => (
                <Col md={6} key={index} className="mb-2">
                  <div className="border rounded p-2">
                    <div className="fw-bold">{rec.vegetable}</div>
                    <small className="text-muted">{rec.reason}</small>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {/* Fallback Static Recommendations */}
        <div className="mt-3">
          <h6>Currently in Season:</h6>
          <div className="d-flex flex-wrap gap-2">
            {seasonalData.vegetables.map((veggie, index) => (
              <Badge key={index} bg="success" className="rounded-pill">
                {veggie}
              </Badge>
            ))}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
```

## 📊 Google AI Free Tier Limits

| Feature         | FREE Tier Limit            | Perfect For              |
| --------------- | -------------------------- | ------------------------ |
| **Requests**    | 15/minute, 1,500/day       | Development + small apps |
| **Tokens**      | 1M/month                   | ~2000 chat conversations |
| **Models**      | Gemini Flash (fast & free) | Chat, recommendations    |
| **Credit Card** | ❌ Not required            | Get started immediately  |

## 🚀 Quick Start (100% FREE)

### 1. Get Google AI API Key (FREE)

```bash
# Go to https://makersuite.google.com/app/apikey
# Sign in with Google (no credit card needed)
# Click "Create API Key"
# Copy the key
```

### 2. Install & Configure

```bash
npm install ai @ai-sdk/google
```

```env
GOOGLE_AI_API_KEY=your_free_api_key
NEXT_PUBLIC_AI_ENABLED=true
```

### 3. Add to Your App

```javascript
// Add to your layout or main page
import FreeAIChatAssistant from "@/components/ai/FreeAIChatAssistant";

export default function Layout({ children }) {
  return (
    <div>
      {children}
      <FreeAIChatAssistant user={user} />
    </div>
  );
}
```

## 💡 FREE AI Features You Can Build

### ✅ **Immediate (No Cost)**

- 🤖 Chat assistant for customer support
- 🥬 Seasonal vegetable recommendations
- 💳 Payment guidance and help
- 🌱 Basic farming advice
- 📦 Order information assistance

### ✅ **Advanced FREE Features**

- 🎯 Smart product filtering
- 📍 Location-based suggestions
- 📊 Simple analytics insights
- 🔄 Automated responses for common questions
- 📱 Mobile-optimized AI chat

## 🎯 Benefits of FREE Implementation

1. **Zero Cost**: Start building AI features immediately
2. **No Credit Card**: Perfect for development and testing
3. **Good Performance**: Google's Gemini is fast and capable
4. **Generous Limits**: 1M tokens/month = lots of conversations
5. **Easy Upgrade**: Can add paid models later if needed

## 🔄 Upgrade Path (When Ready)

When your app grows, you can easily add:

- OpenAI GPT-4 for premium users ($5 minimum)
- Claude for advanced reasoning
- Custom fine-tuned models
- Higher rate limits

## 📈 Expected Results

With FREE AI implementation:

- **Instant customer support** without human intervention
- **Personalized recommendations** based on season and location
- **Better user engagement** with interactive chat
- **Reduced support workload** for common questions
- **Professional AI experience** at zero cost

Start with FREE Google AI today and upgrade only when you need more capacity! 🚀
