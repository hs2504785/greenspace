# 🤖 AI Integration Guide for GreenSpace Marketplace

## Overview

This guide outlines the implementation of AI features to transform GreenSpace into an intelligent agricultural marketplace platform.

## 🚀 Phase 1: AI Chat Assistant

### Setup Vercel AI SDK

```bash
npm install ai @ai-sdk/openai @ai-sdk/google
npm install @vercel/analytics @vercel/speed-insights
```

### Environment Variables

```env
# AI Configuration
OPENAI_API_KEY=your_openai_key
GOOGLE_AI_API_KEY=your_google_ai_key
NEXT_PUBLIC_AI_ENABLED=true

# Vercel Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id
```

### AI Chat Component

```javascript
// src/components/ai/AIChatAssistant.js
"use client";

import { useState } from "react";
import { useChat } from "ai/react";
import { Button, Card, Form, Spinner } from "react-bootstrap";

export default function AIChatAssistant({
  user,
  recentOrders,
  availableProducts,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/ai/chat",
      initialMessages: [
        {
          id: "welcome",
          role: "assistant",
          content: `Hello! I'm your GreenSpace AI assistant. I can help you with:
        
🥬 Finding fresh produce
💳 Payment questions (UPI, GPay, etc.)
📦 Order tracking
🌱 Farming advice
📍 Local availability

What would you like to know?`,
        },
      ],
      body: {
        context: {
          userRole: user?.role,
          recentOrders: recentOrders?.slice(0, 3), // Last 3 orders for context
          availableProducts: availableProducts?.slice(0, 10), // Top 10 products
          location: user?.location,
        },
      },
    });

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        className="ai-chat-toggle position-fixed"
        style={{
          bottom: "20px",
          right: "20px",
          zIndex: 1000,
          borderRadius: "50%",
          width: "60px",
          height: "60px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
        variant="primary"
        onClick={() => setIsOpen(!isOpen)}
      >
        🤖
      </Button>

      {/* Chat Interface */}
      {isOpen && (
        <Card
          className="ai-chat-interface position-fixed"
          style={{
            bottom: "90px",
            right: "20px",
            width: "350px",
            height: "500px",
            zIndex: 1000,
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          <Card.Header className="d-flex justify-content-between align-items-center bg-success text-white">
            <span>🤖 GreenSpace AI Assistant</span>
            <Button
              variant="link"
              size="sm"
              className="text-white p-0"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </Button>
          </Card.Header>

          <Card.Body className="d-flex flex-column p-0">
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
                    style={{ maxWidth: "80%" }}
                  >
                    <div className="small mb-1">
                      {message.role === "user" ? "You" : "AI Assistant"}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap" }}>
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="text-center">
                  <Spinner animation="border" size="sm" variant="success" />
                  <span className="ms-2 text-muted">AI is thinking...</span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <div className="border-top p-3">
              <Form onSubmit={handleSubmit}>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="text"
                    placeholder="Ask anything about farming, orders, payments..."
                    value={input}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                  <Button type="submit" disabled={isLoading || !input.trim()}>
                    Send
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

### AI Chat API Route

```javascript
// src/app/api/ai/chat/route.js
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const { messages, context } = await req.json();

    // Build context-aware system prompt
    const systemPrompt = `You are GreenSpace AI, an intelligent assistant for a fresh produce marketplace connecting local farmers with consumers.

CONTEXT:
- User Role: ${context.userRole || "guest"}
- User Location: ${context.location || "not specified"}
- Recent Orders: ${JSON.stringify(context.recentOrders || [])}
- Available Products: ${JSON.stringify(context.availableProducts || [])}

CAPABILITIES:
1. 🥬 Product Information: Help find vegetables, seasonal produce, organic options
2. 💳 Payment Support: Explain UPI, GPay, Paytm, payment process
3. 📦 Order Tracking: Check order status, delivery updates
4. 🌱 Agricultural Advice: Farming tips, seasonal planting, pest control
5. 📍 Local Discovery: Find nearby sellers, seasonal availability
6. 🛒 Shopping Assistance: Cart help, checkout guidance

PERSONALITY:
- Friendly, helpful, and knowledgeable about agriculture
- Use emojis appropriately
- Provide actionable advice
- Keep responses concise but informative
- Always prioritize fresh, local, seasonal produce

IMPORTANT RULES:
- For payment issues: Guide to UPI QR codes, mention GPay/PhonePe/Paytm support
- For orders: Use order IDs if available in context
- For farming: Provide practical, season-appropriate advice
- For products: Suggest alternatives if specific items unavailable
- Always encourage sustainable, local agriculture`;

    const result = await streamText({
      model: openai("gpt-4-turbo"),
      system: systemPrompt,
      messages,
      maxTokens: 500,
      temperature: 0.7,
    });

    return result.toAIStreamResponse();
  } catch (error) {
    console.error("AI Chat Error:", error);
    return new Response("AI service temporarily unavailable", { status: 500 });
  }
}
```

## 🎯 Phase 2: Smart Recommendations

### Personalized Product Recommendations

```javascript
// src/components/ai/SmartRecommendations.js
"use client";

