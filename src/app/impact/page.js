"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Table,
  Nav,
  Tab,
  Spinner,
  ProgressBar,
  Alert,
} from "react-bootstrap";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/common/UserAvatar";
import {
  FaLeaf,
  FaTree,
  FaSeedling,
  FaUsers,
  FaRecycle,
  FaTint,
  FaBoxOpen,
  FaHandHoldingHeart,
  FaChartLine,
  FaTrophy,
  FaMedal,
  FaAward,
  FaStar,
} from "react-icons/fa";

export default function CommunityImpactPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [activeTab, setActiveTab] = useState("all-time");
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchImpactData();
  }, []);

  useEffect(() => {
    if (activeTab) {
      fetchLeaderboard(activeTab);
    }
  }, [activeTab]);

  const fetchImpactData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/impact/stats");
      if (!response.ok) throw new Error("Failed to fetch impact data");

      const data = await response.json();
      setStats(data.stats);
      setRecentActivities(data.recentActivities || []);
    } catch (error) {
      console.error("Error fetching impact data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async (period) => {
    try {
      const response = await fetch(`/api/impact/leaderboard?period=${period}`);
      if (!response.ok) throw new Error("Failed to fetch leaderboard");

      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  };

  const handleUserClick = (userId) => {
    router.push(`/impact/user/${userId}`);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="success" />
        <p className="mt-3 text-muted">Loading community impact data...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <Alert.Heading>Impact Dashboard Not Yet Activated</Alert.Heading>
          <p>
            The impact tracking system needs to be initialized. Please run the database migration:
          </p>
          <code className="d-block p-3 bg-light rounded">
            database/create-community-impact-system.sql
          </code>
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

  return (
    <Container className="py-4" style={{ maxWidth: "1400px" }}>
      {/* Page Header */}
      <div className="mb-4">
        <div className="d-flex align-items-center mb-2">
          <FaLeaf className="text-success me-2" size={32} />
          <h1 className="mb-0">Community Impact Dashboard</h1>
        </div>
        <p className="text-muted">
          Track our collective environmental impact and celebrate our community champions
        </p>
      </div>

      {/* Community Stats Cards */}
      <Row className="g-3 mb-4">
        <Col xs={12} md={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm hover-shadow">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: "rgba(25, 135, 84, 0.1)",
                  }}
                >
                  <FaLeaf className="text-success" size={24} />
                </div>
                <div>
                  <h3 className="mb-0 fw-bold">
                    {formatNumber(stats?.total_carbon_credits)}
                  </h3>
                  <small className="text-muted">kg CO₂ Saved</small>
                </div>
              </div>
              <ProgressBar
                now={75}
                variant="success"
                className="mt-2"
                style={{ height: "4px" }}
              />
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} md={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm hover-shadow">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: "rgba(32, 201, 151, 0.1)",
                  }}
                >
                  <FaTree className="text-success" size={24} />
                </div>
                <div>
                  <h3 className="mb-0 fw-bold">
                    {formatNumber(stats?.total_trees_planted)}
                  </h3>
                  <small className="text-muted">Trees Planted</small>
                </div>
              </div>
              <ProgressBar
                now={60}
                variant="success"
                className="mt-2"
                style={{ height: "4px" }}
              />
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} md={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm hover-shadow">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: "rgba(13, 202, 240, 0.1)",
                  }}
                >
                  <FaSeedling className="text-info" size={24} />
                </div>
                <div>
                  <h3 className="mb-0 fw-bold">
                    {formatNumber(stats?.total_seeds_shared)}
                  </h3>
                  <small className="text-muted">Seeds Shared</small>
                </div>
              </div>
              <ProgressBar
                now={45}
                variant="info"
                className="mt-2"
                style={{ height: "4px" }}
              />
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} md={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm hover-shadow">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: "rgba(220, 53, 69, 0.1)",
                  }}
                >
                  <FaUsers className="text-danger" size={24} />
                </div>
                <div>
                  <h3 className="mb-0 fw-bold">
                    {formatNumber(stats?.total_active_members)}
                  </h3>
                  <small className="text-muted">Active Members</small>
                </div>
              </div>
              <ProgressBar
                now={80}
                variant="danger"
                className="mt-2"
                style={{ height: "4px" }}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Additional Impact Metrics */}
      <Row className="g-3 mb-4">
        <Col xs={12} lg={8}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0">
                <FaChartLine className="me-2" />
                Environmental Impact Breakdown
              </h5>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col xs={6} md={4}>
                  <div className="text-center p-3 rounded" style={{ backgroundColor: "rgba(25, 135, 84, 0.05)" }}>
                    <FaRecycle className="text-success mb-2" size={32} />
                    <h4 className="mb-0 fw-bold">
                      {formatNumber(stats?.total_waste_composted)}
                    </h4>
                    <small className="text-muted">kg Composted</small>
                  </div>
                </Col>
                <Col xs={6} md={4}>
                  <div className="text-center p-3 rounded" style={{ backgroundColor: "rgba(13, 202, 240, 0.05)" }}>
                    <FaTint className="text-info mb-2" size={32} />
                    <h4 className="mb-0 fw-bold">
                      {formatNumber(stats?.total_water_saved)}
                    </h4>
                    <small className="text-muted">Liters Saved</small>
                  </div>
                </Col>
                <Col xs={6} md={4}>
                  <div className="text-center p-3 rounded" style={{ backgroundColor: "rgba(255, 193, 7, 0.05)" }}>
                    <FaBoxOpen className="text-warning mb-2" size={32} />
                    <h4 className="mb-0 fw-bold">
                      {formatNumber(stats?.total_plastic_reduced)}
                    </h4>
                    <small className="text-muted">kg Plastic Reduced</small>
                  </div>
                </Col>
                <Col xs={6} md={4}>
                  <div className="text-center p-3 rounded" style={{ backgroundColor: "rgba(220, 53, 69, 0.05)" }}>
                    <FaSeedling className="text-danger mb-2" size={32} />
                    <h4 className="mb-0 fw-bold">
                      {formatNumber(stats?.total_local_food)}
                    </h4>
                    <small className="text-muted">kg Local Food</small>
                  </div>
                </Col>
                <Col xs={6} md={4}>
                  <div className="text-center p-3 rounded" style={{ backgroundColor: "rgba(111, 66, 193, 0.05)" }}>
                    <FaHandHoldingHeart className="text-purple mb-2" size={32} />
                    <h4 className="mb-0 fw-bold">
                      {formatNumber(stats?.total_volunteer_hours)}
                    </h4>
                    <small className="text-muted">Volunteer Hours</small>
                  </div>
                </Col>
                <Col xs={6} md={4}>
                  <div className="text-center p-3 rounded" style={{ backgroundColor: "rgba(13, 110, 253, 0.05)" }}>
                    <FaUsers className="text-primary mb-2" size={32} />
                    <h4 className="mb-0 fw-bold">
                      {formatNumber(stats?.total_events_organized)}
                    </h4>
                    <small className="text-muted">Events Organized</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0">
                <FaMedal className="me-2" />
                Impact Levels
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="d-flex align-items-center">
                    <FaTrophy className="text-danger me-2" />
                    Champions
                  </span>
                  <Badge bg="danger">{stats?.champions_count || 0}</Badge>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="d-flex align-items-center">
                    <FaAward className="text-warning me-2" />
                    Leaders
                  </span>
                  <Badge bg="warning">{stats?.leaders_count || 0}</Badge>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="d-flex align-items-center">
                    <FaMedal className="text-success me-2" />
                    Warriors
                  </span>
                  <Badge bg="success">{stats?.warriors_count || 0}</Badge>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="d-flex align-items-center">
                    <FaStar className="text-info me-2" />
                    Contributors
                  </span>
                  <Badge bg="info">{stats?.contributors_count || 0}</Badge>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="d-flex align-items-center">
                    <FaSeedling className="text-secondary me-2" />
                    Starters
                  </span>
                  <Badge bg="secondary">{stats?.starters_count || 0}</Badge>
                </div>
              </div>
              <hr />
              <p className="text-muted small mb-0">
                <strong>Total Community Members:</strong>{" "}
                {stats?.total_active_members || 0}
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Leaderboard Section */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <FaTrophy className="me-2 text-warning" />
              Top Impact Contributors
            </h5>
          </div>
        </Card.Header>
        <Card.Body>
          <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
            <Nav variant="tabs" className="mb-3">
              <Nav.Item>
                <Nav.Link eventKey="all-time">All Time</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="monthly">This Month</Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>
              <Tab.Pane eventKey={activeTab}>
                {leaderboard.length === 0 ? (
                  <Alert variant="info">
                    <FaLeaf className="me-2" />
                    No impact data available yet. Start tracking your environmental contributions!
                  </Alert>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "60px" }}>Rank</th>
                          <th>Member</th>
                          <th>Location</th>
                          <th>Impact Level</th>
                          <th className="text-end">
                            {activeTab === "monthly" ? "Monthly Points" : "Total Score"}
                          </th>
                          <th className="text-end">CO₂ Credits</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((member, index) => (
                          <tr
                            key={member.user_id}
                            onClick={() => handleUserClick(member.user_id)}
                            style={{ cursor: "pointer" }}
                            className="align-middle"
                          >
                            <td>
                              <div className="d-flex align-items-center justify-content-center">
                                {index === 0 && (
                                  <FaTrophy className="text-warning me-1" size={20} />
                                )}
                                {index === 1 && (
                                  <FaMedal className="text-secondary me-1" size={20} />
                                )}
                                {index === 2 && (
                                  <FaMedal className="text-warning me-1" size={18} />
                                )}
                                <span className="fw-bold">
                                  {activeTab === "monthly" ? index + 1 : member.rank || index + 1}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <UserAvatar
                                  user={{ name: member.name, image: member.avatar_url }}
                                  size={40}
                                  className="me-2"
                                />
                                <div>
                                  <div className="fw-bold">{member.name}</div>
                                  {member.role && (
                                    <Badge
                                      bg={
                                        member.role === "seller"
                                          ? "success"
                                          : member.role === "admin"
                                          ? "danger"
                                          : "secondary"
                                      }
                                      className="small"
                                    >
                                      {member.role}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              <small className="text-muted">
                                {member.location || "Not specified"}
                              </small>
                            </td>
                            <td>
                              {member.impact_level && (
                                <Badge bg={impactLevelColors[member.impact_level] || "secondary"}>
                                  {member.impact_level}
                                </Badge>
                              )}
                            </td>
                            <td className="text-end">
                              <strong>
                                {formatNumber(
                                  activeTab === "monthly"
                                    ? member.monthly_points
                                    : member.total_impact_score
                                )}
                              </strong>
                            </td>
                            <td className="text-end">
                              <span className="text-success">
                                {formatNumber(
                                  activeTab === "monthly"
                                    ? member.monthly_carbon_credits
                                    : member.carbon_credits_earned
                                )}{" "}
                                kg
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Card.Body>
      </Card>

      {/* Recent Activities */}
      {recentActivities.length > 0 && (
        <Card className="border-0 shadow-sm mt-4">
          <Card.Header className="bg-white border-bottom">
            <h5 className="mb-0">
              <FaChartLine className="me-2" />
              Recent Impact Activities
            </h5>
          </Card.Header>
          <Card.Body>
            <div className="activity-feed">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="d-flex align-items-start mb-3 pb-3 border-bottom"
                >
                  <UserAvatar
                    user={{
                      name: activity.user?.name,
                      image: activity.user?.avatar_url,
                    }}
                    size={40}
                    className="me-3"
                  />
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between">
                      <div>
                        <strong>{activity.user?.name}</strong>{" "}
                        <span className="text-muted">{activity.description}</span>
                      </div>
                      <div className="text-end">
                        <Badge bg="success" className="me-2">
                          +{activity.carbon_credits_earned} kg CO₂
                        </Badge>
                        <Badge bg="primary">+{activity.points_earned} pts</Badge>
                      </div>
                    </div>
                    <small className="text-muted">
                      {new Date(activity.created_at).toLocaleDateString()} •{" "}
                      {activity.user?.location || "Unknown location"}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}

