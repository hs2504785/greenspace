"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Badge,
  Button,
  Row,
  Col,
  Modal,
  Carousel,
  ProgressBar,
  ListGroup,
  OverlayTrigger,
  Tooltip,
  Alert,
} from "react-bootstrap";
import Link from "next/link";

const TRUST_BADGE_CONFIG = {
  verified_natural: {
    label: "Verified Natural",
    icon: "🌱",
    color: "success",
    description: "Farm practices verified by our team",
  },
  community_trusted: {
    label: "Community Trusted",
    icon: "⭐",
    color: "warning",
    description: "Highly rated by buyers in the community",
  },
  farm_visited: {
    label: "Farm Verified",
    icon: "🏡",
    color: "info",
    description: "Farm location and practices physically verified",
  },
  certified_organic: {
    label: "Certified Organic",
    icon: "📜",
    color: "primary",
    description: "Official organic certification",
  },
  eco_champion: {
    label: "Eco Champion",
    icon: "🌍",
    color: "success",
    description: "Outstanding commitment to sustainable practices",
  },
  premium_verified: {
    label: "Premium Seller",
    icon: "👑",
    color: "danger",
    description: "Highest level of verification and quality",
  },
};

const FARMING_METHOD_ICONS = {
  organic: "🌿",
  natural: "🌱",
  pesticide_free: "🚫",
  traditional: "🌾",
  biodynamic: "🌙",
  permaculture: "♻️",
  home_grown: "🏠",
  terrace_garden: "🏢",
};

