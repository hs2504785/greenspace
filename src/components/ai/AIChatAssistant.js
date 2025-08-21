"use client";

import { useState, useRef, useEffect } from "react";
import { Button, Card, Form, Alert, Badge } from "react-bootstrap";
import ReactMarkdown from "react-markdown";
import InteractiveProductCard from "./InteractiveProductCard";

import ChatOrderTracker from "./ChatOrderTracker";
import toastService from "@/utils/toastService";

export default function AIChatAssistant({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: `🌱 **Hello! I'm your GreenSpace AI assistant!**

I can help you with:

- 🥬 Finding fresh vegetables & checking prices
- 💳 Payment help (UPI, GPay, PhonePe, Paytm)  
- 📦 Order tracking and status updates
- 🌱 Farming tips and gardening advice
- 📍 Local produce availability
- 🛒 Shopping assistance and recommendations

I have access to real product data and can help you find, buy, and track orders!

**What would you like to know?**`,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Shopping functionality state
  const [productResults, setProductResults] = useState([]);
  const [orderTracking, setOrderTracking] = useState(null);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Close Quick Actions overlay when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showQuickActions &&
        !event.target.closest(".quick-actions-overlay") &&
        !event.target.closest(".quick-actions-button")
      ) {
        setShowQuickActions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showQuickActions]);

  const quickActions = [
    "🥬 Show available products",
    "🛒 View my cart",
    "💳 How to pay with UPI?",
    "📦 Track my order",
    "🌱 What vegetables are in season?",
    "🚀 Quick buy tomatoes",
  ];

  // Shopping action handlers
  const handleAddToCart = async (product, quantity) => {
    const cartItem = {
      id: product.id,
      name: product.name,
      price: parseFloat(product.price.replace("₹", "")),
      quantity: quantity,
      seller: product.seller,
      availableQuantity: product.quantity,
    };

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: Math.min(item.quantity + quantity, product.quantity),
              }
            : item
        );
      }
      return [...prevCart, cartItem];
    });

    toastService.success(`Added ${quantity}kg ${product.name} to cart!`);

    // Add confirmation message
    const confirmMessage = {
      id: Date.now().toString(),
      role: "assistant",
      content: `✅ Added **${quantity}kg ${
        product.name
      }** to your cart!\n\nCart total: ${
        cart.length + 1
      } items\n\nWould you like to continue shopping or proceed to checkout?`,
      type: "text",
    };
    setMessages((prev) => [...prev, confirmMessage]);
  };

  const handleBuyNow = async (product, quantity) => {
    const item = {
      id: product.id,
      name: product.name,
      price: parseFloat(product.price.replace("₹", "")),
      quantity: quantity,
      seller: product.seller,
      availableQuantity: product.quantity,
    };

    setCheckoutItems([item]);
    setShowCheckout(true);

    // Add message about proceeding to checkout
    const checkoutMessage = {
      id: Date.now().toString(),
      role: "assistant",
      content: `🚀 **Quick Checkout** for ${quantity}kg ${
        product.name
      }\n\nTotal: ₹${(item.price * quantity).toFixed(
        2
      )}\n\nPlease fill in your delivery details below:`,
      type: "text",
    };
    setMessages((prev) => [...prev, checkoutMessage]);
  };

  const handleTrackOrder = async (orderId) => {
    try {
      // Mock order tracking - replace with actual API call
      const mockOrder = {
        id: orderId,
        status: "processing",
        total_amount: "250.00",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        delivery_address: user?.location || "Hyderabad, India",
        seller: {
          name: "Arya Natural Farms",
          phone: "+91-7799111008",
          whatsapp: "+91-7799111008",
        },
        items: [
          {
            name: "Fresh Tomatoes",
            quantity: 2,
            price_per_unit: 45,
            total_price: 90,
          },
          {
            name: "Organic Onions",
            quantity: 3,
            price_per_unit: 35,
            total_price: 105,
          },
        ],
      };

      setOrderTracking(mockOrder);

      const trackingMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: `📦 **Order Tracking**\n\nFound your order! Here's the current status:`,
        type: "text",
      };
      setMessages((prev) => [...prev, trackingMessage]);
    } catch (error) {
      toastService.error("Order not found. Please check the order ID.");
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const sendMessage = async (messageContent) => {
    if (!messageContent.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      console.log("📨 Sending Smart AI request...");
      const response = await fetch("/api/ai/smart-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          user: user || {},
        }),
      });

      console.log("📥 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      // Read the streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = "";

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      };
      setMessages((prev) => [...prev, aiMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        aiResponse += chunk;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMessage.id ? { ...m, content: aiResponse } : m
          )
        );
      }

      console.log("✅ AI response complete:", aiResponse);

      // Check if response contains order confirmation (from instant_order tool)
      if (
        aiResponse.includes("Order Confirmed!") &&
        aiResponse.includes("Track Your Order")
      ) {
        // Show success toast
        toastService.success("Order placed successfully via AI!");

        // Dispatch event to refresh orders lists
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("ai-order-created"));
          window.dispatchEvent(new CustomEvent("order-created"));
        }
      }

      // Check if response mentions products and trigger product search
      if (
        aiResponse
          .toLowerCase()
          .includes("here are the currently available items") ||
        (aiResponse.toLowerCase().includes("found") &&
          aiResponse.toLowerCase().includes("available"))
      ) {
        // Mock product results - replace with actual API call to your product endpoint
        setTimeout(() => {
          const mockProducts = [
            {
              id: "1",
              name: "w11 (Dragon fruit)",
              description: "Fresh dragon fruit from local farms",
              price: "₹3.00",
              quantity: 3,
              category: "Fruits",
              seller: { name: "Arya Natural Farms", phone: "+91-7799111008" },
            },
            {
              id: "2",
              name: "re (product)",
              description: "Fresh produce from organic farms",
              price: "₹3.00",
              quantity: 3,
              category: "Vegetables",
              seller: { name: "Arya Natural Farms", phone: "+91-7799111008" },
            },
          ];
          setProductResults(mockProducts);
        }, 1000);
      }
    } catch (err) {
      console.error("❌ Chat error:", err);
      setError(err.message);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitMessage = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      const message = inputValue.trim().toLowerCase();

      // Handle special commands
      if (
        message === "cart" ||
        message === "view cart" ||
        message === "show cart"
      ) {
        handleViewCart();
      } else if (
        message.startsWith("track ") ||
        (message.includes("order") && message.includes("track"))
      ) {
        // Extract order ID from message
        const orderIdMatch = message.match(/(?:track\s+|order\s+#?)([\w\d]+)/);
        if (orderIdMatch) {
          handleTrackOrder(orderIdMatch[1]);
        } else {
          sendMessage(inputValue);
        }
      } else {
        sendMessage(inputValue);
      }

      setInputValue("");
    }
  };

  const handleQuickAction = (action) => {
    if (action === "🛒 View my cart") {
      handleViewCart();
    } else {
      sendMessage(action);
    }
  };

  return (
    <>
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Custom scrollbar for messages */
        .messages-container::-webkit-scrollbar {
          width: 4px;
        }

        .messages-container::-webkit-scrollbar-track {
          background: transparent;
        }

        .messages-container::-webkit-scrollbar-thumb {
          background: rgba(40, 167, 69, 0.3);
          border-radius: 2px;
        }

        .messages-container::-webkit-scrollbar-thumb:hover {
          background: rgba(40, 167, 69, 0.5);
        }

        /* Remove focus outlines for better UX */
        .form-control:focus {
          outline: none !important;
          box-shadow: none !important;
          border-color: #e9ecef !important;
        }
        .btn:focus {
          outline: none !important;
          box-shadow: none !important;
        }

        /* Simple AI Chat Button */
        .ai-chat-button {
          border-radius: 50% !important;
          transition: all 0.2s ease !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          background: white !important;
          background-color: white !important;
          position: fixed !important;
          z-index: 9999 !important;
          -webkit-transform: translateZ(0) !important;
          transform: translateZ(0) !important;
        }

        .ai-chat-button:hover {
          background: #28a745 !important;
          color: white !important;
          border-color: #28a745 !important;
        }

        .ai-chat-button:focus {
          box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.25) !important;
          outline: none !important;
        }

        .ai-chat-icon {
          font-size: 28px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        @media (max-width: 768px) {
          .ai-chat-icon {
            font-size: 24px;
          }

          .ai-chat-button {
            bottom: 80px !important;
            right: 16px !important;
            width: 56px !important;
            height: 56px !important;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15),
              0 0 0 1px rgba(40, 167, 69, 0.1) !important;
          }
        }
      `}</style>
      {/* Floating Chat Button */}
      <Button
        variant="outline-success"
        className="ai-chat-button position-fixed d-flex align-items-center justify-content-center"
        style={{
          bottom: isMobile ? "80px" : "24px", // Higher on mobile to avoid nav bars
          right: isMobile ? "16px" : "24px",
          zIndex: 9999, // Much higher z-index to ensure visibility
          width: isMobile ? "56px" : "72px", // Slightly smaller on mobile
          height: isMobile ? "56px" : "72px",
          borderRadius: "50%",
          border: "2px solid #28a745",
          background: "white",
          backgroundColor: "white",
          color: "#28a745",
          boxShadow: isMobile
            ? "0 4px 20px rgba(0,0,0,0.15), 0 0 0 1px rgba(40,167,69,0.1)"
            : "0 4px 12px rgba(40, 167, 69, 0.4)",
          transform: "translateZ(0)", // Force hardware acceleration
        }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        <span className="ai-chat-icon">{isOpen ? "✕" : "✨"}</span>
      </Button>

      {/* Chat Interface */}
      {isOpen && (
        <Card
          className="position-fixed d-flex flex-column"
          style={{
            bottom: isMobile ? "10px" : "90px",
            right: isMobile ? "10px" : "20px",
            left: isMobile ? "10px" : "auto",
            width: isMobile ? "auto" : "min(550px, 40vw)", // Even wider on desktop
            maxWidth: isMobile ? "none" : "550px", // Increased max width
            height: isMobile ? "calc(100vh - 20px)" : "600px", // Taller for more conversation space
            zIndex: 1050, // Higher z-index
            boxShadow:
              "0 25px 80px rgba(0,0,0,0.25), 0 10px 40px rgba(0,0,0,0.15)", // Much stronger shadow
            border: "1px solid #d1d5db",
            borderRadius: isMobile ? "16px" : "20px",
            overflow: "hidden",
            animation: "slideUp 0.3s ease-out",
            background: "#ffffff",
          }}
        >
          <div
            className="flex-shrink-0 position-relative"
            style={{
              background: "linear-gradient(135deg, #f8f9fa, #ffffff)",
              borderBottom: "2px solid #e9ecef",
              padding: "14px 20px",
            }}
          >
            {/* Header Row */}
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <div
                  className="d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: "32px",
                    height: "32px",
                    backgroundColor: "#28a745",
                    borderRadius: "50%",
                    fontSize: "14px",
                    boxShadow: "0 2px 6px rgba(40, 167, 69, 0.3)",
                    color: "#ffffff",
                  }}
                >
                  ✨
                </div>
                <div>
                  <span
                    className="fw-bold"
                    style={{ fontSize: "16px", color: "#1a1a1a" }}
                  >
                    AI Assistant
                  </span>
                  <div className="d-flex align-items-center mt-1">
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        backgroundColor: "#28a745",
                        borderRadius: "50%",
                        marginRight: "4px",
                      }}
                    ></div>
                    <span className="text-muted" style={{ fontSize: "11px" }}>
                      Online
                    </span>
                  </div>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                {/* Help/Quick Actions Button */}
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 position-relative quick-actions-button"
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  style={{
                    color: showQuickActions ? "#28a745" : "#6c757d",
                    fontSize: "18px",
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#e9ecef";
                    e.target.style.color = "#495057";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "transparent";
                    e.target.style.color = showQuickActions
                      ? "#28a745"
                      : "#6c757d";
                  }}
                >
                  💡
                </Button>

                {/* Close Button */}
                <Button
                  variant="link"
                  size="sm"
                  className="p-0"
                  onClick={() => setIsOpen(false)}
                  style={{
                    color: "#6c757d",
                    fontSize: "20px",
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#e9ecef";
                    e.target.style.color = "#495057";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "transparent";
                    e.target.style.color = "#6c757d";
                  }}
                >
                  ✕
                </Button>
              </div>
            </div>

            {/* Quick Actions Overlay */}
            {showQuickActions && (
              <div
                className="position-absolute quick-actions-overlay"
                style={{
                  top: "100%",
                  right: isMobile ? "10px" : "60px", // Adjust for mobile
                  left: isMobile ? "10px" : "auto", // Full width on mobile
                  zIndex: 1100,
                  background: "#ffffff",
                  border: "2px solid #e9ecef",
                  borderRadius: "12px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                  padding: "14px",
                  minWidth: isMobile ? "auto" : "280px",
                  maxWidth: isMobile ? "none" : "320px",
                  animation: "fadeIn 0.2s ease-out",
                }}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
              >
                <div className="mb-2">
                  <small
                    className="text-muted fw-bold"
                    style={{
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    💡 Quick Actions
                  </small>
                </div>
                <div className="d-flex flex-column">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline-success"
                      size="sm"
                      className="text-start border-0"
                      style={{
                        fontSize: "13px",
                        padding: "10px 14px",
                        backgroundColor: isLoading ? "#f1f3f4" : "#ffffff",
                        color: isLoading ? "#9aa0a6" : "#28a745",
                        boxShadow: "none",
                        transition: "all 0.2s ease",
                        fontWeight: "500",
                        lineHeight: "1.4",
                        borderRadius: "10px",
                        border: "1px solid transparent",
                      }}
                      onClick={() => {
                        handleQuickAction(action);
                        setShowQuickActions(false); // Close overlay after action
                      }}
                      disabled={isLoading}
                      onMouseEnter={(e) => {
                        if (!isLoading) {
                          e.target.style.backgroundColor = "#e8f5e8";
                          e.target.style.borderColor = "#28a745";
                          e.target.style.transform = "translateX(4px)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isLoading) {
                          e.target.style.backgroundColor = "#ffffff";
                          e.target.style.borderColor = "transparent";
                          e.target.style.transform = "translateX(0)";
                        }
                      }}
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div
            className="d-flex flex-column"
            style={{
              flex: 1,
              minHeight: 0,
              height: "100%",
            }}
          >
            {/* Error Messages */}
            {error && (
              <Alert
                variant="danger"
                className="m-3 mb-0 flex-shrink-0"
                style={{
                  backgroundColor: "#fff2f0",
                  borderColor: "#ffb3b3",
                  color: "#d9534f",
                  borderRadius: "12px",
                  fontSize: "14px",
                }}
              >
                <div className="d-flex align-items-center">
                  <i className="ti-alert-triangle me-2"></i>
                  <span>AI temporarily unavailable: {error}</span>
                </div>
              </Alert>
            )}

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-grow-1 overflow-auto px-3 py-3 messages-container"
              style={{
                scrollBehavior: "smooth",
                background: "#ffffff",
                minHeight: 0, // Critical for flex shrinking
                maxHeight: "100%", // Ensure it uses all available space
              }}
            >
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`mb-2 d-flex ${
                    message.role === "user"
                      ? "justify-content-end"
                      : "justify-content-start"
                  }`}
                  style={{
                    animation: `fadeIn 0.3s ease-out ${index * 0.1}s both`,
                  }}
                >
                  <div
                    className={`position-relative ${
                      message.role === "user" ? "text-white" : ""
                    }`}
                    style={{
                      maxWidth: "96%", // Increased even more to use maximum space
                      background:
                        message.role === "user"
                          ? "linear-gradient(135deg, #28a745, #20c997)"
                          : "#ffffff",
                      borderRadius:
                        message.role === "user"
                          ? "18px 18px 4px 18px"
                          : "4px 18px 18px 18px",
                      boxShadow:
                        message.role === "user"
                          ? "0 1px 4px rgba(40, 167, 69, 0.15)" // Much lighter shadow
                          : "0 1px 3px rgba(0, 0, 0, 0.05)", // Very light shadow
                      border:
                        message.role === "assistant"
                          ? "1px solid #f0f0f0"
                          : "none",
                      padding: "14px 18px", // Slightly reduced padding for more content space
                    }}
                  >
                    {/* Small AI indicator for assistant messages */}
                    {message.role === "assistant" && (
                      <div
                        style={{
                          position: "absolute",
                          top: "-6px",
                          left: "-6px",
                          width: "18px",
                          height: "18px",
                          backgroundColor: "#28a745",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px",
                          boxShadow: "0 2px 4px rgba(40, 167, 69, 0.3)",
                          color: "#ffffff",
                        }}
                      >
                        ✨
                      </div>
                    )}

                    <div
                      style={{
                        fontSize: "15px",
                        lineHeight: "1.5",
                        color: message.role === "user" ? "#ffffff" : "#1a1a1a",
                        fontWeight: message.role === "user" ? "500" : "400",
                      }}
                    >
                      {message.role === "assistant" ? (
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => (
                              <p style={{ margin: "0 0 8px 0" }}>{children}</p>
                            ),
                            ul: ({ children }) => (
                              <ul
                                style={{
                                  margin: "8px 0",
                                  paddingLeft: "0px",
                                  listStyle: "none",
                                }}
                              >
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol
                                style={{ margin: "8px 0", paddingLeft: "20px" }}
                              >
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li style={{ margin: "2px 0" }}>{children}</li>
                            ),
                            strong: ({ children }) => (
                              <strong
                                style={{ fontWeight: "600", color: "#2d5a3d" }}
                              >
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => (
                              <em
                                style={{
                                  fontStyle: "italic",
                                  color: "#5a6c57",
                                }}
                              >
                                {children}
                              </em>
                            ),
                            code: ({ children }) => (
                              <code
                                style={{
                                  backgroundColor: "#f8f9fa",
                                  padding: "2px 4px",
                                  borderRadius: "4px",
                                  fontSize: "13px",
                                  border: "1px solid #e9ecef",
                                }}
                              >
                                {children}
                              </code>
                            ),
                            h1: ({ children }) => (
                              <h1
                                style={{
                                  fontSize: "18px",
                                  fontWeight: "600",
                                  margin: "12px 0 8px 0",
                                  color: "#2d5a3d",
                                }}
                              >
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2
                                style={{
                                  fontSize: "16px",
                                  fontWeight: "600",
                                  margin: "10px 0 6px 0",
                                  color: "#2d5a3d",
                                }}
                              >
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3
                                style={{
                                  fontSize: "15px",
                                  fontWeight: "600",
                                  margin: "8px 0 4px 0",
                                  color: "#2d5a3d",
                                }}
                              >
                                {children}
                              </h3>
                            ),
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: "#007bff",
                                  textDecoration: "underline",
                                  fontWeight: "500",
                                  cursor: "pointer",
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (
                                    href &&
                                    href.startsWith(
                                      "http://localhost:3000/orders/"
                                    )
                                  ) {
                                    window.open(href, "_blank");
                                  }
                                }}
                              >
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      ) : (
                        <div style={{ whiteSpace: "pre-wrap" }}>
                          {message.content}
                        </div>
                      )}
                    </div>
                    <div
                      className={`text-end mt-2 ${
                        message.role === "user" ? "text-white" : "text-muted"
                      }`}
                      style={{
                        opacity: 0.7,
                        fontSize: "11px",
                      }}
                    >
                      {new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />

              {/* Interactive Product Results */}
              {productResults.length > 0 && (
                <div className="mb-3">
                  {productResults.map((product) => (
                    <InteractiveProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      onBuyNow={handleBuyNow}
                      onViewDetails={(product) => {
                        const detailMessage = {
                          id: Date.now().toString(),
                          role: "assistant",
                          content: `**${product.name}** Details:\n\n📍 Seller: ${product.seller?.name}\n💰 Price: ${product.price}/kg\n📦 Available: ${product.quantity}kg\n📝 ${product.description}\n\nWould you like to add this to cart or buy now?`,
                          type: "text",
                        };
                        setMessages((prev) => [...prev, detailMessage]);
                      }}
                    />
                  ))}
                  <div className="text-center">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setProductResults([])}
                      style={{ fontSize: "12px", padding: "4px 12px" }}
                    >
                      Hide Products
                    </Button>
                  </div>
                </div>
              )}

              {/* Order Tracking */}
              {orderTracking && (
                <ChatOrderTracker
                  order={orderTracking}
                  onContactSeller={(seller) => {
                    window.open(
                      `https://wa.me/${seller.whatsapp?.replace(/\D/g, "")}`,
                      "_blank"
                    );
                  }}
                  onTrackAnother={() => {
                    setOrderTracking(null);
                    const trackMessage = {
                      id: Date.now().toString(),
                      role: "assistant",
                      content: "Please provide another order ID to track:",
                      type: "text",
                    };
                    setMessages((prev) => [...prev, trackMessage]);
                  }}
                  onViewPayment={(order) => {
                    const paymentMessage = {
                      id: Date.now().toString(),
                      role: "assistant",
                      content: `💳 **Payment for Order ${order.id.slice(
                        -8
                      )}**\n\nTotal: ₹${
                        order.total_amount
                      }\n\nUPI QR code will be generated after order confirmation.\n\nPayment methods:\n✅ GPay, PhonePe, Paytm\n✅ Any UPI app\n✅ Scan QR and pay`,
                      type: "text",
                    };
                    setMessages((prev) => [...prev, paymentMessage]);
                  }}
                />
              )}

              {isLoading && (
                <div className="d-flex justify-content-start mb-2">
                  <div
                    className="position-relative"
                    style={{
                      maxWidth: "96%",
                      background: "#ffffff",
                      borderRadius: "4px 18px 18px 18px",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                      border: "1px solid #f0f0f0",
                      padding: "14px 18px",
                    }}
                  >
                    {/* Small AI indicator */}
                    <div
                      style={{
                        position: "absolute",
                        top: "-6px",
                        left: "-6px",
                        width: "18px",
                        height: "18px",
                        backgroundColor: "#28a745",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        boxShadow: "0 2px 4px rgba(40, 167, 69, 0.3)",
                        color: "#ffffff",
                      }}
                    >
                      ✨
                    </div>

                    <div className="d-flex align-items-center">
                      <div
                        className="spinner-border spinner-border-sm text-success me-2"
                        style={{ width: "14px", height: "14px" }}
                      ></div>
                      <span style={{ fontSize: "15px", color: "#666" }}>
                        AI is thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <div
              className="flex-shrink-0"
              style={{
                background: "linear-gradient(to top, #f8f9fa, #ffffff)",
                borderTop: "2px solid #e9ecef",
                padding: "16px 20px 20px 20px",
                boxShadow: "0 -4px 12px rgba(0,0,0,0.05)",
              }}
            >
              <Form onSubmit={handleSubmitMessage}>
                <div
                  className="d-flex align-items-end gap-3"
                  style={{
                    background: "#ffffff",
                    borderRadius: "24px",
                    padding: "6px",
                    border: "2px solid #e9ecef",
                    transition: "all 0.2s ease",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                >
                  <Form.Control
                    as="textarea"
                    placeholder="Type your message here..."
                    value={inputValue}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    name="message"
                    rows="1"
                    style={{
                      border: "none",
                      background: "transparent",
                      resize: "none",
                      fontSize: "15px",
                      lineHeight: "1.4",
                      padding: "12px 16px",
                      maxHeight: "100px",
                      minHeight: "20px",
                      outline: "none",
                      boxShadow: "none",
                    }}
                    onFocus={(e) => {
                      e.target.style.outline = "none";
                      e.target.style.boxShadow = "none";
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (inputValue.trim()) {
                          handleSubmitMessage(e);
                        }
                      }
                    }}
                    onInput={(e) => {
                      // Auto-resize textarea
                      e.target.style.height = "auto";
                      e.target.style.height =
                        Math.min(e.target.scrollHeight, 100) + "px";
                    }}
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    style={{
                      minWidth: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background:
                        isLoading || !inputValue.trim()
                          ? "#e9ecef"
                          : "linear-gradient(135deg, #28a745, #20c997)",
                      border: "none",
                      boxShadow:
                        isLoading || !inputValue.trim()
                          ? "none"
                          : "0 4px 12px rgba(40, 167, 69, 0.4)",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      margin: "2px",
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading && inputValue.trim()) {
                        e.target.style.transform = "scale(1.05)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoading && inputValue.trim()) {
                        e.target.style.transform = "scale(1)";
                      }
                    }}
                  >
                    {isLoading ? (
                      <div
                        className="spinner-border spinner-border-sm text-white"
                        style={{ width: "16px", height: "16px" }}
                      ></div>
                    ) : (
                      "🚀"
                    )}
                  </Button>
                </div>
              </Form>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
