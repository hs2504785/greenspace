"use client";

import { useState } from "react";
import { Card, Button, Badge, Collapse } from "react-bootstrap";

export default function ChatHelpGuide({ onCommandClick }) {
  const [showGuide, setShowGuide] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  const features = [
    {
      id: "search",
      icon: "🔍",
      title: "Product Search",
      description: "Find vegetables and check prices",
      examples: [
        "Find organic tomatoes under ₹50",
        "Show me vegetables in Delhi",
        "Search for onions near me",
      ],
    },
    {
      id: "sellers",
      icon: "🌾",
      title: "Find Sellers",
      description: "Discover verified farms and sellers",
      examples: [
        "Find organic farmers near me",
        "Show sellers within 5km",
        "Who sells tomatoes in my area?",
      ],
    },
    {
      id: "seasonal",
      icon: "📅",
      title: "Seasonal Guide",
      description: "Get seasonal farming advice",
      examples: [
        "What vegetables are in season now?",
        "What should I plant this month?",
        "Best vegetables for winter",
      ],
    },
    {
      id: "wishlist",
      icon: "🎯",
      title: "Wishlist",
      description: "Save items and get alerts",
      examples: [
        "Add organic tomatoes to my wishlist",
        "Show my wishlist",
        "Remove onions from wishlist",
      ],
    },
    {
      id: "buy",
      icon: "🛒",
      title: "Buy with Pay Later",
      description: "Order instantly with flexible payment",
      examples: [
        "Buy 2kg tomatoes",
        "Order organic onions",
        "I want to buy carrots",
      ],
    },
    {
      id: "track",
      icon: "📦",
      title: "Order Tracking",
      description: "Track orders and delivery status",
      examples: [
        "Track my order #ABC123",
        "Check my recent orders",
        "What's my order status?",
      ],
    },
    {
      id: "payment",
      icon: "💰",
      title: "Payment Help",
      description: "UPI guidance and troubleshooting",
      examples: [
        "How do I pay with UPI?",
        "Payment failed, what to do?",
        "Which UPI apps work?",
      ],
    },
  ];

  const quickCommands = [
    { text: "What vegetables are in season?", category: "seasonal" },
    { text: "Find organic farmers near me", category: "sellers" },
    { text: "Show me fresh tomatoes", category: "search" },
    { text: "Buy 1kg onions", category: "buy" },
    { text: "Show my wishlist", category: "wishlist" },
    { text: "Track my orders", category: "track" },
    { text: "How to pay with UPI?", category: "payment" },
  ];

  const handleCommandClick = (command) => {
    onCommandClick(command);
    setShowGuide(false);
  };

  const toggleSection = (sectionId) => {
    setActiveSection(activeSection === sectionId ? null : sectionId);
  };

  return (
    <div className="chat-help-guide">
      {/* Help Toggle Button */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Button
          variant="outline-success"
          size="sm"
          onClick={() => setShowGuide(!showGuide)}
          className="d-flex align-items-center gap-2"
        >
          <i className="ti-help-alt"></i>
          {showGuide ? "Hide Guide" : "What can I ask?"}
        </Button>

        <div className="d-flex gap-1">
          <Badge bg="success" className="small">
            7 Features
          </Badge>
          <Badge bg="info" className="small">
            AI Powered
          </Badge>
        </div>
      </div>

      {/* Collapsible Help Guide */}
      <Collapse in={showGuide}>
        <div>
          <Card className="border-0 shadow-sm mb-3">
            <Card.Header className="bg-success text-white">
              <h6 className="mb-0">🤖 AI Chat Assistant - Complete Guide</h6>
            </Card.Header>
            <Card.Body className="p-3">
              {/* Quick Commands Section */}
              <div className="mb-4">
                <h6 className="text-success mb-3">⚡ Quick Commands</h6>
                <div className="d-flex flex-wrap gap-2">
                  {quickCommands.map((cmd, index) => (
                    <Button
                      key={index}
                      variant="outline-success"
                      size="sm"
                      onClick={() => handleCommandClick(cmd.text)}
                      className="text-start"
                      style={{ fontSize: "0.8rem" }}
                    >
                      {cmd.text}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Features Grid */}
              <div className="mb-4">
                <h6 className="text-success mb-3">🛠️ All Features</h6>
                <div className="row g-2">
                  {features.map((feature) => (
                    <div key={feature.id} className="col-12 col-md-6">
                      <Card
                        className="h-100 border-1 cursor-pointer hover-shadow"
                        onClick={() => toggleSection(feature.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <Card.Body className="p-3">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <span style={{ fontSize: "1.2rem" }}>
                              {feature.icon}
                            </span>
                            <strong className="small">{feature.title}</strong>
                            <i
                              className={`ti-angle-${
                                activeSection === feature.id ? "up" : "down"
                              } ms-auto`}
                            ></i>
                          </div>
                          <p className="text-muted small mb-0">
                            {feature.description}
                          </p>

                          <Collapse in={activeSection === feature.id}>
                            <div className="mt-2">
                              <div className="border-top pt-2">
                                <small className="text-success fw-bold">
                                  Try these:
                                </small>
                                {feature.examples.map((example, idx) => (
                                  <div key={idx} className="mt-1">
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="p-0 text-start text-decoration-none small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCommandClick(example);
                                      }}
                                    >
                                      "📝 {example}"
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </Collapse>
                        </Card.Body>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro Tips */}
              <div className="bg-light p-3 rounded">
                <h6 className="text-success mb-2">💡 Pro Tips</h6>
                <ul className="small mb-0 ps-3">
                  <li>
                    Be specific: "Find organic tomatoes under ₹50 in Delhi"
                  </li>
                  <li>Include location: "Sellers near Connaught Place"</li>
                  <li>Mention budget: "Onions under ₹30 per kg"</li>
                  <li>Use natural language: "I want to buy 3kg carrots"</li>
                </ul>
              </div>
            </Card.Body>
          </Card>
        </div>
      </Collapse>

      <style jsx>{`
        .hover-shadow:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important;
          transition: box-shadow 0.2s ease;
        }
        .cursor-pointer {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
