"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Modal,
  Tabs,
  Tab,
  Alert,
} from "react-bootstrap";
import { FaTree, FaLeaf, FaSeedling, FaInfoCircle } from "react-icons/fa";
import SevenLayerGrid from "@/components/farm/SevenLayerGrid";
import TreeDetailModal from "@/components/farm/TreeDetailModal";
import LayerExplanation from "@/components/farm/LayerExplanation";
import SevenLayerVisualExplanation from "@/components/farm/SevenLayerVisualExplanation";

export default function SevenLayerForestPage() {
  const [selectedTree, setSelectedTree] = useState(null);
  const [showTreeModal, setShowTreeModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrees();
  }, []);

  const fetchTrees = async () => {
    try {
      const response = await fetch("/api/trees");
      if (response.ok) {
        const treeData = await response.json();
        setTrees(treeData);
      }
    } catch (error) {
      console.error("Error fetching trees:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTreeClick = (tree) => {
    setSelectedTree(tree);
    setShowTreeModal(true);
  };

  const sevenLayerData = {
    1: {
      name: "Canopy Layer (60-100+ ft)",
      description: "Large fruit and nut trees that form the main canopy",
      color: "#2d5016",
      examples: ["Mango", "Jackfruit", "Avocado", "Cashew", "Mulberry"],
      benefits: [
        "Primary fruit production",
        "Windbreak protection",
        "Carbon sequestration",
        "Habitat for birds",
      ],
      spacing: "24-30 ft apart",
      gridPositions: "corners",
    },
    2: {
      name: "Sub-Canopy Layer (20-60 ft)",
      description: "Medium-sized fruit trees under the main canopy",
      color: "#4a7c59",
      examples: ["Pomegranate", "Guava", "Apple", "Pear", "Litchi"],
      benefits: [
        "Diverse fruit production",
        "Efficient space utilization",
        "Pollinator support",
        "Microclimate creation",
      ],
      spacing: "12-18 ft apart",
      gridPositions: "mid-points",
    },
    3: {
      name: "Shrub Layer (3-20 ft)",
      description: "Berry bushes and small fruit trees",
      color: "#7fb069",
      examples: ["Barbados Cherry", "Karonda", "Blueberry", "Miracle Fruit"],
      benefits: [
        "Quick fruit production",
        "Ground cover",
        "Pest control",
        "Easy harvesting",
      ],
      spacing: "6-12 ft apart",
      gridPositions: "quarter-points",
    },
    4: {
      name: "Herbaceous Layer (1-3 ft)",
      description: "Non-woody perennial plants and herbs",
      color: "#a7c957",
      examples: ["Moringa leaves", "Spice plants", "Medicinal herbs"],
      benefits: [
        "Nutrient cycling",
        "Soil improvement",
        "Pest deterrent",
        "Culinary herbs",
      ],
      spacing: "3-6 ft apart",
      gridPositions: "between-trees",
    },
    5: {
      name: "Ground Cover Layer (0-1 ft)",
      description: "Low-growing plants that cover the soil",
      color: "#c9e265",
      examples: ["Strawberry", "Mint", "Ground spices", "Living mulch"],
      benefits: [
        "Soil protection",
        "Moisture retention",
        "Weed suppression",
        "Nitrogen fixation",
      ],
      spacing: "1-3 ft apart",
      gridPositions: "ground-level",
    },
    6: {
      name: "Vine Layer (Climbing)",
      description: "Climbing plants that use trees for support",
      color: "#f4a261",
      examples: ["Grapes", "Passion fruit", "Climbing beans", "Pepper vines"],
      benefits: [
        "Vertical space utilization",
        "Additional fruit production",
        "Natural trellising",
        "Biodiversity increase",
      ],
      spacing: "Variable",
      gridPositions: "climbing-supports",
    },
    7: {
      name: "Root Layer (Underground)",
      description: "Root vegetables and tubers growing underground",
      color: "#e76f51",
      examples: ["Sweet potato", "Ginger", "Turmeric", "Groundnuts"],
      benefits: [
        "Soil aeration",
        "Nutrient storage",
        "Underground harvest",
        "Soil structure improvement",
      ],
      spacing: "2-4 ft apart",
      gridPositions: "underground",
    },
  };

  return (
    <Container fluid className="py-4">
      {/* Header Section */}
      <Row className="mb-4">
        <Col>
          <div className="text-center mb-4">
            <div className="d-flex align-items-center justify-content-center mb-3">
              <FaTree className="text-success me-3" size={48} />
              <div>
                <h1 className="display-4 fw-bold text-success mb-0">
                  7-Layer Fruit Forest
                </h1>
                <p className="lead text-muted mb-0">
                  Maximize productivity with nature's vertical farming approach
                </p>
              </div>
            </div>
            <p className="text-muted">
              Learn permaculture principles and design sustainable food forest
              systems using our interactive 24×24 grid visualization and
              comprehensive management guides.
            </p>
          </div>
        </Col>
      </Row>

      {/* Navigation Tabs */}
      <Row className="mb-4">
        <Col>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="nav-tabs-custom"
          >
            <Tab
              eventKey="overview"
              title={
                <span>
                  <FaInfoCircle className="me-2" />
                  Overview
                </span>
              }
            >
              <Card className="border-0 shadow-sm mt-3">
                <Card.Body>
                  <h3 className="text-success mb-3">
                    What is a 7-Layer Forest?
                  </h3>
                  <p className="lead">
                    A 7-layer forest garden mimics natural forest ecosystems by
                    creating multiple vertical layers of productive plants. This
                    approach maximizes space utilization, creates beneficial
                    plant relationships, and produces food at every level from
                    the forest floor to the canopy.
                  </p>

                  <Row className="mt-4">
                    <Col md={6}>
                      <h5 className="text-primary">Key Benefits:</h5>
                      <ul className="list-unstyled">
                        <li className="mb-2">
                          <FaLeaf className="text-success me-2" />
                          Maximum space utilization
                        </li>
                        <li className="mb-2">
                          <FaLeaf className="text-success me-2" />
                          Natural pest control
                        </li>
                        <li className="mb-2">
                          <FaLeaf className="text-success me-2" />
                          Improved soil health
                        </li>
                        <li className="mb-2">
                          <FaLeaf className="text-success me-2" />
                          Diverse food production
                        </li>
                        <li className="mb-2">
                          <FaLeaf className="text-success me-2" />
                          Reduced maintenance
                        </li>
                      </ul>
                    </Col>
                    <Col md={6}>
                      <h5 className="text-primary">Perfect for:</h5>
                      <ul className="list-unstyled">
                        <li className="mb-2">
                          <FaSeedling className="text-warning me-2" />
                          Small to medium farms
                        </li>
                        <li className="mb-2">
                          <FaSeedling className="text-warning me-2" />
                          Sustainable agriculture
                        </li>
                        <li className="mb-2">
                          <FaSeedling className="text-warning me-2" />
                          Permaculture systems
                        </li>
                        <li className="mb-2">
                          <FaSeedling className="text-warning me-2" />
                          Climate resilience
                        </li>
                        <li className="mb-2">
                          <FaSeedling className="text-warning me-2" />
                          Biodiversity conservation
                        </li>
                      </ul>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Tab>

            <Tab
              eventKey="visual-explanation"
              title={
                <span>
                  <FaTree className="me-2" />
                  Cross-Section View
                </span>
              }
            >
              <SevenLayerVisualExplanation />
            </Tab>

            <Tab
              eventKey="visualization"
              title={
                <span>
                  <FaTree className="me-2" />
                  24×24 Grid Layout
                </span>
              }
            >
              <SevenLayerGrid
                sevenLayerData={sevenLayerData}
                trees={trees}
                onTreeClick={handleTreeClick}
                loading={loading}
              />
            </Tab>

            <Tab
              eventKey="layers"
              title={
                <span>
                  <FaLeaf className="me-2" />
                  Layer Details
                </span>
              }
            >
              <LayerExplanation
                sevenLayerData={sevenLayerData}
                trees={trees}
                onTreeClick={handleTreeClick}
              />
            </Tab>

            <Tab
              eventKey="management"
              title={
                <span>
                  <FaSeedling className="me-2" />
                  Management Guide
                </span>
              }
            >
              <Card className="border-0 shadow-sm mt-3">
                <Card.Body>
                  <h3 className="text-success mb-4">
                    7-Layer Forest Management
                  </h3>

                  <Row>
                    <Col lg={6}>
                      <Card className="h-100 border-success">
                        <Card.Header className="bg-success text-white">
                          <h5 className="mb-0">
                            Establishment Phase (Years 1-3)
                          </h5>
                        </Card.Header>
                        <Card.Body>
                          <ul className="list-unstyled">
                            <li className="mb-3">
                              <strong>Year 1:</strong> Plant canopy trees and
                              establish ground cover
                            </li>
                            <li className="mb-3">
                              <strong>Year 2:</strong> Add sub-canopy and shrub
                              layers
                            </li>
                            <li className="mb-3">
                              <strong>Year 3:</strong> Introduce vines and
                              complete herbaceous layer
                            </li>
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col lg={6}>
                      <Card className="h-100 border-primary">
                        <Card.Header className="bg-primary text-white">
                          <h5 className="mb-0">Maintenance Phase (Years 4+)</h5>
                        </Card.Header>
                        <Card.Body>
                          <ul className="list-unstyled">
                            <li className="mb-3">
                              <strong>Pruning:</strong> Annual selective pruning
                              for light management
                            </li>
                            <li className="mb-3">
                              <strong>Harvesting:</strong> Staggered harvests
                              throughout the year
                            </li>
                            <li className="mb-3">
                              <strong>Replanting:</strong> Replace aging plants
                              with new varieties
                            </li>
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  <Card className="mt-4 border-warning">
                    <Card.Header className="bg-warning text-dark">
                      <h5 className="mb-0">Seasonal Management Calendar</h5>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={3}>
                          <h6 className="text-success">Spring (Mar-May)</h6>
                          <ul className="small">
                            <li>Plant new trees</li>
                            <li>Prune dormant trees</li>
                            <li>Add compost</li>
                            <li>Establish ground cover</li>
                          </ul>
                        </Col>
                        <Col md={3}>
                          <h6 className="text-warning">Summer (Jun-Aug)</h6>
                          <ul className="small">
                            <li>Harvest summer fruits</li>
                            <li>Water management</li>
                            <li>Pest monitoring</li>
                            <li>Vine training</li>
                          </ul>
                        </Col>
                        <Col md={3}>
                          <h6 className="text-danger">Monsoon (Sep-Nov)</h6>
                          <ul className="small">
                            <li>Drainage management</li>
                            <li>Disease prevention</li>
                            <li>Harvest monsoon crops</li>
                            <li>Soil amendment</li>
                          </ul>
                        </Col>
                        <Col md={3}>
                          <h6 className="text-primary">Winter (Dec-Feb)</h6>
                          <ul className="small">
                            <li>Harvest winter fruits</li>
                            <li>Major pruning</li>
                            <li>Planning next year</li>
                            <li>Soil preparation</li>
                          </ul>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Col>
      </Row>

      {/* Tree Detail Modal */}
      <TreeDetailModal
        show={showTreeModal}
        onHide={() => setShowTreeModal(false)}
        tree={selectedTree}
        sevenLayerData={sevenLayerData}
      />
    </Container>
  );
}
