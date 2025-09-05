"use client";

import { useState, useRef, useEffect } from "react";
import { Button, Card, Form, Alert, Badge } from "react-bootstrap";
import ReactMarkdown from "react-markdown";
import InteractiveProductCard from "./InteractiveProductCard";
import ChatOrderTracker from "./ChatOrderTracker";
import toastService from "@/utils/toastService";

export default function AIChatAssistant({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [fullUserProfile, setFullUserProfile] = useState(null);

  // Function to get welcome message based on device type
  const getWelcomeMessage = (mobile) => ({
    id: "welcome",
    role: "assistant",
    content: mobile
      ? `🌱 **Hello! I'm your Enhanced AI Assistant!**

**🚀 New Features Available:**
- 🌾 Find nearby verified sellers & farms
- 📅 Seasonal farming recommendations  
- 🎯 Smart wishlist with price alerts
- 🛒 Instant orders with pay later option

**What would you like to explore?**`
      : `🌱 **Hello! I'm your Enhanced AI Assistant!**

**🚀 7 Powerful Features Now Available:**

- 🔍 **Smart Product Search** - Find vegetables with price & location filters
- 🌾 **Seller Discovery** - Find verified farms and sellers near you
- 📅 **Seasonal Guide** - Get seasonal vegetables & planting advice
- 🎯 **Smart Wishlist** - Save items with price alerts & notifications
- 🛒 **Instant Orders** - Buy with pay later option, flexible payment
- 📦 **Order Tracking** - Real-time status updates & delivery info
- 💰 **Payment Help** - UPI guidance & troubleshooting support

I have access to real-time data and can help you discover, buy, and track everything!

**Try asking: "Find organic farmers near me" or "What vegetables are in season?"**`,
  });

  const [messages, setMessages] = useState([getWelcomeMessage(false)]);

  // Shopping functionality state
  const [productResults, setProductResults] = useState([]);
  const [orderTracking, setOrderTracking] = useState(null);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch complete user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          console.log("🔄 Fetching complete user profile for AI chat...");
          const response = await fetch("/api/users/profile");
          if (response.ok) {
            const data = await response.json();
            console.log("✅ User profile fetched:", {
              phone: data.user?.whatsapp_number,
              location: data.user?.location,
              name: data.user?.name,
            });
            setFullUserProfile(data.user);
          } else {
            console.warn("⚠️ Failed to fetch user profile, using session data");
            setFullUserProfile(user);
          }
        } catch (error) {
          console.error("❌ Error fetching user profile:", error);
          setFullUserProfile(user);
        }
      } else {
        setFullUserProfile(user);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Update welcome message when mobile state changes
  useEffect(() => {
    setMessages((prevMessages) => {
      const newMessages = [...prevMessages];
      if (newMessages[0]?.id === "welcome") {
        newMessages[0] = getWelcomeMessage(isMobile);
      }
      return newMessages;
    });
  }, [isMobile]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Delay focus slightly to ensure the chat is fully rendered
      const timer = setTimeout(() => {
        inputRef.current.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Additional focus management for maintaining focus during conversation
  useEffect(() => {
    if (isOpen && !isLoading && inputRef.current) {
      // Ensure focus is maintained when not loading
      const timer = setTimeout(() => {
        if (
          document.activeElement !== inputRef.current &&
          !document.activeElement.classList?.contains("btn")
        ) {
          inputRef.current.focus();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isLoading, messages.length]);

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
    "🔍 Find organic farmers near me",
    "🌱 What vegetables are in season?",
    "🎯 Show my wishlist",
    "🛒 Buy 2kg tomatoes",
    "📦 Track my order",
    "💳 How to pay with UPI?",
    "🥬 Show available products",
    "📋 View all features guide",
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

  const handleQuickCommand = (command) => {
    setInputValue(command);
    // Automatically submit the command
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} };
      handleSubmitMessage(fakeEvent);
    }, 100);
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
          parts: [
            {
              text: userMessage.content,
            },
          ],
          user: fullUserProfile || user || {},
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

      // Check if response contains order confirmation (multiple formats)
      const hasOrderConfirmation =
        (aiResponse.includes("Order Confirmed!") ||
          aiResponse.includes("Order Placed Successfully!") ||
          aiResponse.includes("🎉 Order Placed Successfully!") ||
          aiResponse.includes("🎉 **Order Confirmed!**")) &&
        (aiResponse.includes("Track Your Order") ||
          aiResponse.includes("Order Details:") ||
          aiResponse.includes("Order ID:"));

      if (hasOrderConfirmation) {
        console.log("🎉 ORDER CONFIRMATION DETECTED in AI response!");
        console.log("📝 Response contains:", {
          hasOrderConfirmed: aiResponse.includes("Order Confirmed!"),
          hasOrderPlaced: aiResponse.includes("Order Placed Successfully!"),
          hasEmojiOrder: aiResponse.includes("🎉 Order Placed Successfully!"),
          hasEmojiOrderConfirmed: aiResponse.includes(
            "🎉 **Order Confirmed!**"
          ),
          hasTrackOrder: aiResponse.includes("Track Your Order"),
          hasOrderDetails: aiResponse.includes("Order Details:"),
          hasOrderId: aiResponse.includes("Order ID:"),
        });

        // Show success toast
        toastService.success("Order placed successfully via AI!");

        // Dispatch events to refresh orders lists AND vegetables list
        if (typeof window !== "undefined") {
          console.log(
            "🔄 Dispatching AI order events for inventory refresh..."
          );
          window.dispatchEvent(new CustomEvent("ai-order-created"));
          window.dispatchEvent(new CustomEvent("order-created"));
          console.log("✅ Events dispatched: ai-order-created, order-created");

          // Also dispatch event to refresh product list (for quantity updates)
          window.dispatchEvent(new CustomEvent("products-updated"));
          console.log("✅ Products refresh event dispatched");
        }
      } else {
        // Debug: Log if no order confirmation detected
        console.log("ℹ️ No order confirmation detected in response");
        console.log(
          "📝 Response preview:",
          aiResponse.substring(0, 200) + "..."
        );
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

      // Refocus input after AI response is complete
      setTimeout(() => {
        if (
          inputRef.current &&
          !document.activeElement.classList?.contains("form-control")
        ) {
          inputRef.current.focus();
        }
      }, 300);
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

      // Refocus the input after sending message - multiple attempts for reliability
      const refocusInput = () => {
        if (
          inputRef.current &&
          !document.activeElement.classList?.contains("form-control")
        ) {
          inputRef.current.focus();
        }
      };

      // Initial refocus
      setTimeout(refocusInput, 200);
      // Secondary refocus in case DOM updates interfere
      setTimeout(refocusInput, 800);
      // Final refocus after potential streaming updates
      setTimeout(refocusInput, 2000);
    }
  };

  const handleQuickAction = (action) => {
    if (action === "🛒 View my cart") {
      handleViewCart();
    } else if (action === "📋 View all features guide") {
      // Show features guide as a message
      const featuresGuide = {
        id: Date.now().toString(),
        role: "assistant",
        content: `🤖 **Complete AI Chat Features Guide**

**🚀 7 Powerful Features Available:**

**🔍 Smart Product Search**
- "Find organic tomatoes under ₹50"
- "Show vegetables in Delhi"
- "Search for onions near me"

**🌾 Seller Discovery** 
- "Find organic farmers near me"
- "Show sellers within 5km"
- "Who sells tomatoes in my area?"

**📅 Seasonal Assistant**
- "What vegetables are in season now?"
- "What should I plant this month?"
- "Best vegetables for winter"

**🎯 Smart Wishlist**
- "Add organic tomatoes to my wishlist"
- "Show my wishlist"
- "Remove onions from wishlist"

**🛒 Instant Orders (Pay Later)**
- "Buy 2kg tomatoes"
- "Order organic onions"
- "I want to buy carrots"

**📦 Order Tracking**
- "Track my order #ABC123"
- "Check my recent orders"
- "What's my order status?"

**💰 Payment Help**
- "How do I pay with UPI?"
- "Payment failed, what to do?"
- "Which UPI apps work?"

**💡 Pro Tips:**
- Be specific with location and budget
- Use natural language - I understand context
- Try the quick actions above for instant access

**Just type your question naturally - I'm here to help! 🌱**`,
        type: "text",
      };
      setMessages((prev) => [...prev, featuresGuide]);
    } else {
      sendMessage(action);
    }

    // Refocus the input after quick action - multiple attempts for reliability
    const refocusInput = () => {
      if (
        inputRef.current &&
        !document.activeElement.classList?.contains("form-control")
      ) {
        inputRef.current.focus();
      }
    };

    setTimeout(refocusInput, 200);
    setTimeout(refocusInput, 800);
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

        /* Mobile safe area styles */
        @media (max-width: 768px) {
          .ai-chat-container {
            max-height: calc(100vh - 200px);
            max-width: calc(100vw - 24px);
          }
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

        /* AI Chat Button Base Styles */
        .ai-chat-button {
          position: fixed !important;
          bottom: 24px !important;
          right: 24px !important;
          width: 72px !important;
          height: 72px !important;
          border-radius: 50% !important;
          z-index: 9999 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: all 0.2s ease !important;
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

        /* Mobile-specific styles */
        @media (max-width: 768px) {
          .ai-chat-icon {
            font-size: 20px !important;
          }

          .ai-chat-button {
            bottom: 20px !important;
            right: 20px !important;
            width: 56px !important;
            height: 56px !important;
          }
        }
      `}</style>
      {/* Floating Chat Button - Hide on mobile when chat is open */}
      {!(isMobile && isOpen) && (
        <button
          type="button"
          className="btn btn-outline-success ai-chat-button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close chat" : "Open chat"}
        >
          <span className="ai-chat-icon">{isOpen ? "✕" : "✨"}</span>
        </button>
      )}

      <style jsx>{`
        .ai-chat-button {
          position: fixed !important;
          bottom: ${isMobile ? "30px" : "24px"} !important;
          right: ${isMobile ? "20px" : "24px"} !important;
          width: ${isMobile ? "60px" : "72px"} !important;
          height: ${isMobile ? "60px" : "72px"} !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 9999 !important;
          border: 2px solid #28a745 !important;
          background: white !important;
          color: #28a745 !important;
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4) !important;
          transition: all 0.3s ease !important;
          transform-origin: center !important;
        }

        .ai-chat-button:hover {
          transform: ${isMobile ? "none" : "scale(1.05)"} !important;
          background: #28a745 !important;
          color: white !important;
        }

        .ai-chat-icon {
          font-size: ${isMobile ? "24px" : "28px"};
          line-height: 1;
          transition: transform 0.3s ease;
          display: inline-block;
        }

        /* Rotate X icon when chat is open */
        .ai-chat-button[aria-label="Close chat"] .ai-chat-icon {
          transform: rotate(180deg);
        }

        @media (max-width: 768px) {
          .ai-chat-button {
            width: 56px !important;
            height: 56px !important;
            bottom: 20px !important;
            right: 20px !important;
          }

          .ai-chat-icon {
            font-size: 24px;
          }
        }
      `}</style>

      {/* Chat Interface */}
      {isOpen && (
        <Card
          className={`position-fixed d-flex flex-column ${
            isMobile ? "ai-chat-container" : ""
          }`}
          style={{
            bottom: isMobile ? "120px" : "90px", // More space from bottom on mobile
            right: isMobile ? "12px" : "20px",
            left: isMobile ? "12px" : "auto",
            top: isMobile ? "120px" : "auto", // More space from top on mobile
            width: isMobile ? "auto" : "min(550px, 40vw)",
            maxWidth: isMobile ? "none" : "550px",
            height: isMinimized ? "auto" : isMobile ? "auto" : "600px", // Auto height when minimized or on mobile, constrained by top/bottom
            maxHeight: isMinimized
              ? "120px"
              : isMobile
              ? "calc(100vh - 250px)"
              : "600px", // Smaller max height when minimized
            zIndex: 1050,
            boxShadow:
              "0 25px 80px rgba(0,0,0,0.25), 0 10px 40px rgba(0,0,0,0.15)",
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
              padding: isMobile ? "12px 16px" : "14px 20px",
              zIndex: 20, // Ensure header stays above content
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

              <div
                className={`d-flex align-items-center ${
                  isMobile ? "gap-1" : "gap-2"
                }`}
              >
                {/* Help/Quick Actions Button */}
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 position-relative quick-actions-button"
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  style={{
                    color: showQuickActions ? "#28a745" : "#6c757d",
                    fontSize: isMobile ? "16px" : "18px",
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                    width: isMobile ? "28px" : "32px",
                    height: isMobile ? "28px" : "32px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: isMobile ? "28px" : "32px", // Prevent shrinking
                  }}
                  onMouseEnter={(e) => {
                    if (!isMobile) {
                      e.target.style.backgroundColor = "#e9ecef";
                      e.target.style.color = "#495057";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isMobile) {
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.color = showQuickActions
                        ? "#28a745"
                        : "#6c757d";
                    }
                  }}
                >
                  💡
                </Button>

                {/* Minimize Button */}
                <Button
                  variant="link"
                  size="sm"
                  className="p-0"
                  onClick={() => setIsMinimized(!isMinimized)}
                  style={{
                    color: "#6c757d",
                    fontSize: isMobile ? "16px" : "18px",
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                    width: isMobile ? "28px" : "32px",
                    height: isMobile ? "28px" : "32px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: isMobile ? "28px" : "32px", // Prevent shrinking
                  }}
                  onMouseEnter={(e) => {
                    if (!isMobile) {
                      e.target.style.backgroundColor = "#e9ecef";
                      e.target.style.color = "#495057";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isMobile) {
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.color = "#6c757d";
                    }
                  }}
                >
                  {isMinimized ? "📤" : "📥"}
                </Button>

                {/* Close Button */}
                <Button
                  variant="link"
                  size="sm"
                  className="p-0"
                  onClick={() => setIsOpen(false)}
                  style={{
                    color: "#6c757d",
                    fontSize: isMobile ? "18px" : "20px",
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                    width: isMobile ? "28px" : "32px",
                    height: isMobile ? "28px" : "32px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: isMobile ? "28px" : "32px", // Prevent shrinking
                  }}
                  onMouseEnter={(e) => {
                    if (!isMobile) {
                      e.target.style.backgroundColor = "#e9ecef";
                      e.target.style.color = "#495057";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isMobile) {
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.color = "#6c757d";
                    }
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
                    🚀 Enhanced AI Features
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

          {/* Minimized state - only show when minimized */}
          {isMinimized ? (
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                padding: isMobile ? "8px 16px" : "12px 20px",
                background: "linear-gradient(135deg, #f8f9fa, #ffffff)",
                borderTop: "2px solid #e9ecef",
              }}
            >
              <span
                className="text-muted"
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Chat minimized - Click 📤 to expand
              </span>
            </div>
          ) : (
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
                  zIndex: 15, // Below header and input, above content
                  position: "relative",
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
                          color:
                            message.role === "user" ? "#ffffff" : "#1a1a1a",
                          fontWeight: message.role === "user" ? "500" : "400",
                        }}
                      >
                        {message.role === "assistant" ? (
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => (
                                <p style={{ margin: "0 0 8px 0" }}>
                                  {children}
                                </p>
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
                                  style={{
                                    margin: "8px 0",
                                    paddingLeft: "20px",
                                  }}
                                >
                                  {children}
                                </ol>
                              ),
                              li: ({ children }) => (
                                <li style={{ margin: "2px 0" }}>{children}</li>
                              ),
                              strong: ({ children }) => (
                                <strong
                                  style={{
                                    fontWeight: "600",
                                    color: "#2d5a3d",
                                  }}
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
                  padding: isMobile
                    ? "12px 16px 20px 16px"
                    : "16px 20px 20px 20px",
                  boxShadow: "0 -4px 12px rgba(0,0,0,0.05)",
                  position: "relative",
                  zIndex: 30, // Higher z-index to prevent overlapping with header
                }}
              >
                <Form onSubmit={handleSubmitMessage}>
                  <div
                    className="d-flex align-items-end"
                    style={{
                      background: "#ffffff",
                      borderRadius: isMobile ? "20px" : "24px",
                      padding: isMobile ? "6px" : "6px",
                      border: "2px solid #e9ecef",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      gap: isMobile ? "8px" : "12px",
                      minHeight: isMobile ? "50px" : "52px", // Ensure minimum height
                      position: "relative",
                      zIndex: 5, // Ensure it stays above other content
                    }}
                  >
                    <Form.Control
                      as="textarea"
                      ref={inputRef}
                      placeholder={
                        isMobile
                          ? "Type message..."
                          : "Type your message here..."
                      }
                      value={inputValue}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      name="message"
                      rows="1"
                      style={{
                        border: "none",
                        background: "transparent",
                        resize: "none",
                        fontSize: isMobile ? "14px" : "15px",
                        lineHeight: "1.4",
                        padding: isMobile ? "10px 12px" : "12px 16px",
                        maxHeight: isMobile ? "80px" : "100px",
                        minHeight: "20px",
                        outline: "none",
                        boxShadow: "none",
                        flex: "1", // Take available space
                      }}
                      onFocus={(e) => {
                        e.target.style.outline = "none";
                        e.target.style.boxShadow = "none";
                        // Scroll input into view on mobile only if manually focused
                        if (isMobile && document.activeElement === e.target) {
                          setTimeout(() => {
                            e.target.scrollIntoView({
                              behavior: "smooth",
                              block: "nearest",
                            });
                          }, 200);
                        }
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
                          Math.min(e.target.scrollHeight, isMobile ? 80 : 100) +
                          "px";
                      }}
                    />
                    <Button
                      type="submit"
                      disabled={isLoading || !inputValue.trim()}
                      style={{
                        minWidth: isMobile ? "42px" : "44px",
                        width: isMobile ? "42px" : "44px",
                        height: isMobile ? "42px" : "44px",
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
                        fontSize: isMobile ? "14px" : "16px",
                        margin: isMobile ? "1px" : "2px",
                        flexShrink: 0, // Prevent shrinking
                        alignSelf: "center", // Center vertically within container
                      }}
                      onMouseEnter={(e) => {
                        if (!isLoading && inputValue.trim() && !isMobile) {
                          e.target.style.transform = "scale(1.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isLoading && inputValue.trim() && !isMobile) {
                          e.target.style.transform = "scale(1)";
                        }
                      }}
                    >
                      {isLoading ? (
                        <div
                          className="spinner-border spinner-border-sm text-white"
                          style={{
                            width: isMobile ? "14px" : "16px",
                            height: isMobile ? "14px" : "16px",
                          }}
                        ></div>
                      ) : (
                        "🚀"
                      )}
                    </Button>
                  </div>
                </Form>
              </div>
            </div>
          )}
        </Card>
      )}
    </>
  );
}
