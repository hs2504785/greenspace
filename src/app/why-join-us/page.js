"use client";

import { Container, Row, Col, Card, Button, Badge } from "react-bootstrap";
import Link from "next/link";
import { useState } from "react";

export default function WhyJoinUsPage() {
  const [activeTab, setActiveTab] = useState("community");

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
    <Container className="py-5">
      {/* Hero Section */}
      <Row className="mb-5">
        <Col lg={8} className="mx-auto text-center">
          <h1 className="display-4 fw-bold text-success mb-4">
            🌱 Why Join Arya Natural Farms?
          </h1>
          <p className="lead text-muted mb-4">
            Join our thriving community of garden enthusiasts, natural farmers,
            and conscious consumers building a sustainable local food ecosystem
            together.
          </p>
          <div className="d-flex flex-wrap justify-content-center gap-3 mb-4">
            <Badge bg="success" className="fs-6 px-3 py-2">
              <i className="bi bi-people me-2"></i>
              Community Driven
            </Badge>
            <Badge bg="info" className="fs-6 px-3 py-2">
              <i className="bi bi-robot me-2"></i>
              AI Powered
            </Badge>
            <Badge bg="warning" className="fs-6 px-3 py-2">
              <i className="bi bi-geo-alt me-2"></i>
              Location Based
            </Badge>
            <Badge bg="primary" className="fs-6 px-3 py-2">
              <i className="bi bi-shield-check me-2"></i>
              Quality Assured
            </Badge>
          </div>
        </Col>
      </Row>

      {/* Tab Navigation */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-center">
            <div className="btn-group" role="group">
              <button
                type="button"
                className={`btn ${
                  activeTab === "community"
                    ? "btn-success"
                    : "btn-outline-success"
                }`}
                onClick={() => setActiveTab("community")}
              >
                <i className="bi bi-people me-2"></i>
                For Community Members
              </button>
              <button
                type="button"
                className={`btn ${
                  activeTab === "enthusiasts"
                    ? "btn-success"
                    : "btn-outline-success"
                }`}
                onClick={() => setActiveTab("enthusiasts")}
              >
                <i className="bi bi-tree me-2"></i>
                For Garden Enthusiasts
              </button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Community Members Tab */}
      {activeTab === "community" && (
        <div>
          <Row className="mb-5">
            <Col lg={8} className="mx-auto text-center">
              <h2 className="h3 text-success mb-3">
                <i className="bi bi-people me-2"></i>
                Perfect for Community Members
              </h2>
              <p className="text-muted">
                Discover fresh, organic produce from trusted neighbors and
                connect with like-minded individuals passionate about natural
                living and sustainable food choices.
              </p>
            </Col>
          </Row>

          <Row>
            {communityFeatures.map((feature, index) => (
              <Col lg={6} className="mb-4" key={index}>
                <Card className="h-100 border-0 shadow-sm hover-shadow">
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-start mb-3">
                      <div className="me-3" style={{ fontSize: "2.5rem" }}>
                        {feature.icon}
                      </div>
                      <div className="flex-grow-1">
                        <h5 className="card-title text-success mb-2">
                          {feature.title}
                        </h5>
                        <p className="text-muted mb-3">{feature.description}</p>
                        <div className="d-flex flex-wrap gap-1">
                          {feature.benefits.map((benefit, idx) => (
                            <Badge
                              key={idx}
                              bg="light"
                              text="success"
                              className="border border-success"
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
        <div>
          <Row className="mb-5">
            <Col lg={8} className="mx-auto text-center">
              <h2 className="h3 text-success mb-3">
                <i className="bi bi-tree me-2"></i>
                Perfect for Garden Enthusiasts
              </h2>
              <p className="text-muted">
                Whether you're a home gardener with surplus harvest or a
                dedicated natural farmer, our platform provides all the tools
                you need to share your passion and grow your impact.
              </p>
            </Col>
          </Row>

          <Row>
            {gardenEnthusiastFeatures.map((feature, index) => (
              <Col lg={6} className="mb-4" key={index}>
                <Card className="h-100 border-0 shadow-sm hover-shadow">
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-start mb-3">
                      <div className="me-3" style={{ fontSize: "2.5rem" }}>
                        {feature.icon}
                      </div>
                      <div className="flex-grow-1">
                        <h5 className="card-title text-success mb-2">
                          {feature.title}
                        </h5>
                        <p className="text-muted mb-3">{feature.description}</p>
                        <div className="d-flex flex-wrap gap-1">
                          {feature.benefits.map((benefit, idx) => (
                            <Badge
                              key={idx}
                              bg="light"
                              text="success"
                              className="border border-success"
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
              <Card className="border-success bg-light">
                <Card.Body className="p-4">
                  <Row className="align-items-center">
                    <Col md={8}>
                      <h4 className="text-success mb-3">
                        <i className="bi bi-grid-3x3 me-2"></i>
                        Advanced Farm Management System
                      </h4>
                      <p className="mb-3">
                        Our comprehensive farm management system supports both
                        uniform 24x24 ft grids and variable width
                        configurations. Plan your farm layout systematically
                        with precision grid lines, track tree positions, and
                        manage expansion with interactive controls.
                      </p>
                      <ul className="list-unstyled mb-0">
                        <li className="mb-2">
                          <i className="bi bi-check-circle-fill text-success me-2"></i>
                          Interactive grid system with 1ft precision
                        </li>
                        <li className="mb-2">
                          <i className="bi bi-check-circle-fill text-success me-2"></i>
                          Tree positioning and growth tracking
                        </li>
                        <li className="mb-2">
                          <i className="bi bi-check-circle-fill text-success me-2"></i>
                          Comprehensive care logging and history
                        </li>
                        <li>
                          <i className="bi bi-check-circle-fill text-success me-2"></i>
                          Visual layout planning and expansion tools
                        </li>
                      </ul>
                    </Col>
                    <Col md={4} className="text-center">
                      <div className="bg-white rounded p-3 shadow-sm">
                        <div className="display-1 text-success mb-2">🌳</div>
                        <h6 className="text-success">Farm Dashboard</h6>
                        <p className="small text-muted mb-0">
                          Complete farm visualization and management
                        </p>
                      </div>
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
          <Row>
            {platformBenefits.map((benefit, index) => (
              <Col md={6} lg={3} className="mb-4" key={index}>
                <Card className="text-center border-0 bg-light h-100">
                  <Card.Body className="p-4">
                    <div className="mb-3" style={{ fontSize: "3rem" }}>
                      {benefit.icon}
                    </div>
                    <h6 className="text-success mb-2">{benefit.title}</h6>
                    <p className="small text-muted mb-0">
                      {benefit.description}
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>

      {/* WhatsApp Community Section */}
      <Row className="mt-5">
        <Col lg={10} className="mx-auto">
          <Card className="border-success">
            <Card.Body className="p-4">
              <Row className="align-items-center">
                <Col md={8}>
                  <div className="d-flex align-items-center mb-3">
                    <div className="me-3" style={{ fontSize: "3rem" }}>
                      💬
                    </div>
                    <div>
                      <h4 className="text-success mb-1">
                        Join Our WhatsApp Community
                      </h4>
                      <h6 className="text-muted mb-0">
                        🌿 Fresh & Natural Network
                      </h6>
                    </div>
                  </div>
                  <p className="text-muted mb-3">
                    Connect instantly with fellow gardeners, get real-time
                    updates on fresh produce, share farming tips, and be the
                    first to know about seasonal availability. Our WhatsApp
                    community is where the magic happens!
                  </p>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <Badge
                      bg="light"
                      text="success"
                      className="border border-success"
                    >
                      <i className="bi bi-lightning me-1"></i>
                      Instant Updates
                    </Badge>
                    <Badge
                      bg="light"
                      text="success"
                      className="border border-success"
                    >
                      <i className="bi bi-chat-dots me-1"></i>
                      Direct Chat
                    </Badge>
                    <Badge
                      bg="light"
                      text="success"
                      className="border border-success"
                    >
                      <i className="bi bi-bell me-1"></i>
                      Fresh Alerts
                    </Badge>
                    <Badge
                      bg="light"
                      text="success"
                      className="border border-success"
                    >
                      <i className="bi bi-people me-1"></i>
                      Community Tips
                    </Badge>
                  </div>
                </Col>
                <Col md={4} className="text-center">
                  <div className="bg-success text-white rounded-3 p-4 mb-3">
                    <i
                      className="bi bi-whatsapp"
                      style={{ fontSize: "3rem" }}
                    ></i>
                    <div className="mt-2">
                      <h6 className="mb-1">Active Community</h6>
                      <small>Join 500+ Members</small>
                    </div>
                  </div>
                  <Button
                    variant="success"
                    size="lg"
                    className="w-100"
                    href="https://chat.whatsapp.com/FRO1IK8oq5FIxO5LPxCjLH"
                    as="a"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="bi bi-whatsapp me-2"></i>
                    Join WhatsApp Community
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Call to Action */}
      <Row className="mt-5">
        <Col lg={8} className="mx-auto">
          <Card
            className="border-success bg-gradient"
            style={{
              background: "linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)",
            }}
          >
            <Card.Body className="text-center p-5">
              <h3 className="text-success mb-3">
                🚀 Ready to Join Our Green Revolution?
              </h3>
              <p className="lead text-dark mb-4">
                Start your journey towards sustainable living and connect with a
                community that shares your passion for natural farming and
                organic produce.
              </p>
              <div className="d-flex flex-wrap justify-content-center gap-3">
                <Link href="/login" className="btn btn-success btn-lg px-4">
                  <i className="bi bi-person-plus me-2"></i>
                  Join Platform
                </Link>
                <Button
                  variant="outline-success"
                  size="lg"
                  className="px-4"
                  href="https://chat.whatsapp.com/FRO1IK8oq5FIxO5LPxCjLH"
                  as="a"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-whatsapp me-2"></i>
                  Join WhatsApp
                </Button>
                <Link
                  href="/users"
                  className="btn btn-outline-success btn-lg px-4"
                >
                  <i className="bi bi-people me-2"></i>
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
          <Card className="border-0 bg-dark text-white">
            <Card.Body className="p-4">
              <Row className="text-center">
                <Col md={3} className="mb-3 mb-md-0">
                  <div className="h2 text-success mb-1">🌱</div>
                  <div className="h4 mb-1">100%</div>
                  <small>Natural & Organic</small>
                </Col>
                <Col md={3} className="mb-3 mb-md-0">
                  <div className="h2 text-success mb-1">🤖</div>
                  <div className="h4 mb-1">AI</div>
                  <small>Smart Assistant</small>
                </Col>
                <Col md={3} className="mb-3 mb-md-0">
                  <div className="h2 text-success mb-1">📍</div>
                  <div className="h4 mb-1">Local</div>
                  <small>Community Focus</small>
                </Col>
                <Col md={3}>
                  <div className="h2 text-success mb-1">🚫</div>
                  <div className="h4 mb-1">Zero</div>
                  <small>Market Produce</small>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
