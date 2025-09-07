"use client";

import { useState } from "react";
import {
  Card,
  Row,
  Col,
  Badge,
  Button,
  Alert,
  Accordion,
} from "react-bootstrap";
import {
  FaTree,
  FaLeaf,
  FaSeedling,
  FaVine,
  FaCarrot,
  FaArrowUp,
  FaArrowDown,
  FaLightbulb,
  FaTint,
  FaBug,
} from "react-icons/fa";

const LayerExplanation = ({ sevenLayerData, trees, onTreeClick }) => {
  const [expandedLayer, setExpandedLayer] = useState(null);

  const getLayerIcon = (layerNum) => {
    const icons = {
      1: <FaTree size={24} />,
      2: <FaTree size={20} />,
      3: <FaLeaf size={18} />,
      4: <FaSeedling size={16} />,
      5: <FaSeedling size={14} />,
      6: <FaVine size={16} />,
      7: <FaCarrot size={16} />,
    };
    return icons[layerNum] || <FaLeaf size={16} />;
  };

  const getAvailableTrees = (layerExamples) => {
    if (!trees.length) return [];

    return trees.filter((tree) =>
      layerExamples.some(
        (example) =>
          tree.name.toLowerCase().includes(example.toLowerCase()) ||
          example.toLowerCase().includes(tree.name.toLowerCase())
      )
    );
  };

  const getLayerInteractions = (layerNum) => {
    const interactions = {
      1: {
        provides: [
          "Shade for lower layers",
          "Wind protection",
          "Carbon sequestration",
          "Bird habitat",
        ],
        receives: ["Deep soil nutrients", "Structural support from ground"],
      },
      2: {
        provides: [
          "Filtered light",
          "Fruit diversity",
          "Pollinator habitat",
          "Microclimate",
        ],
        receives: [
          "Protection from canopy",
          "Nutrients from decomposing leaves",
        ],
      },
      3: {
        provides: [
          "Berry production",
          "Pest control",
          "Soil stabilization",
          "Wildlife food",
        ],
        receives: ["Dappled sunlight", "Wind protection", "Nutrient cycling"],
      },
      4: {
        provides: [
          "Nutrient cycling",
          "Soil improvement",
          "Pest deterrent",
          "Medicinal plants",
        ],
        receives: [
          "Filtered light",
          "Moisture retention",
          "Protection from elements",
        ],
      },
      5: {
        provides: [
          "Soil protection",
          "Moisture retention",
          "Weed suppression",
          "Living mulch",
        ],
        receives: [
          "Nutrients from upper layers",
          "Protection from foot traffic",
        ],
      },
      6: {
        provides: [
          "Vertical fruit production",
          "Space efficiency",
          "Habitat diversity",
        ],
        receives: [
          "Structural support",
          "Nutrients from host trees",
          "Protection",
        ],
      },
      7: {
        provides: [
          "Soil aeration",
          "Nutrient storage",
          "Underground harvest",
          "Soil structure",
        ],
        receives: [
          "Nutrients from decomposition",
          "Water infiltration",
          "Root space",
        ],
      },
    };

    return interactions[layerNum] || { provides: [], receives: [] };
  };

  return (
    <div className="mt-3">
      <Alert variant="success" className="mb-4">
        <FaLightbulb className="me-2" />
        <strong>Understanding the 7 Layers:</strong> Each layer serves a
        specific ecological function and works together to create a
        self-sustaining food forest ecosystem. Click on each layer below to
        explore detailed information.
      </Alert>

      <Accordion>
        {Object.entries(sevenLayerData).map(([layerNum, layerInfo]) => {
          const availableTrees = getAvailableTrees(layerInfo.examples);
          const interactions = getLayerInteractions(parseInt(layerNum));

          return (
            <Accordion.Item eventKey={layerNum} key={layerNum}>
              <Accordion.Header>
                <div className="d-flex align-items-center w-100">
                  <div
                    className="me-3 p-2 rounded-circle text-white d-flex align-items-center justify-content-center"
                    style={{
                      backgroundColor: layerInfo.color,
                      minWidth: "50px",
                      height: "50px",
                    }}
                  >
                    {getLayerIcon(parseInt(layerNum))}
                  </div>
                  <div className="flex-grow-1">
                    <h5 className="mb-1">
                      Layer {layerNum}: {layerInfo.name}
                    </h5>
                    <p className="mb-0 text-muted small">
                      {layerInfo.description}
                    </p>
                  </div>
                  <Badge bg="secondary" className="ms-2">
                    {layerInfo.examples.length} plant types
                  </Badge>
                </div>
              </Accordion.Header>

              <Accordion.Body>
                <Row>
                  {/* Main Information */}
                  <Col lg={8}>
                    <Card className="border-0 shadow-sm mb-4">
                      <Card.Body>
                        <h6 className="text-primary mb-3">
                          Plant Examples & Characteristics
                        </h6>

                        <Row>
                          <Col md={6}>
                            <h6 className="text-success">
                              Recommended Plants:
                            </h6>
                            <div className="d-flex flex-wrap gap-2 mb-3">
                              {layerInfo.examples.map((plant, idx) => (
                                <Badge
                                  key={idx}
                                  bg="success"
                                  className="p-2 cursor-pointer"
                                  onClick={() => {
                                    const matchingTree = availableTrees.find(
                                      (tree) =>
                                        tree.name
                                          .toLowerCase()
                                          .includes(plant.toLowerCase())
                                    );
                                    if (matchingTree) onTreeClick(matchingTree);
                                  }}
                                  style={{ cursor: "pointer" }}
                                >
                                  {plant}
                                </Badge>
                              ))}
                            </div>

                            {availableTrees.length > 0 && (
                              <div>
                                <h6 className="text-info">
                                  Available in Database:
                                </h6>
                                <div className="d-flex flex-wrap gap-2">
                                  {availableTrees
                                    .slice(0, 5)
                                    .map((tree, idx) => (
                                      <Button
                                        key={idx}
                                        variant="outline-info"
                                        size="sm"
                                        onClick={() => onTreeClick(tree)}
                                      >
                                        {tree.name}
                                      </Button>
                                    ))}
                                  {availableTrees.length > 5 && (
                                    <Badge bg="info">
                                      +{availableTrees.length - 5} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </Col>

                          <Col md={6}>
                            <h6 className="text-warning">
                              Spacing & Placement:
                            </h6>
                            <ul className="list-unstyled small mb-3">
                              <li className="mb-1">
                                <strong>Spacing:</strong> {layerInfo.spacing}
                              </li>
                              <li className="mb-1">
                                <strong>Grid Position:</strong>{" "}
                                {layerInfo.gridPositions}
                              </li>
                            </ul>

                            <h6 className="text-danger">Key Benefits:</h6>
                            <ul className="list-unstyled small">
                              {layerInfo.benefits.map((benefit, idx) => (
                                <li key={idx} className="mb-1">
                                  • {benefit}
                                </li>
                              ))}
                            </ul>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>

                    {/* Ecological Interactions */}
                    <Card className="border-0 shadow-sm">
                      <Card.Header className="bg-light">
                        <h6 className="mb-0">
                          <FaBug className="me-2" />
                          Ecological Interactions
                        </h6>
                      </Card.Header>
                      <Card.Body>
                        <Row>
                          <Col md={6}>
                            <h6 className="text-success">
                              <FaArrowUp className="me-2" />
                              What This Layer Provides:
                            </h6>
                            <ul className="list-unstyled small">
                              {interactions.provides.map((item, idx) => (
                                <li key={idx} className="mb-1 text-success">
                                  • {item}
                                </li>
                              ))}
                            </ul>
                          </Col>

                          <Col md={6}>
                            <h6 className="text-primary">
                              <FaArrowDown className="me-2" />
                              What This Layer Receives:
                            </h6>
                            <ul className="list-unstyled small">
                              {interactions.receives.map((item, idx) => (
                                <li key={idx} className="mb-1 text-primary">
                                  • {item}
                                </li>
                              ))}
                            </ul>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Quick Reference */}
                  <Col lg={4}>
                    <Card
                      className="border-0 shadow-sm mb-3"
                      style={{ borderLeft: `4px solid ${layerInfo.color}` }}
                    >
                      <Card.Header
                        style={{
                          backgroundColor: layerInfo.color,
                          color: "white",
                        }}
                      >
                        <h6 className="mb-0">Quick Reference</h6>
                      </Card.Header>
                      <Card.Body>
                        <div className="mb-3">
                          <small className="text-muted">LAYER HEIGHT</small>
                          <div className="fw-bold">
                            {layerInfo.name.match(/\((.*?)\)/)?.[1] ||
                              "Variable"}
                          </div>
                        </div>

                        <div className="mb-3">
                          <small className="text-muted">PRIMARY FUNCTION</small>
                          <div className="fw-bold small">
                            {layerInfo.benefits[0]}
                          </div>
                        </div>

                        <div className="mb-3">
                          <small className="text-muted">
                            MAINTENANCE LEVEL
                          </small>
                          <div className="fw-bold">
                            {parseInt(layerNum) <= 2
                              ? "Low"
                              : parseInt(layerNum) <= 4
                              ? "Medium"
                              : "High"}
                          </div>
                        </div>

                        <div className="mb-3">
                          <small className="text-muted">
                            ESTABLISHMENT TIME
                          </small>
                          <div className="fw-bold">
                            {parseInt(layerNum) <= 2
                              ? "3-5 years"
                              : parseInt(layerNum) <= 4
                              ? "1-2 years"
                              : "Immediate"}
                          </div>
                        </div>
                      </Card.Body>
                    </Card>

                    {/* Management Tips */}
                    <Card className="border-warning">
                      <Card.Header className="bg-warning text-dark">
                        <h6 className="mb-0">
                          <FaTint className="me-2" />
                          Management Tips
                        </h6>
                      </Card.Header>
                      <Card.Body>
                        <ul className="list-unstyled small">
                          {parseInt(layerNum) === 1 && (
                            <>
                              <li className="mb-2">
                                • Plant first to establish shade
                              </li>
                              <li className="mb-2">
                                • Allow 3-5 years before adding lower layers
                              </li>
                              <li className="mb-2">
                                • Prune for light penetration
                              </li>
                            </>
                          )}
                          {parseInt(layerNum) === 2 && (
                            <>
                              <li className="mb-2">
                                • Plant after canopy is established
                              </li>
                              <li className="mb-2">
                                • Choose varieties suited to partial shade
                              </li>
                              <li className="mb-2">
                                • Maintain 12-18 ft spacing
                              </li>
                            </>
                          )}
                          {parseInt(layerNum) === 3 && (
                            <>
                              <li className="mb-2">
                                • Excellent for quick food production
                              </li>
                              <li className="mb-2">
                                • Prune regularly for shape
                              </li>
                              <li className="mb-2">
                                • Harvest frequently to encourage growth
                              </li>
                            </>
                          )}
                          {parseInt(layerNum) >= 4 && (
                            <>
                              <li className="mb-2">
                                • Plant after tree layers are established
                              </li>
                              <li className="mb-2">
                                • Rotate crops seasonally
                              </li>
                              <li className="mb-2">
                                • Use for continuous harvest
                              </li>
                            </>
                          )}
                        </ul>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Accordion.Body>
            </Accordion.Item>
          );
        })}
      </Accordion>

      {/* Summary Card */}
      <Card className="border-0 shadow-sm mt-4 bg-light">
        <Card.Body>
          <h5 className="text-success mb-3">7-Layer System Summary</h5>
          <Row>
            <Col md={4}>
              <h6 className="text-primary">Vertical Integration:</h6>
              <p className="small">
                Each layer occupies a different vertical space, maximizing the
                use of sunlight and creating diverse microclimates within the
                same area.
              </p>
            </Col>
            <Col md={4}>
              <h6 className="text-primary">Symbiotic Relationships:</h6>
              <p className="small">
                Plants in different layers support each other through nutrient
                cycling, pest control, and environmental modification.
              </p>
            </Col>
            <Col md={4}>
              <h6 className="text-primary">Sustainable Production:</h6>
              <p className="small">
                Once established, the system requires minimal external inputs
                while providing diverse food production year-round.
              </p>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default LayerExplanation;