import { useState, useEffect } from "react";
import { Card, Row, Col, Badge } from "react-bootstrap";
import VegetableCard from "@/components/features/VegetableCard";

export default function SmartRecommendations({ userId, currentProduct }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [userId, currentProduct]);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch("/api/ai/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          currentProduct: currentProduct?.id,
          context: "product_page",
        }),
      });

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="mb-4">
        <Card.Body>
          <div className="text-center py-4">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">
                Loading recommendations...
              </span>
            </div>
            <p className="mt-2 text-muted">
              AI is analyzing your preferences...
            </p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (!recommendations.length) return null;

  return (
    <Card className="mb-4">
      <Card.Header className="bg-success text-white">
        <div className="d-flex align-items-center">
          <i className="ti-lightbulb me-2"></i>
          <span>🤖 AI Recommendations for You</span>
          <Badge bg="light" text="dark" className="ms-auto">
            Personalized
          </Badge>
        </div>
      </Card.Header>
      <Card.Body>
        <Row>
          {recommendations.map((product, index) => (
            <Col md={6} lg={4} key={product.id} className="mb-3">
              <VegetableCard
                vegetable={product}
                showAIBadge={true}
                aiReason={product.aiReason}
              />
            </Col>
          ))}
        </Row>
      </Card.Body>
    </Card>
  );
}
```

### AI Recommendations API

```javascript
// src/app/api/ai/recommendations/route.js
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

const RecommendationSchema = z.object({
  recommendations: z.array(
    z.object({
      productId: z.string(),
      reason: z.string(),
      confidence: z.number().min(0).max(1),
      category: z.enum([
        "seasonal",
        "complementary",
        "historical",
        "trending",
        "location",
      ]),
    })
  ),
});

export async function POST(req) {
  try {
    const { userId, currentProduct, context } = await req.json();

    // Fetch user data and context
    const [userOrders, availableProducts, seasonalData] = await Promise.all([
      getUserOrderHistory(userId),
      getAvailableProducts(),
      getSeasonalData(),
    ]);

    const result = await generateObject({
      model: openai("gpt-4-turbo"),
      schema: RecommendationSchema,
      prompt: `Analyze user preferences and recommend vegetables:

USER CONTEXT:
- Order History: ${JSON.stringify(userOrders)}
- Current Product: ${currentProduct || "none"}
- Available Products: ${JSON.stringify(availableProducts.slice(0, 20))}
- Seasonal Data: ${JSON.stringify(seasonalData)}

RECOMMENDATION RULES:
1. Seasonal vegetables get higher priority
2. Complementary vegetables (for cooking together)
3. User's historical preferences
4. Trending products in user's area
5. Nutritionally diverse options

Provide 6-8 recommendations with clear reasons and confidence scores.`,
    });

    // Enhance recommendations with product details
    const enhancedRecommendations = await enhanceWithProductDetails(
      result.object.recommendations,
      availableProducts
    );

    return Response.json({
      recommendations: enhancedRecommendations,
      context: "ai_generated",
    });
  } catch (error) {
    console.error("AI Recommendations Error:", error);
    return Response.json({ recommendations: [] }, { status: 500 });
  }
}

