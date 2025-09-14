"use client";

import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Alert,
  Table,
  Nav,
  Tab,
  ProgressBar,
} from "react-bootstrap";
import { toast } from "react-hot-toast";

export default function GeotaggingBenefitsPage() {
  const [activeTab, setActiveTab] = useState("weather");
  const [weatherData, setWeatherData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [integrationStatus, setIntegrationStatus] = useState({});

  // Read URL parameter to set initial tab
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");

    if (
      tabParam &&
      ["weather", "analytics", "integration"].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, []);

  // Simulated weather data fetch
  const fetchWeatherData = async (latitude, longitude) => {
    // In production, this would call a real weather API
    const mockWeatherData = {
      temperature: 28,
      humidity: 65,
      rainfall: 2.5,
      forecast: [
        { day: "Today", temp: 28, condition: "Sunny" },
        { day: "Tomorrow", temp: 27, condition: "Partly Cloudy" },
        { day: "Day 3", temp: 29, condition: "Clear" },
      ],
      soilMoisture: 42,
      uvIndex: 7,
    };
    setWeatherData(mockWeatherData);
  };

  // Simulated analytics calculation
  const calculateAnalytics = () => {
    setAnalyticsData({
      treeDistribution: {
        total: 156,
        byType: {
          Mango: 45,
          Lemon: 32,
          Guava: 28,
          Others: 51,
        },
      },
      growthPatterns: {
        northZone: 85,
        southZone: 92,
        eastZone: 78,
        westZone: 88,
      },
      environmentalImpact: {
        carbonOffset: 12.5,
        waterConservation: 78,
        biodiversityScore: 82,
      },
    });
  };

  useEffect(() => {
    // Example coordinates
    fetchWeatherData(17.5299, 78.314);
    calculateAnalytics();
  }, []);

  const renderWeatherSection = () => (
    <div>
      {weatherData && (
        <Row>
          <Col md={6}>
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">
                  <i className="ti-thermometer me-2"></i>
                  Current Conditions
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between mb-3">
                  <div>
                    <h2 className="mb-0">{weatherData.temperature}°C</h2>
                    <small className="text-muted">Temperature</small>
                  </div>
                  <div className="text-end">
                    <h2 className="mb-0">{weatherData.humidity}%</h2>
                    <small className="text-muted">Humidity</small>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-muted mb-1">Soil Moisture</label>
                  <ProgressBar
                    now={weatherData.soilMoisture}
                    label={`${weatherData.soilMoisture}%`}
                  />
                </div>
                <div>
                  <label className="text-muted mb-1">UV Index</label>
                  <ProgressBar
                    now={weatherData.uvIndex * 10}
                    variant={weatherData.uvIndex > 7 ? "danger" : "warning"}
                    label={`UV ${weatherData.uvIndex}`}
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-info text-white">
                <h5 className="mb-0">
                  <i className="ti-calendar me-2"></i>
                  3-Day Forecast
                </h5>
              </Card.Header>
              <Card.Body>
                <Table hover>
                  <tbody>
                    {weatherData.forecast.map((day, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{day.day}</strong>
                        </td>
                        <td>{day.temp}°C</td>
                        <td>{day.condition}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Alert variant="info" className="mt-4 border-0 shadow-sm">
        <h5>
          <i className="ti-lightbulb me-2"></i>Smart Recommendations
        </h5>
        <Row>
          <Col md={6}>
            <ul className="mb-0">
              <li>Best watering times based on temperature and humidity</li>
              <li>Frost alerts for sensitive plants</li>
            </ul>
          </Col>
          <Col md={6}>
            <ul className="mb-0">
              <li>Disease risk warnings based on weather conditions</li>
              <li>Optimal planting times using historical weather data</li>
            </ul>
          </Col>
        </Row>
      </Alert>
    </div>
  );

  const renderAnalyticsSection = () => (
    <div>
      {analyticsData && (
        <Row>
          <Col md={6}>
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-success text-white">
                <h5 className="mb-0">
                  <i className="ti-pie-chart me-2"></i>
                  Tree Distribution
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <h6>Total Trees: {analyticsData.treeDistribution.total}</h6>
                  {Object.entries(analyticsData.treeDistribution.byType).map(
                    ([type, count]) => (
                      <div key={type} className="mb-2">
                        <small>{type}</small>
                        <ProgressBar
                          now={
                            (count / analyticsData.treeDistribution.total) * 100
                          }
                          label={`${count} trees`}
                          variant="success"
                        />
                      </div>
                    )
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-warning text-white">
                <h5 className="mb-0">
                  <i className="ti-target me-2"></i>
                  Growth Performance by Zone
                </h5>
              </Card.Header>
              <Card.Body>
                {Object.entries(analyticsData.growthPatterns).map(
                  ([zone, score]) => (
                    <div key={zone} className="mb-2">
                      <small>{zone.replace(/([A-Z])/g, " $1").trim()}</small>
                      <ProgressBar
                        now={score}
                        label={`${score}%`}
                        variant={score > 85 ? "success" : "warning"}
                      />
                    </div>
                  )
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col md={12}>
            <Card className="shadow-sm">
              <Card.Header className="bg-info text-white">
                <h5 className="mb-0">
                  <i className="ti-leaf me-2"></i>
                  Environmental Impact
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <div className="text-center">
                      <h3>{analyticsData.environmentalImpact.carbonOffset}</h3>
                      <small className="text-muted">Tons CO₂ Offset/Year</small>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center">
                      <h3>
                        {analyticsData.environmentalImpact.waterConservation}%
                      </h3>
                      <small className="text-muted">Water Conservation</small>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center">
                      <h3>
                        {analyticsData.environmentalImpact.biodiversityScore}
                      </h3>
                      <small className="text-muted">Biodiversity Score</small>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );

  const renderIntegrationSection = () => (
    <div>
      <Row>
        <Col md={6}>
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <i className="ti-plug me-2"></i>
                Available Integrations
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <h6>
                  <i className="ti-cloud me-2"></i>
                  Weather Services
                </h6>
                <ul className="list-unstyled">
                  <li>
                    <Badge bg="success" className="me-2">
                      Active
                    </Badge>
                    OpenWeatherMap API
                  </li>
                  <li>
                    <Badge bg="warning" className="me-2">
                      Coming Soon
                    </Badge>
                    Weather Underground
                  </li>
                </ul>
              </div>

              <div className="mb-3">
                <h6>
                  <i className="ti-map me-2"></i>
                  Mapping Services
                </h6>
                <ul className="list-unstyled">
                  <li>
                    <Badge bg="success" className="me-2">
                      Active
                    </Badge>
                    Google Maps Platform
                  </li>
                  <li>
                    <Badge bg="success" className="me-2">
                      Active
                    </Badge>
                    OpenStreetMap
                  </li>
                </ul>
              </div>

              <div className="mb-3">
                <h6>
                  <i className="ti-stats-up me-2"></i>
                  Analytics Platforms
                </h6>
                <ul className="list-unstyled">
                  <li>
                    <Badge bg="warning" className="me-2">
                      Coming Soon
                    </Badge>
                    Agricultural Analytics API
                  </li>
                  <li>
                    <Badge bg="warning" className="me-2">
                      Coming Soon
                    </Badge>
                    Soil Analysis Integration
                  </li>
                </ul>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">
                <i className="ti-star me-2"></i>
                Integration Benefits
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-4">
                <h6 className="text-primary">Weather Services</h6>
                <ul>
                  <li>Real-time weather monitoring</li>
                  <li>Automated irrigation scheduling</li>
                  <li>Frost and extreme weather alerts</li>
                  <li>Historical weather data analysis</li>
                </ul>
              </div>

              <div className="mb-4">
                <h6 className="text-primary">Mapping Services</h6>
                <ul>
                  <li>Precise tree location visualization</li>
                  <li>Route optimization for maintenance</li>
                  <li>Spatial analysis and planning</li>
                  <li>Mobile-friendly navigation</li>
                </ul>
              </div>

              <div>
                <h6 className="text-primary">Analytics Platforms</h6>
                <ul>
                  <li>Growth pattern analysis</li>
                  <li>Yield prediction models</li>
                  <li>Resource optimization insights</li>
                  <li>Environmental impact assessment</li>
                </ul>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Alert variant="success" className="mt-4 border-0 shadow-sm">
        <h5>
          <i className="ti-shield me-2"></i>Security & Support
        </h5>
        <p className="mb-0">
          All integrations use secure API keys and follow best practices for
          data privacy. Contact support for custom integration requirements or
          to request new service integrations.
        </p>
      </Alert>
    </div>
  );

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <i className="ti-map-alt me-2"></i>
          Geotagging Benefits & Features
        </h2>
      </div>

      {/* Clean Tab Navigation */}
      <Nav variant="pills" className="mb-4 justify-content-center">
        <Nav.Item>
          <Nav.Link
            active={activeTab === "weather"}
            onClick={() => {
              setActiveTab("weather");
              window.history.pushState(
                {},
                "",
                "/geotagging-benefits?tab=weather"
              );
            }}
            className="px-4 py-2 mx-1"
          >
            <i className="ti-cloud me-2"></i>
            Weather Intelligence
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            active={activeTab === "analytics"}
            onClick={() => {
              setActiveTab("analytics");
              window.history.pushState(
                {},
                "",
                "/geotagging-benefits?tab=analytics"
              );
            }}
            className="px-4 py-2 mx-1"
          >
            <i className="ti-bar-chart me-2"></i>
            Spatial Analytics
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            active={activeTab === "integration"}
            onClick={() => {
              setActiveTab("integration");
              window.history.pushState(
                {},
                "",
                "/geotagging-benefits?tab=integration"
              );
            }}
            className="px-4 py-2 mx-1"
          >
            <i className="ti-link me-2"></i>
            External Integrations
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "weather" && renderWeatherSection()}
        {activeTab === "analytics" && renderAnalyticsSection()}
        {activeTab === "integration" && renderIntegrationSection()}
      </div>
    </Container>
  );
}
