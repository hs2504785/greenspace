"use client";

import { Container, Row, Col, Card, Button, Badge } from "react-bootstrap";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function WhyJoinUsPage() {
  const [activeTab, setActiveTab] = useState("community");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const communityFeatures = [
    {
      icon: "🛒",
      title: "Smart Shopping Experience",
      description:
        "Browse fresh, organic produce from trusted neighbors with AI-powered recommendations and instant chat support.",
      benefits: [
        "AI shopping assistant",
        "Real-time product search",
        "Instant chat with sellers",
        "Smart recommendations",
      ],
    },
    {
      icon: "📍",
      title: "Find Nearby Garden Enthusiasts",
      description:
        "Discover fellow gardeners and natural farmers in your neighborhood with our location-based community features.",
      benefits: [
        "Interactive map view",
        "Distance-based filtering",
        "Seller badges and ratings",
        "Direct contact options",
      ],
    },
    {
      icon: "📅",
      title: "Pre-booking System",
      description:
        "Reserve seasonal produce in advance and never miss out on your favorite fruits and vegetables.",
      benefits: [
        "Advance reservations",
        "Seasonal planning",
        "Guaranteed availability",
        "Flexible scheduling",
      ],
    },
    {
      icon: "💬",
      title: "Community Discussions",
      description:
        "Join conversations about natural farming, share tips, and learn from experienced gardeners.",
      benefits: [
        "Knowledge sharing",
        "Expert advice",
        "Problem solving",
        "Community support",
      ],
    },
    {
      icon: "⭐",
      title: "Quality Assurance",
      description:
        "Access verified natural and organic products with our review and rating system.",
      benefits: [
        "Seller verification",
        "Product reviews",
        "Quality ratings",
        "Trust badges",
      ],
    },
    {
      icon: "🚫",
      title: "No Market Produce Policy",
      description:
        "Strictly homegrown, natural, and organic items only - supporting authentic local farming.",
      benefits: [
        "100% homegrown",
        "No commercial produce",
        "Pesticide-free guarantee",
        "Authentic organic",
      ],
    },
  ];

  const gardenEnthusiastFeatures = [
    {
      icon: "🌱",
      title: "Easy Product Listing",
      description:
        "Showcase your garden's harvest with beautiful photos and detailed descriptions to attract local buyers.",
      benefits: [
        "Simple listing process",
        "Photo galleries",
        "Product categorization",
        "Inventory management",
      ],
    },
    {
      icon: "🌳",
      title: "Advanced Farm Management",
      description:
        "Manage your farm layout with our interactive grid system, plant trees, and track growth systematically.",
      benefits: [
        "24x24 ft grid system",
        "Variable width layouts",
        "Tree positioning",
        "Expansion controls",
        "Visual planning",
      ],
    },
    {
      icon: "📊",
      title: "Comprehensive Tree Management",
      description:
        "Track every tree's journey from planting to harvest with detailed care logs and growth history.",
      benefits: [
        "Tree care logging",
        "Growth tracking",
        "Status monitoring",
        "Activity history",
        "Health analytics",
      ],
    },
    {
      icon: "🔗",
      title: "WhatsApp Store Integration",
      description:
        "Link your existing WhatsApp catalog to reduce database dependency while maintaining platform presence.",
      benefits: [
        "External catalog linking",
        "Reduced data usage",
        "Existing customer base",
        "Flexible selling",
      ],
    },
    {
      icon: "💰",
      title: "Direct Sales & Payments",
      description:
        "Sell directly to customers with secure UPI payments and real-time order tracking.",
      benefits: [
        "No intermediaries",
        "UPI integration",
        "Order management",
        "Payment tracking",
      ],
    },
    {
      icon: "📈",
      title: "Analytics & Insights",
      description:
        "Track your sales performance, customer engagement, and community growth with detailed analytics.",
      benefits: [
        "Sales tracking",
        "Customer insights",
        "Performance metrics",
        "Growth analytics",
      ],
    },
  ];

  const platformBenefits = [
    {
      icon: "🌍",
      title: "Environmental Impact",
      description:
        "Reduce carbon footprint by supporting local food systems and sustainable farming practices.",
    },
    {
      icon: "🤝",
      title: "Community Building",
      description:
        "Strengthen local food networks and build lasting relationships with neighbors.",
    },
    {
      icon: "💚",
      title: "Health & Wellness",
      description:
        "Access to fresh, pesticide-free produce directly from trusted local sources.",
    },
    {
      icon: "🎓",
      title: "Learning & Growth",
      description:
        "Continuous learning from experienced gardeners and farming experts in your area.",
    },
  ];

  return (
    <Container fluid className="px-0">
      <Container
        className="py-2"
        role="main"
        aria-label="Why Join Arya Natural Farms content"
      >
        {/* Hero Section */}
        <Row className="mb-3">
          <Col lg={10} xl={8} className="mx-auto text-center px-3 px-md-4">
            <div className="hero-content animate-fade-in">
              <h1 className="display-1 fw-bold text-success mb-3">
                🌱 Why Join Arya Natural Farms?
              </h1>
              <p className="lead text-muted mb-3 px-2">
                Join our thriving community of garden enthusiasts, natural
                farmers, and conscious consumers building a sustainable local
                food ecosystem together.
              </p>
              <div className="d-flex flex-wrap justify-content-center gap-2 gap-md-3 mb-3">
                <Badge bg="success" className="fs-6 px-3 py-2 badge-hover">
                  <i className="bi bi-people me-2"></i>
                  Community Driven
                </Badge>
                <Badge bg="info" className="fs-6 px-3 py-2 badge-hover">
                  <i className="bi bi-robot me-2"></i>
                  AI Powered
                </Badge>
                <Badge bg="warning" className="fs-6 px-3 py-2 badge-hover">
                  <i className="bi bi-geo-alt me-2"></i>
                  Location Based
                </Badge>
                <Badge bg="primary" className="fs-6 px-3 py-2 badge-hover">
                  <i className="bi bi-shield-check me-2"></i>
                  Quality Assured
                </Badge>
              </div>
            </div>
          </Col>
        </Row>

        {/* Tab Navigation */}
        <Row className="mb-3">
          <Col>
            <div className="d-flex justify-content-center px-3">
              <div
                className={`${
                  isMobile ? "d-flex flex-column gap-2 w-100" : "btn-group"
                }`}
                role="group"
                aria-label="Content tabs"
              >
                <button
                  type="button"
                  className={`btn ${
                    activeTab === "community"
                      ? "btn-success"
                      : "btn-outline-success"
                  } ${isMobile ? "w-100 py-3" : ""} tab-button`}
                  onClick={() => setActiveTab("community")}
                  aria-pressed={activeTab === "community"}
                  aria-describedby="community-tab-desc"
                >
                  <i className="bi bi-people me-2"></i>
                  {isMobile ? "Community Members" : "For Community Members"}
                </button>
                <button
                  type="button"
                  className={`btn ${
                    activeTab === "enthusiasts"
                      ? "btn-success"
                      : "btn-outline-success"
                  } ${isMobile ? "w-100 py-3" : ""} tab-button`}
                  onClick={() => setActiveTab("enthusiasts")}
                  aria-pressed={activeTab === "enthusiasts"}
                  aria-describedby="enthusiasts-tab-desc"
                >
                  <i className="bi bi-tree me-2"></i>
                  {isMobile ? "Garden Enthusiasts" : "For Garden Enthusiasts"}
                </button>
              </div>
            </div>
            {/* Hidden descriptions for accessibility */}
            <div id="community-tab-desc" className="visually-hidden">
              Features and benefits for community members who want to buy fresh
              produce
            </div>
            <div id="enthusiasts-tab-desc" className="visually-hidden">
              Features and benefits for garden enthusiasts who want to sell
              their produce
            </div>
          </Col>
        </Row>

        {/* Community Members Tab */}
        {activeTab === "community" && (
          <div className="tab-content animate-slide-in">
            <Row className="mb-5">
              <Col lg={10} xl={8} className="mx-auto text-center px-3">
                <h2 className="h3 text-success mb-3">
                  <i className="bi bi-people me-2"></i>
                  Perfect for Community Members
                </h2>
                <p className="text-muted px-2">
                  Discover fresh, organic produce from trusted neighbors and
                  connect with like-minded individuals passionate about natural
                  living and sustainable food choices.
                </p>
              </Col>
            </Row>

            <Row className="g-3 g-md-4">
              {communityFeatures.map((feature, index) => (
                <Col xs={12} md={6} lg={6} className="mb-3 mb-md-4" key={index}>
                  <Card
                    className="h-100 border-0 shadow-sm hover-shadow feature-card"
                    style={{
                      transition: "all 0.3s ease",
                      animationDelay: `${index * 0.1}s`,
                    }}
                  >
                    <Card.Body className={`${isMobile ? "p-3" : "p-4"}`}>
                      <div
                        className={`d-flex ${
                          isMobile
                            ? "flex-column text-center"
                            : "align-items-start"
                        } mb-3`}
                      >
                        <div
                          className={`${isMobile ? "mb-2" : "me-3"}`}
                          style={{ fontSize: isMobile ? "2rem" : "2.5rem" }}
                        >
                          {feature.icon}
                        </div>
                        <div className="flex-grow-1">
                          <h5
                            className={`card-title text-success mb-2 ${
                              isMobile ? "fs-6" : ""
                            }`}
                          >
                            {feature.title}
                          </h5>
                          <p
                            className={`text-muted mb-3 ${
                              isMobile ? "small" : ""
                            }`}
                          >
                            {feature.description}
                          </p>
                          <div className="d-flex flex-wrap gap-2 justify-content-center justify-content-md-start">
                            {feature.benefits.map((benefit, idx) => (
                              <Badge
                                key={idx}
                                className={`bg-light text-muted border-0 rounded-pill fw-normal benefit-badge ${
                                  isMobile ? "px-2 py-1" : "px-3 py-2"
                                }`}
                                style={{
                                  fontSize: isMobile ? "0.65rem" : "0.75rem",
                                  backgroundColor: "#f8f9fa !important",
                                  color: "#6c757d !important",
                                  transition: "all 0.2s ease",
                                  cursor: "default",
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = "#e9ecef";
                                  e.target.style.color = "#495057";
                                  e.target.style.transform = "translateY(-1px)";
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = "#f8f9fa";
                                  e.target.style.color = "#6c757d";
                                  e.target.style.transform = "translateY(0)";
                                }}
                              >
                                {benefit}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {/* Garden Enthusiasts Tab */}
        {activeTab === "enthusiasts" && (
          <div className="tab-content animate-slide-in">
            <Row className="mb-5">
              <Col lg={10} xl={8} className="mx-auto text-center px-3">
                <h2 className="h3 text-success mb-3">
                  <i className="bi bi-tree me-2"></i>
                  Perfect for Garden Enthusiasts
                </h2>
                <p className="text-muted px-2">
                  Whether you're a home gardener with surplus harvest or a
                  dedicated natural farmer, our platform provides all the tools
                  you need to share your passion and grow your impact.
                </p>
              </Col>
            </Row>

            <Row className="g-3 g-md-4">
              {gardenEnthusiastFeatures.map((feature, index) => (
                <Col xs={12} md={6} lg={6} className="mb-3 mb-md-4" key={index}>
                  <Card
                    className="h-100 border-0 shadow-sm hover-shadow feature-card"
                    style={{
                      transition: "all 0.3s ease",
                      animationDelay: `${index * 0.1}s`,
                    }}
                  >
                    <Card.Body className={`${isMobile ? "p-3" : "p-4"}`}>
                      <div
                        className={`d-flex ${
                          isMobile
                            ? "flex-column text-center"
                            : "align-items-start"
                        } mb-3`}
                      >
                        <div
                          className={`${isMobile ? "mb-2" : "me-3"}`}
                          style={{ fontSize: isMobile ? "2rem" : "2.5rem" }}
                        >
                          {feature.icon}
                        </div>
                        <div className="flex-grow-1">
                          <h5
                            className={`card-title text-success mb-2 ${
                              isMobile ? "fs-6" : ""
                            }`}
                          >
                            {feature.title}
                          </h5>
                          <p
                            className={`text-muted mb-3 ${
                              isMobile ? "small" : ""
                            }`}
                          >
                            {feature.description}
                          </p>
                          <div className="d-flex flex-wrap gap-2 justify-content-center justify-content-md-start">
                            {feature.benefits.map((benefit, idx) => (
                              <Badge
                                key={idx}
                                className={`bg-light text-muted border-0 rounded-pill fw-normal benefit-badge ${
                                  isMobile ? "px-2 py-1" : "px-3 py-2"
                                }`}
                                style={{
                                  fontSize: isMobile ? "0.65rem" : "0.75rem",
                                  backgroundColor: "#f8f9fa !important",
                                  color: "#6c757d !important",
                                  transition: "all 0.2s ease",
                                  cursor: "default",
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = "#e9ecef";
                                  e.target.style.color = "#495057";
                                  e.target.style.transform = "translateY(-1px)";
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = "#f8f9fa";
                                  e.target.style.color = "#6c757d";
                                  e.target.style.transform = "translateY(0)";
                                }}
                              >
                                {benefit}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Farm Management Highlight */}
            <Row className="mt-5">
              <Col>
                <Card
                  className="border-0 shadow-lg overflow-hidden farm-highlight-card"
                  style={{
                    background:
                      "linear-gradient(135deg, #f8fff9 0%, #e8f5e9 100%)",
                  }}
                >
                  <Card.Body className={`${isMobile ? "p-3" : "p-5"}`}>
                    <Row className="align-items-center">
                      <Col lg={8}>
                        <div className="mb-4">
                          <div
                            className={`d-flex ${
                              isMobile
                                ? "flex-column text-center"
                                : "align-items-center"
                            } mb-3`}
                          >
                            <div
                              className={`${isMobile ? "mb-2" : "me-3"}`}
                              style={{ fontSize: isMobile ? "2.5rem" : "3rem" }}
                            >
                              🌳
                            </div>
                            <div>
                              <h3
                                className={`text-success mb-1 fw-bold ${
                                  isMobile ? "h5" : ""
                                }`}
                              >
                                Advanced Farm Management System
                              </h3>
                              <p
                                className={`text-muted mb-0 ${
                                  isMobile ? "small" : "small"
                                }`}
                              >
                                Precision agriculture at your fingertips
                              </p>
                            </div>
                          </div>

                          <p
                            className={`text-dark mb-4 ${
                              isMobile ? "small" : "fs-6"
                            } ${isMobile ? "text-center" : ""}`}
                          >
                            Our comprehensive farm management system supports
                            both uniform 24x24 ft grids and variable width
                            configurations. Plan your farm layout systematically
                            with precision grid lines, track tree positions, and
                            manage expansion with interactive controls.
                          </p>
                        </div>

                        <Row className={`${isMobile ? "g-2" : "g-3"}`}>
                          <Col xs={6} sm={6}>
                            <div
                              className={`d-flex align-items-start bg-white rounded-3 shadow-sm h-100 ${
                                isMobile ? "p-2" : "p-3"
                              }`}
                            >
                              <div
                                className="text-success me-2 me-md-3"
                                style={{
                                  fontSize: isMobile ? "1rem" : "1.25rem",
                                }}
                              >
                                <i className="bi bi-grid"></i>
                              </div>
                              <div>
                                <h6
                                  className={`mb-1 text-dark ${
                                    isMobile ? "small" : ""
                                  }`}
                                >
                                  Interactive Grid System
                                </h6>
                                <small className="text-muted">
                                  1ft precision mapping
                                </small>
                              </div>
                            </div>
                          </Col>
                          <Col xs={6} sm={6}>
                            <div
                              className={`d-flex align-items-start bg-white rounded-3 shadow-sm h-100 ${
                                isMobile ? "p-2" : "p-3"
                              }`}
                            >
                              <div
                                className="text-success me-2 me-md-3"
                                style={{
                                  fontSize: isMobile ? "1rem" : "1.25rem",
                                }}
                              >
                                <i className="bi bi-geo-alt"></i>
                              </div>
                              <div>
                                <h6
                                  className={`mb-1 text-dark ${
                                    isMobile ? "small" : ""
                                  }`}
                                >
                                  Tree Positioning
                                </h6>
                                <small className="text-muted">
                                  Growth tracking & monitoring
                                </small>
                              </div>
                            </div>
                          </Col>
                          <Col xs={6} sm={6}>
                            <div
                              className={`d-flex align-items-start bg-white rounded-3 shadow-sm h-100 ${
                                isMobile ? "p-2" : "p-3"
                              }`}
                            >
                              <div
                                className="text-success me-2 me-md-3"
                                style={{
                                  fontSize: isMobile ? "1rem" : "1.25rem",
                                }}
                              >
                                <i className="bi bi-journal-text"></i>
                              </div>
                              <div>
                                <h6
                                  className={`mb-1 text-dark ${
                                    isMobile ? "small" : ""
                                  }`}
                                >
                                  Care Logging
                                </h6>
                                <small className="text-muted">
                                  Comprehensive history
                                </small>
                              </div>
                            </div>
                          </Col>
                          <Col xs={6} sm={6}>
                            <div
                              className={`d-flex align-items-start bg-white rounded-3 shadow-sm h-100 ${
                                isMobile ? "p-2" : "p-3"
                              }`}
                            >
                              <div
                                className="text-success me-2 me-md-3"
                                style={{
                                  fontSize: isMobile ? "1rem" : "1.25rem",
                                }}
                              >
                                <i className="bi bi-tools"></i>
                              </div>
                              <div>
                                <h6
                                  className={`mb-1 text-dark ${
                                    isMobile ? "small" : ""
                                  }`}
                                >
                                  Layout Planning
                                </h6>
                                <small className="text-muted">
                                  Visual expansion tools
                                </small>
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </Col>

                      <Col
                        lg={4}
                        className={`text-center ${isMobile ? "mt-4" : ""}`}
                      >
                        <Link
                          href="/farm-dashboard"
                          className="text-decoration-none"
                        >
                          <div
                            className={`bg-white rounded-4 shadow-lg position-relative farm-dashboard-link ${
                              isMobile ? "p-3" : "p-4"
                            }`}
                            style={{
                              background:
                                "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
                              border: "1px solid rgba(40, 167, 69, 0.1)",
                              cursor: "pointer",
                              transition: "all 0.3s ease",
                            }}
                            onMouseEnter={(e) => {
                              if (!isMobile) {
                                e.currentTarget.style.transform =
                                  "translateY(-5px)";
                                e.currentTarget.style.boxShadow =
                                  "0 10px 30px rgba(40, 167, 69, 0.2)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isMobile) {
                                e.currentTarget.style.transform =
                                  "translateY(0)";
                                e.currentTarget.style.boxShadow =
                                  "0 8px 25px rgba(0, 0, 0, 0.1)";
                              }
                            }}
                          >
                            <div className="position-absolute top-0 end-0 m-2 m-md-3">
                              <i
                                className="bi bi-arrow-up-right-circle text-success"
                                style={{
                                  fontSize: isMobile ? "1rem" : "1.2rem",
                                }}
                              ></i>
                            </div>

                            <div
                              className="mb-3"
                              style={{ fontSize: isMobile ? "3rem" : "4rem" }}
                            >
                              🌳
                            </div>

                            <h5
                              className={`text-success mb-2 fw-bold ${
                                isMobile ? "fs-6" : ""
                              }`}
                            >
                              Farm Dashboard
                            </h5>
                            <p
                              className={`text-muted mb-3 ${
                                isMobile ? "small" : "small"
                              }`}
                            >
                              Complete farm visualization and management
                            </p>

                            <div className="d-flex justify-content-around text-center">
                              <div>
                                <div
                                  className={`fw-bold text-success ${
                                    isMobile ? "small" : ""
                                  }`}
                                >
                                  24x24
                                </div>
                                <small className="text-muted">
                                  Grid System
                                </small>
                              </div>
                              <div>
                                <div
                                  className={`fw-bold text-success ${
                                    isMobile ? "small" : ""
                                  }`}
                                >
                                  1ft
                                </div>
                                <small className="text-muted">Precision</small>
                              </div>
                              <div>
                                <div
                                  className={`fw-bold text-success ${
                                    isMobile ? "small" : ""
                                  }`}
                                >
                                  ∞
                                </div>
                                <small className="text-muted">Scalable</small>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>
        )}

        {/* Platform Benefits */}
        <Row className="mt-5 mb-5">
          <Col>
            <h2 className="text-center text-success mb-4">
              <i className="bi bi-heart me-2"></i>
              Why Our Community Matters
            </h2>
            <Row className="g-3 g-md-4">
              {platformBenefits.map((benefit, index) => (
                <Col xs={12} md={6} lg={3} className="mb-3 mb-md-4" key={index}>
                  <Card className="text-center border-0 bg-light h-100 benefit-card">
                    <Card.Body className={`${isMobile ? "p-3" : "p-4"}`}>
                      <div
                        className="mb-3"
                        style={{ fontSize: isMobile ? "2rem" : "3rem" }}
                      >
                        {benefit.icon}
                      </div>
                      <h6
                        className={`text-success mb-2 ${
                          isMobile ? "small" : ""
                        }`}
                      >
                        {benefit.title}
                      </h6>
                      <p
                        className={`${
                          isMobile ? "small" : "small"
                        } text-muted mb-0`}
                      >
                        {benefit.description}
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>

        {/* Call to Action */}
        <Row className="mt-5">
          <Col lg={10} xl={8} className="mx-auto">
            <Card
              className="border-success bg-gradient cta-card"
              style={{
                background: "linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)",
              }}
            >
              <Card.Body className={`text-center ${isMobile ? "p-4" : "p-5"}`}>
                <h3 className={`text-success mb-3 ${isMobile ? "h5" : ""}`}>
                  🚀 Ready to Join Our Green Revolution?
                </h3>
                <p
                  className={`${
                    isMobile ? "fs-6" : "lead"
                  } text-dark mb-4 px-2`}
                >
                  Start your journey towards sustainable living and connect with
                  a community that shares your passion for natural farming and
                  organic produce.
                </p>
                <div
                  className={`d-flex ${
                    isMobile
                      ? "flex-column gap-2"
                      : "flex-wrap justify-content-center gap-3"
                  }`}
                >
                  <Link
                    href="/login"
                    className={`btn btn-success ${
                      isMobile ? "btn-md w-100 py-3" : "btn-lg px-4"
                    } cta-button`}
                    aria-label="Join the Arya Natural Farms platform"
                  >
                    <i
                      className="bi bi-person-plus me-2"
                      aria-hidden="true"
                    ></i>
                    Join Platform
                  </Link>
                  <Button
                    variant="outline-success"
                    size={isMobile ? "md" : "lg"}
                    className={`${isMobile ? "w-100 py-3" : "px-4"} cta-button`}
                    href="https://chat.whatsapp.com/FRO1IK8oq5FIxO5LPxCjLH"
                    as="a"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Join our WhatsApp community group"
                  >
                    <i className="bi bi-whatsapp me-2" aria-hidden="true"></i>
                    Join WhatsApp
                  </Button>
                  <Link
                    href="/users"
                    className={`btn btn-outline-success ${
                      isMobile ? "btn-md w-100 py-3" : "btn-lg px-4"
                    } cta-button`}
                    aria-label="Browse community members and sellers"
                  >
                    <i className="bi bi-people me-2" aria-hidden="true"></i>
                    Browse Members
                  </Link>
                </div>
                <div className="mt-4">
                  <small className="text-muted">
                    <i className="bi bi-shield-check me-1"></i>
                    100% Free to Join • No Hidden Fees • Community Driven
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Statistics */}
        <Row className="mt-5">
          <Col>
            <Card className="border-0 bg-dark text-white stats-card">
              <Card.Body className={`${isMobile ? "p-3" : "p-4"}`}>
                <Row className="text-center">
                  <Col xs={6} md={3} className="mb-3 mb-md-0">
                    <div
                      className={`${isMobile ? "h4" : "h2"} text-success mb-1`}
                    >
                      🌱
                    </div>
                    <div className={`${isMobile ? "h6" : "h4"} mb-1`}>100%</div>
                    <small>Natural & Organic</small>
                  </Col>
                  <Col xs={6} md={3} className="mb-3 mb-md-0">
                    <div
                      className={`${isMobile ? "h4" : "h2"} text-success mb-1`}
                    >
                      🤖
                    </div>
                    <div className={`${isMobile ? "h6" : "h4"} mb-1`}>AI</div>
                    <small>Smart Assistant</small>
                  </Col>
                  <Col xs={6} md={3} className="mb-3 mb-md-0">
                    <div
                      className={`${isMobile ? "h4" : "h2"} text-success mb-1`}
                    >
                      📍
                    </div>
                    <div className={`${isMobile ? "h6" : "h4"} mb-1`}>
                      Local
                    </div>
                    <small>Community Focus</small>
                  </Col>
                  <Col xs={6} md={3}>
                    <div
                      className={`${isMobile ? "h4" : "h2"} text-success mb-1`}
                    >
                      🚫
                    </div>
                    <div className={`${isMobile ? "h6" : "h4"} mb-1`}>Zero</div>
                    <small>Market Produce</small>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Container>
  );
}