async function getUserOrderHistory(userId) {
  if (!userId) return [];

  const { data } = await supabase
    .from("orders")
    .select(
      `
      id,
      created_at,
      order_items (
        quantity,
        vegetables (name, category, price)
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  return data || [];
}

async function getAvailableProducts() {
  const { data } = await supabase
    .from("vegetables")
    .select("*")
    .eq("available", true)
    .order("created_at", { ascending: false })
    .limit(50);

  return data || [];
}

async function getSeasonalData() {
  const currentMonth = new Date().getMonth() + 1;
  // Return seasonal vegetables data based on current month
  return {
    month: currentMonth,
    seasonalVegetables: getSeasonalVegetables(currentMonth),
  };
}
```

## 🌱 Phase 3: Agricultural Intelligence

### Farming Assistant

```javascript
// src/components/ai/FarmingAssistant.js
"use client";

import { useState } from "react";
import { Card, Form, Button, Alert, Badge } from "react-bootstrap";

export default function FarmingAssistant({ userLocation, userRole }) {
  const [question, setQuestion] = useState("");
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);

  const commonQuestions = [
    "What vegetables should I plant this month?",
    "How to deal with pest problems organically?",
    "Best watering schedule for tomatoes",
    "When to harvest ridge gourd?",
    "Organic fertilizer recommendations",
    "Seasonal planting calendar for my area",
  ];

  const getAdvice = async (userQuestion) => {
    setLoading(true);
    try {
      const response = await fetch("/api/ai/farming-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userQuestion,
          location: userLocation,
          userRole,
        }),
      });

      const data = await response.json();
      setAdvice(data);
    } catch (error) {
      console.error("Failed to get farming advice:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.trim()) {
      getAdvice(question);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header className="bg-success text-white">
        <i className="ti-leaf me-2"></i>
        🌱 AI Farming Assistant
      </Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>
              Ask about farming, planting, or garden care:
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="E.g., What vegetables grow best in winter? How to prepare soil for tomatoes?"
            />
          </Form.Group>
          <Button
            type="submit"
            variant="success"
            disabled={loading || !question.trim()}
          >
            {loading ? "Getting AI Advice..." : "Get Farming Advice"}
          </Button>
        </Form>

        {/* Common Questions */}
        <div className="mt-3">
          <small className="text-muted">Quick questions:</small>
          <div className="mt-2">
            {commonQuestions.map((q, index) => (
              <Badge
                key={index}
                bg="light"
                text="dark"
                className="me-2 mb-2 cursor-pointer"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setQuestion(q);
                  getAdvice(q);
                }}
              >
                {q}
              </Badge>
            ))}
          </div>
        </div>

        {/* AI Advice Display */}
        {advice && (
          <Alert variant="info" className="mt-4">
            <div className="d-flex align-items-start">
              <i className="ti-lightbulb me-2 mt-1"></i>
              <div>
                <strong>AI Farming Advice:</strong>
                <div className="mt-2" style={{ whiteSpace: "pre-wrap" }}>
                  {advice.response}
                </div>
                {advice.confidence && (
                  <small className="text-muted d-block mt-2">
                    Confidence: {Math.round(advice.confidence * 100)}%
                  </small>
                )}
              </div>
            </div>
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
}
```

## 📊 Phase 4: Business Intelligence

### Market Analytics Dashboard

```javascript
// src/components/ai/MarketAnalytics.js
"use client";

import { useState, useEffect } from "react";
import { Card, Row, Col, Table, Badge, Chart } from "react-bootstrap";

export default function MarketAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/ai/market-analytics");
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading market insights...</div>;

  return (
    <Row>
      <Col md={6}>
        <Card className="mb-4">
          <Card.Header>🎯 Demand Predictions</Card.Header>
          <Card.Body>
            <Table responsive size="sm">
              <thead>
                <tr>
                  <th>Vegetable</th>
                  <th>Predicted Demand</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {analytics?.demandPredictions?.map((item, index) => (
                  <tr key={index}>
                    <td>{item.vegetable}</td>
                    <td>
                      <Badge bg={item.trend === "up" ? "success" : "warning"}>
                        {item.demand}
                      </Badge>
                    </td>
                    <td>{Math.round(item.confidence * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Col>

      <Col md={6}>
        <Card className="mb-4">
          <Card.Header>💰 Price Optimization</Card.Header>
          <Card.Body>
            <div className="mb-3">
              <strong>AI Pricing Recommendations:</strong>
            </div>
            {analytics?.pricingRecommendations?.map((item, index) => (
              <div key={index} className="border rounded p-2 mb-2">
                <div className="d-flex justify-content-between">
                  <span>{item.vegetable}</span>
                  <Badge bg="success">₹{item.suggestedPrice}/kg</Badge>
                </div>
                <small className="text-muted">{item.reason}</small>
              </div>
            ))}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
```

## 🔧 Integration Steps

### 1. Install Dependencies

```bash
npm install ai @ai-sdk/openai @ai-sdk/google zod
npm install @vercel/analytics @vercel/speed-insights
```

### 2. Setup Environment Variables

```env
# AI Services
OPENAI_API_KEY=your_openai_api_key
GOOGLE_AI_API_KEY=your_google_ai_key

# Feature Flags
NEXT_PUBLIC_AI_CHAT_ENABLED=true
NEXT_PUBLIC_AI_RECOMMENDATIONS_ENABLED=true
NEXT_PUBLIC_AI_FARMING_ASSISTANT_ENABLED=true

# Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id
```

### 3. Add AI Components to Layout

```javascript
// src/components/layout/MainLayout.js
import AIChatAssistant from "@/components/ai/AIChatAssistant";
import { useSession } from "next-auth/react";

export default function MainLayout({ children }) {
  const { data: session } = useSession();

  return (
    <div>
      {children}

      {/* AI Chat Assistant - Always Available */}
      {process.env.NEXT_PUBLIC_AI_CHAT_ENABLED === "true" && (
        <AIChatAssistant
          user={session?.user}
          // Pass relevant context
        />
      )}
    </div>
  );
}
```

## 🎯 Expected Benefits

### User Experience

- **Instant Support**: 24/7 AI assistance for common questions
- **Personalized Shopping**: Smart recommendations based on preferences
- **Agricultural Guidance**: Expert farming advice for sellers
- **Streamlined Payments**: AI guides through payment processes

### Business Intelligence

- **Demand Forecasting**: Predict seasonal demand patterns
- **Price Optimization**: AI-suggested pricing for maximum sales
- **Inventory Management**: Smart stock level recommendations
- **Market Insights**: Real-time agricultural market analysis

### Operational Efficiency

- **Reduced Support Load**: AI handles common queries
- **Better Conversions**: Personalized recommendations increase sales
- **Data-Driven Decisions**: AI analytics for business strategy
- **Scalable Intelligence**: AI scales with user growth

## 📈 Performance Metrics to Track

```javascript
// Analytics tracking for AI features
import { track } from "@vercel/analytics";

// Track AI interactions
track("ai_chat_message_sent", {
  user_role: userRole,
  message_type: "payment_inquiry",
});

track("ai_recommendation_clicked", {
  product_id: productId,
  recommendation_type: "seasonal",
});

track("ai_farming_advice_requested", {
  question_category: "planting",
  user_location: userLocation,
});
```

This AI integration will position GreenSpace as a cutting-edge agricultural platform, providing intelligent assistance that grows smarter with every interaction!