export default function SellerTrustProfile({
  seller,
  compact = false,
  showContactButton = true,
}) {
  const [showProfile, setShowProfile] = useState(false);
  const [farmProfile, setFarmProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showProfile && seller?.id) {
      loadSellerDetails();
    }
  }, [showProfile, seller?.id]);

  const loadSellerDetails = async () => {
    setLoading(true);
    try {
      // Load farm profile, reviews, and badges
      const [profileResponse, reviewsResponse, badgesResponse] =
        await Promise.all([
          fetch(`/api/sellers/${seller.id}/profile`),
          fetch(`/api/sellers/${seller.id}/reviews`),
          fetch(`/api/sellers/${seller.id}/badges`),
        ]);

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setFarmProfile(profileData);
      }

      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData.slice(0, 5)); // Show latest 5 reviews
      }

      if (badgesResponse.ok) {
        const badgesData = await badgesResponse.json();
        setBadges(badgesData);
      }
    } catch (error) {
      console.error("Error loading seller details:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTrustScore = () => {
    // Calculate trust score based on various factors
    let score = 0;

    // Base score for being a seller
    score += 20;

    // Badges contribution
    badges.forEach((badge) => {
      switch (badge.badge_type) {
        case "verified_natural":
          score += 15;
          break;
        case "community_trusted":
          score += 20;
          break;
        case "farm_visited":
          score += 25;
          break;
        case "certified_organic":
          score += 20;
          break;
        case "premium_verified":
          score += 30;
          break;
        default:
          score += 5;
      }
    });

    // Reviews contribution
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.overall_rating, 0) /
          reviews.length
        : 0;
    score += avgRating * 4;

    // Experience contribution
    if (seller?.years_farming) {
      score += Math.min(seller.years_farming * 2, 20);
    }

    return Math.min(Math.round(score), 100);
  };

  const renderTrustBadges = () => (
    <div className="trust-badges mb-3">
      {badges.map((badge) => {
        const config = TRUST_BADGE_CONFIG[badge.badge_type] || {
          label: badge.badge_name,
          icon: "🏆",
          color: "secondary",
          description: badge.badge_description,
        };

        return (
          <OverlayTrigger
            key={badge.id}
            placement="top"
            overlay={<Tooltip>{config.description}</Tooltip>}
          >
            <Badge
              bg={config.color}
              className="me-2 mb-2 p-2"
              style={{ fontSize: "0.75rem", cursor: "help" }}
            >
              {config.icon} {config.label}
            </Badge>
          </OverlayTrigger>
        );
      })}
    </div>
  );

  const renderFarmingMethods = () => {
    if (!seller?.farming_methods) return null;

    return (
      <div className="farming-methods mb-3">
        <small className="text-muted d-block mb-1">Farming Methods:</small>
        {seller.farming_methods.map((method) => (
          <Badge key={method} bg="light" text="dark" className="me-1 mb-1">
            {FARMING_METHOD_ICONS[method] || "🌱"}{" "}
            {method.replace("_", " ").toUpperCase()}
          </Badge>
        ))}
      </div>
    );
  };

  const renderCompactView = () => (
    <Card className="seller-trust-compact">
      <Card.Body className="p-3">
        <div className="d-flex align-items-start justify-content-between">
          <div className="flex-grow-1">
            <h6 className="mb-1">
              {seller?.farm_name || seller?.business_name || seller?.name}
            </h6>
            <div className="text-muted small mb-2">
              <i className="ti ti-map-pin me-1"></i>
              {seller?.location}
            </div>

            {badges.length > 0 && (
              <div className="mb-2">
                {badges.slice(0, 2).map((badge) => {
                  const config = TRUST_BADGE_CONFIG[badge.badge_type];
                  return config ? (
                    <Badge
                      key={badge.id}
                      bg={config.color}
                      className="me-1"
                      size="sm"
                    >
                      {config.icon}
                    </Badge>
                  ) : null;
                })}
                {badges.length > 2 && (
                  <Badge bg="secondary" size="sm">
                    +{badges.length - 2}
                  </Badge>
                )}
              </div>
            )}

            <div className="d-flex align-items-center">
              <div className="trust-score-mini me-3">
                <small className="text-muted">Trust Score:</small>
                <div className="fw-bold text-success">{getTrustScore()}%</div>
              </div>

              {reviews.length > 0 && (
                <div className="rating-mini">
                  <small className="text-muted">Rating:</small>
                  <div className="d-flex align-items-center">
                    <span className="text-warning me-1">★</span>
                    <span className="fw-bold">
                      {(
                        reviews.reduce((sum, r) => sum + r.overall_rating, 0) /
                        reviews.length
                      ).toFixed(1)}
                    </span>
                    <small className="text-muted ms-1">
                      ({reviews.length})
                    </small>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-end">
            <Button
              variant="outline-success"
              size="sm"
              onClick={() => setShowProfile(true)}
            >
              View Profile
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  const renderFullProfile = () => (
    <Modal show={showProfile} onHide={() => setShowProfile(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          🌱 {farmProfile?.farm_name || seller?.business_name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Trust Score */}
            <Card className="mb-4 border-success">
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <div className="text-center">
                      <div className="trust-score-circle mb-2">
                        <div
                          className="circular-progress mx-auto"
                          style={{
                            background: `conic-gradient(#28a745 ${
                              getTrustScore() * 3.6
                            }deg, #e9ecef 0deg)`,
                            width: "80px",
                            height: "80px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <div
                            className="bg-white rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: "60px", height: "60px" }}
                          >
                            <span className="h4 mb-0 text-success">
                              {getTrustScore()}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <h6 className="text-success mb-0">Trust Score</h6>
                      <small className="text-muted">Community Verified</small>
                    </div>
                  </Col>
                  <Col md={8}>
                    <h5>Why Trust This Seller?</h5>
                    <ListGroup variant="flush">
                      {badges.length > 0 && (
                        <ListGroup.Item className="px-0 py-2">
                          <i className="ti ti-shield-check text-success me-2"></i>
                          Earned {badges.length} verification badge
                          {badges.length > 1 ? "s" : ""}
                        </ListGroup.Item>
                      )}
                      {reviews.length > 0 && (
                        <ListGroup.Item className="px-0 py-2">
                          <i className="ti ti-star text-warning me-2"></i>
                          {reviews.length} customer reviews with{" "}
                          {(
                            reviews.reduce(
                              (sum, r) => sum + r.overall_rating,
                              0
                            ) / reviews.length
                          ).toFixed(1)}
                          /5 rating
                        </ListGroup.Item>
                      )}
                      {seller?.years_farming && (
                        <ListGroup.Item className="px-0 py-2">
                          <i className="ti ti-calendar text-info me-2"></i>
                          {seller.years_farming} years of farming experience
                        </ListGroup.Item>
                      )}
                      {farmProfile?.visit_booking_enabled && (
                        <ListGroup.Item className="px-0 py-2">
                          <i className="ti ti-home text-primary me-2"></i>
                          Farm visits welcome - see farming practices firsthand
                        </ListGroup.Item>
                      )}
                    </ListGroup>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Trust Badges */}
            <Card className="mb-4">
              <Card.Header>
                <h6 className="mb-0">🏆 Verification Badges</h6>
              </Card.Header>
              <Card.Body>
                {badges.length > 0 ? (
                  renderTrustBadges()
                ) : (
                  <p className="text-muted">No verification badges yet.</p>
                )}
              </Card.Body>
            </Card>

            {/* Farm Details */}
            {farmProfile && (
              <Card className="mb-4">
                <Card.Header>
                  <h6 className="mb-0">🏡 Farm Information</h6>
                </Card.Header>
                <Card.Body>
                  {farmProfile.farm_story && (
                    <p className="mb-3">{farmProfile.farm_story}</p>
                  )}

                  <Row>
                    <Col md={6}>
                      {farmProfile.established_year && (
                        <div className="mb-2">
                          <strong>Established:</strong>{" "}
                          {farmProfile.established_year}
                        </div>
                      )}
                      {farmProfile.farm_type && (
                        <div className="mb-2">
                          <strong>Farm Type:</strong>{" "}
                          {farmProfile.farm_type.replace("_", " ")}
                        </div>
                      )}
                    </Col>
                    <Col md={6}>
                      {farmProfile.total_area_sqft && (
                        <div className="mb-2">
                          <strong>Farm Size:</strong>{" "}
                          {(farmProfile.total_area_sqft / 43560).toFixed(1)}{" "}
                          acres
                        </div>
                      )}
                      {farmProfile.farming_philosophy && (
                        <div className="mb-2">
                          <strong>Philosophy:</strong>{" "}
                          {farmProfile.farming_philosophy}
                        </div>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}

            {/* Recent Reviews */}
            {reviews.length > 0 && (
              <Card className="mb-4">
                <Card.Header>
                  <h6 className="mb-0">💬 Recent Customer Reviews</h6>
                </Card.Header>
                <Card.Body>
                  {reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="border-bottom pb-3 mb-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="d-flex align-items-center mb-1">
                            <div className="text-warning me-2">
                              {"★".repeat(review.overall_rating)}
                              {"☆".repeat(5 - review.overall_rating)}
                            </div>
                            <small className="text-muted">
                              {new Date(review.created_at).toLocaleDateString()}
                            </small>
                          </div>
                          <p className="mb-1">{review.review_text}</p>
                          {review.verified_natural && (
                            <Badge bg="success" size="sm">
                              ✓ Confirmed Natural Produce
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {reviews.length > 3 && (
                    <div className="text-center">
                      <Button variant="outline-primary" size="sm">
                        View All Reviews ({reviews.length})
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}

            {/* Contact Information */}
            {showContactButton && (
              <Card>
                <Card.Header>
                  <h6 className="mb-0">📞 Contact Information</h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      {seller?.whatsapp_number && (
                        <Button
                          variant="success"
                          className="w-100 mb-2"
                          onClick={() =>
                            window.open(
                              `https://wa.me/${seller.whatsapp_number}`,
                              "_blank"
                            )
                          }
                        >
                          <i className="ti ti-brand-whatsapp me-2"></i>
                          WhatsApp
                        </Button>
                      )}
                    </Col>
                    <Col md={6}>
                      {farmProfile?.visit_booking_enabled && (
                        <Button
                          variant="outline-primary"
                          className="w-100 mb-2"
                        >
                          <i className="ti ti-home me-2"></i>
                          Schedule Farm Visit
                        </Button>
                      )}
                    </Col>
                  </Row>

                  <div className="text-center mt-3">
                    <Link href={`/sellers/${seller.id}/products`}>
                      <Button variant="primary">
                        <i className="ti ti-leaf me-2"></i>
                        View All Products
                      </Button>
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            )}
          </>
        )}
      </Modal.Body>
    </Modal>
  );

  if (compact) {
    return (
      <>
        {renderCompactView()}
        {renderFullProfile()}
      </>
    );
  }

  // Full card view
  return (
    <Card className="seller-trust-profile h-100">
      <Card.Body>
        <div className="d-flex align-items-start justify-content-between mb-3">
          <div>
            <h5 className="mb-1">
              {seller?.farm_name || seller?.business_name}
            </h5>
            <div className="text-muted">
              <i className="ti ti-map-pin me-1"></i>
              {seller?.location}
            </div>
          </div>

          <div className="trust-score text-end">
            <div className="h4 text-success mb-0">{getTrustScore()}%</div>
            <small className="text-muted">Trust Score</small>
          </div>
        </div>

        {renderTrustBadges()}
        {renderFarmingMethods()}

        {seller?.years_farming && (
          <div className="mb-3">
            <small className="text-muted">Experience:</small>
            <div>{seller.years_farming} years in natural farming</div>
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center">
          <Button
            variant="outline-success"
            onClick={() => setShowProfile(true)}
          >
            View Full Profile
          </Button>

          {showContactButton && seller?.whatsapp_number && (
            <Button
              variant="success"
              size="sm"
              onClick={() =>
                window.open(`https://wa.me/${seller.whatsapp_number}`, "_blank")
              }
            >
              <i className="ti ti-brand-whatsapp me-1"></i>
              Contact
            </Button>
          )}
        </div>
      </Card.Body>

      {renderFullProfile()}
    </Card>
  );
}
