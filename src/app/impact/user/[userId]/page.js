"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Table,
  Spinner,
  Alert,
  ProgressBar,
  Button,
} from "react-bootstrap";
import UserAvatar from "@/components/common/UserAvatar";
import {
  FaLeaf,
  FaTree,
  FaSeedling,
  FaRecycle,
  FaTint,
  FaBoxOpen,
  FaHandHoldingHeart,
  FaChartLine,
  FaTrophy,
  FaMedal,
  FaAward,
  FaStar,
  FaArrowLeft,
  FaCalendar,
  FaShoppingCart,
  FaUsers,
  FaBook,
} from "react-icons/fa";

export default function UserImpactProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [activities, setActivities] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchUserImpact();
    }
  }, [userId]);

  const fetchUserImpact = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/impact/user/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch user impact data");

      const data = await response.json();
      setProfile(data.profile);
      setActivities(data.activities || []);
      setAchievements(data.achievements || []);
    } catch (error) {
      console.error("Error fetching user impact:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="success" />
        <p className="mt-3 text-muted">Loading impact profile...</p>
      </Container>
    );
  }

  if (error || !profile) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <Alert.Heading>Unable to Load Profile</Alert.Heading>
          <p>
            {error || "The impact profile for this user could not be loaded."}
          </p>
          <Button variant="outline-warning" onClick={() => router.push("/impact")}>
            Back to Dashboard
          </Button>
        </Alert>
      </Container>
    );
  }

  const impactLevelColors = {
    "Environmental Champion": "danger",
    "Sustainability Leader": "warning",
    "Green Warrior": "success",
    "Eco Contributor": "info",
    "Green Starter": "secondary",
  };

  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString();
  };

  const categoryIcons = {
    environmental: <FaLeaf className="text-success" />,
    community: <FaUsers className="text-info" />,
    commerce: <FaShoppingCart className="text-warning" />,
    knowledge: <FaBook className="text-primary" />,
  };

  return (
    <Container className="py-4" style={{ maxWidth: "1400px" }}>
      {/* Back Button */}
      <Button
        variant="outline-secondary"
        size="sm"
        className="mb-3"
        onClick={() => router.push("/impact")}
      >
        <FaArrowLeft className="me-2" />
        Back to Dashboard
      </Button>

      {/* Profile Header */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-4">
          <Row className="align-items-center">
            <Col xs="auto">
              <UserAvatar
                user={{
                  name: profile.user?.name,
                  image: profile.user?.avatar_url,
                }}
                size={100}
              />
            </Col>
            <Col>
              <h2 className="mb-2">{profile.user?.name}</h2>
              <div className="mb-2">
                <Badge
                  bg={impactLevelColors[profile.impact_level]}
                  className="me-2"
                  style={{ fontSize: "1rem", padding: "0.5rem 1rem" }}
                >
                  <FaTrophy className="me-2" />
                  {profile.impact_level}
                </Badge>
                {profile.user?.role && (
                  <Badge
                    bg={
                      profile.user.role === "seller"
                        ? "success"
                        : profile.user.role === "admin"
                        ? "danger"
                        : "secondary"
                    }
                  >
                    {profile.user.role}
                  </Badge>
                )}
              </div>
              <p className="text-muted mb-0">
                📍 {profile.user?.location || "Location not specified"}
              </p>
              {profile.rank_position > 0 && (
                <p className="text-muted mb-0">
                  🏆 Ranked #{profile.rank_position} in Community
                </p>
              )}
            </Col>
            <Col xs="auto" className="text-end">
              <h1 className="display-4 fw-bold text-success mb-0">
                {formatNumber(profile.total_impact_score)}
              </h1>
              <small className="text-muted">Total Impact Score</small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Key Metrics */}
      <Row className="g-3 mb-4">
        <Col xs={12} md={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <FaLeaf className="text-success mb-2" size={32} />
              <h3 className="fw-bold mb-0">
                {formatNumber(profile.carbon_credits_earned)}
              </h3>
              <small className="text-muted">kg CO₂ Credits</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <FaTree className="text-success mb-2" size={32} />
              <h3 className="fw-bold mb-0">{profile.trees_planted}</h3>
              <small className="text-muted">Trees Planted</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <FaSeedling className="text-info mb-2" size={32} />
              <h3 className="fw-bold mb-0">{profile.seeds_shared}</h3>
              <small className="text-muted">Seeds Shared</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <FaHandHoldingHeart className="text-danger mb-2" size={32} />
              <h3 className="fw-bold mb-0">{profile.volunteer_hours}</h3>
              <small className="text-muted">Volunteer Hours</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Detailed Impact Breakdown */}
      <Row className="g-4 mb-4">
        <Col xs={12} lg={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0">
                <FaLeaf className="me-2 text-success" />
                Environmental Impact
              </h5>
            </Card.Header>
            <Card.Body>
              <Table borderless className="mb-0">
                <tbody>
                  <tr>
                    <td>
                      <FaRecycle className="me-2 text-success" />
                      Organic Waste Composted
                    </td>
                    <td className="text-end fw-bold">
                      {formatNumber(profile.organic_waste_composted_kg)} kg
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <FaTint className="me-2 text-info" />
                      Water Saved
                    </td>
                    <td className="text-end fw-bold">
                      {formatNumber(profile.water_saved_liters)} L
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <FaBoxOpen className="me-2 text-warning" />
                      Plastic Reduced
                    </td>
                    <td className="text-end fw-bold">
                      {formatNumber(profile.plastic_reduced_kg)} kg
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <FaSeedling className="me-2 text-success" />
                      Local Food Purchased
                    </td>
                    <td className="text-end fw-bold">
                      {formatNumber(profile.local_food_purchased_kg)} kg
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0">
                <FaUsers className="me-2 text-primary" />
                Community Contributions
              </h5>
            </Card.Header>
            <Card.Body>
              <Table borderless className="mb-0">
                <tbody>
                  <tr>
                    <td>
                      <FaShoppingCart className="me-2 text-success" />
                      Products Sold / Purchased
                    </td>
                    <td className="text-end fw-bold">
                      {profile.products_sold} / {profile.products_purchased}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <FaSeedling className="me-2 text-info" />
                      Seeds Shared / Received
                    </td>
                    <td className="text-end fw-bold">
                      {profile.seeds_shared} / {profile.seeds_received}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <FaCalendar className="me-2 text-warning" />
                      Events Organized / Attended
                    </td>
                    <td className="text-end fw-bold">
                      {profile.events_organized} / {profile.events_attended}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <FaBook className="me-2 text-primary" />
                      Posts & Comments
                    </td>
                    <td className="text-end fw-bold">
                      {profile.posts_created} / {profile.helpful_comments}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Achievements */}
      {achievements.length > 0 && (
        <Card className="border-0 shadow-sm mb-4">
          <Card.Header className="bg-white border-bottom">
            <h5 className="mb-0">
              <FaAward className="me-2 text-warning" />
              Achievements Unlocked
            </h5>
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
              {achievements.map((achievement) => (
                <Col key={achievement.id} xs={12} sm={6} md={4} lg={3}>
                  <Card className="h-100 text-center border shadow-sm hover-shadow">
                    <Card.Body>
                      <div className="mb-2" style={{ fontSize: "2.5rem" }}>
                        {achievement.icon}
                      </div>
                      <h6 className="fw-bold mb-1">{achievement.name}</h6>
                      <small className="text-muted">{achievement.description}</small>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Recent Activities */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-bottom">
          <h5 className="mb-0">
            <FaChartLine className="me-2" />
            Recent Impact Activities
          </h5>
        </Card.Header>
        <Card.Body>
          {activities.length === 0 ? (
            <Alert variant="info" className="mb-0">
              <FaSeedling className="me-2" />
              No activities recorded yet. Start making an impact!
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Activity</th>
                    <th>Category</th>
                    <th className="text-end">CO₂ Credits</th>
                    <th className="text-end">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity) => (
                    <tr key={activity.id} className="align-middle">
                      <td>
                        <small className="text-muted">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </small>
                      </td>
                      <td>
                        <div>{activity.description}</div>
                        {activity.quantity > 1 && (
                          <small className="text-muted">
                            Quantity: {activity.quantity} {activity.unit}
                          </small>
                        )}
                      </td>
                      <td>
                        <Badge
                          bg={
                            activity.activity_category === "environmental"
                              ? "success"
                              : activity.activity_category === "community"
                              ? "info"
                              : activity.activity_category === "commerce"
                              ? "warning"
                              : "primary"
                          }
                        >
                          {categoryIcons[activity.activity_category]}{" "}
                          {activity.activity_category}
                        </Badge>
                      </td>
                      <td className="text-end">
                        <span className="text-success">
                          +{activity.carbon_credits_earned} kg
                        </span>
                      </td>
                      <td className="text-end">
                        <strong className="text-primary">
                          +{activity.points_earned}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Knowledge Sharing Stats */}
      {(profile.guides_written > 0 ||
        profile.questions_answered > 0 ||
        profile.workshops_conducted > 0) && (
        <Card className="border-0 shadow-sm mt-4">
          <Card.Header className="bg-white border-bottom">
            <h5 className="mb-0">
              <FaBook className="me-2 text-primary" />
              Knowledge Sharing
            </h5>
          </Card.Header>
          <Card.Body>
            <Row className="text-center">
              <Col xs={4}>
                <h3 className="fw-bold text-primary">{profile.guides_written}</h3>
                <small className="text-muted">Guides Written</small>
              </Col>
              <Col xs={4}>
                <h3 className="fw-bold text-primary">
                  {profile.questions_answered}
                </h3>
                <small className="text-muted">Questions Answered</small>
              </Col>
              <Col xs={4}>
                <h3 className="fw-bold text-primary">
                  {profile.workshops_conducted}
                </h3>
                <small className="text-muted">Workshops Conducted</small>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}

