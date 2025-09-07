"use client";

import {
  Modal,
  Row,
  Col,
  Badge,
  Card,
  Alert,
  Tabs,
  Tab,
} from "react-bootstrap";
import {
  FaTree,
  FaLeaf,
  FaSeedling,
  FaCalendarAlt,
  FaRuler,
  FaThermometerHalf,
  FaTint,
  FaCut,
  FaBug,
  FaAppleAlt,
} from "react-icons/fa";

const TreeDetailModal = ({ show, onHide, tree, sevenLayerData }) => {
  if (!tree) return null;

  // Determine which layer this tree belongs to
  const getTreeLayer = (tree) => {
    for (const [layerNum, layerData] of Object.entries(sevenLayerData)) {
      if (
        layerData.examples.some(
          (example) =>
            tree.name.toLowerCase().includes(example.toLowerCase()) ||
            example.toLowerCase().includes(tree.name.toLowerCase())
        )
      ) {
        return { number: parseInt(layerNum), data: layerData };
      }
    }
    return { number: 2, data: sevenLayerData[2] }; // Default to sub-canopy
  };

  const treeLayer = getTreeLayer(tree);

  const getGrowthStages = (tree) => {
    const yearsToFruit = tree.years_to_fruit || 3;
    return [
      {
        stage: "Seedling",
        duration: "0-6 months",
        description:
          "Initial growth phase, requires regular watering and protection",
        care: ["Daily watering", "Shade protection", "Pest monitoring"],
      },
      {
        stage: "Young Tree",
        duration: `6 months - ${yearsToFruit} years`,
        description: "Establishing root system and main structure",
        care: ["Weekly deep watering", "Structural pruning", "Fertilization"],
      },
      {
        stage: "Mature Tree",
        duration: `${yearsToFruit}+ years`,
        description: "Fruit production phase with established growth",
        care: ["Seasonal pruning", "Harvest management", "Disease prevention"],
      },
    ];
  };

  const getSeasonalCare = (tree) => {
    return {
      spring: {
        tasks: ["Pruning", "Fertilization", "New plantings"],
        description: "Active growth period, ideal for major interventions",
      },
      summer: {
        tasks: ["Watering", "Pest control", "Harvesting"],
        description: "Peak growing season, focus on maintenance and harvest",
      },
      monsoon: {
        tasks: ["Drainage", "Disease prevention", "Support structures"],
        description: "High humidity period, prevent waterlogging and diseases",
      },
      winter: {
        tasks: ["Dormant pruning", "Soil preparation", "Planning"],
        description:
          "Rest period for most trees, prepare for next growing season",
      },
    };
  };

  const getCompanionPlants = (tree) => {
    const companions = {
      tropical: ["Banana", "Papaya", "Ginger", "Turmeric"],
      citrus: ["Mint", "Basil", "Lemongrass", "Curry leaves"],
      stone: ["Lavender", "Rosemary", "Thyme", "Marigold"],
      berry: ["Strawberry", "Mint", "Chives", "Nasturtium"],
      nut: ["Leguminous plants", "Comfrey", "Clover", "Fennel"],
      exotic: ["Herbs", "Spices", "Ground covers", "Nitrogen fixers"],
    };

    return companions[tree.category] || companions.tropical;
  };

  const growthStages = getGrowthStages(tree);
  const seasonalCare = getSeasonalCare(tree);
  const companionPlants = getCompanionPlants(tree);

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header
        closeButton
        className="text-white"
        style={{ backgroundColor: treeLayer.data.color }}
      >
        <Modal.Title className="d-flex align-items-center">
          <FaTree className="me-3" size={24} />
          <div>
            <h4 className="mb-0">{tree.name}</h4>
            <small className="opacity-75">
              Layer {treeLayer.number}: {treeLayer.data.name}
            </small>
          </div>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-0">
        <Tabs defaultActiveKey="overview" className="nav-tabs-custom">
          {/* Overview Tab */}
          <Tab
            eventKey="overview"
            title={
              <span>
                <FaTree className="me-2" />
                Overview
              </span>
            }
          >
            <div className="p-4">
              <Row>
                <Col lg={8}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h5 className="text-success mb-3">Tree Information</h5>
                      <p className="lead">{tree.description}</p>

                      <Row className="mt-4">
                        <Col md={6}>
                          <div className="mb-3">
                            <FaRuler className="text-primary me-2" />
                            <strong>Mature Height:</strong>
                            <Badge bg="info" className="ms-2">
                              {tree.mature_height || "Medium"}
                            </Badge>
                          </div>
                          <div className="mb-3">
                            <FaCalendarAlt className="text-warning me-2" />
                            <strong>Years to Fruit:</strong>
                            <Badge bg="warning" className="ms-2">
                              {tree.years_to_fruit || 3} years
                            </Badge>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <FaAppleAlt className="text-success me-2" />
                            <strong>Category:</strong>
                            <Badge bg="success" className="ms-2">
                              {tree.category || "Fruit"}
                            </Badge>
                          </div>
                          <div className="mb-3">
                            <FaThermometerHalf className="text-danger me-2" />
                            <strong>Season:</strong>
                            <Badge bg="danger" className="ms-2">
                              {tree.season || "Year-round"}
                            </Badge>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={4}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Header
                      className="text-white"
                      style={{ backgroundColor: treeLayer.data.color }}
                    >
                      <h6 className="mb-0">Forest Layer Position</h6>
                    </Card.Header>
                    <Card.Body>
                      <p className="small mb-3">{treeLayer.data.description}</p>

                      <h6 className="text-primary">Layer Benefits:</h6>
                      <ul className="list-unstyled small">
                        {treeLayer.data.benefits.map((benefit, idx) => (
                          <li key={idx} className="mb-1">
                            <FaLeaf className="text-success me-1" size={10} />
                            {benefit}
                          </li>
                        ))}
                      </ul>

                      <Alert variant="light" className="mt-3 small">
                        <strong>Spacing:</strong> {treeLayer.data.spacing}
                      </Alert>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>
          </Tab>

          {/* Growth Stages Tab */}
          <Tab
            eventKey="growth"
            title={
              <span>
                <FaSeedling className="me-2" />
                Growth Stages
              </span>
            }
          >
            <div className="p-4">
              <h5 className="text-success mb-4">
                Growth & Development Timeline
              </h5>

              <Row>
                {growthStages.map((stage, idx) => (
                  <Col md={4} key={idx} className="mb-4">
                    <Card className="h-100 border-success">
                      <Card.Header className="bg-success text-white">
                        <h6 className="mb-0">{stage.stage}</h6>
                        <small>{stage.duration}</small>
                      </Card.Header>
                      <Card.Body>
                        <p className="small mb-3">{stage.description}</p>

                        <h6 className="text-primary">Care Requirements:</h6>
                        <ul className="list-unstyled small">
                          {stage.care.map((care, careIdx) => (
                            <li key={careIdx} className="mb-1">
                              <FaTint className="text-info me-1" size={10} />
                              {care}
                            </li>
                          ))}
                        </ul>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              <Alert variant="info" className="mt-4">
                <strong>Pro Tip:</strong> The timeline may vary based on
                climate, soil conditions, and care quality. Regular monitoring
                and appropriate care will ensure optimal growth.
              </Alert>
            </div>
          </Tab>

          {/* Seasonal Care Tab */}
          <Tab
            eventKey="care"
            title={
              <span>
                <FaCut className="me-2" />
                Seasonal Care
              </span>
            }
          >
            <div className="p-4">
              <h5 className="text-success mb-4">
                Year-Round Management Calendar
              </h5>

              <Row>
                {Object.entries(seasonalCare).map(([season, info], idx) => {
                  const seasonColors = {
                    spring: "success",
                    summer: "warning",
                    monsoon: "info",
                    winter: "primary",
                  };

                  return (
                    <Col md={6} key={idx} className="mb-4">
                      <Card className={`h-100 border-${seasonColors[season]}`}>
                        <Card.Header
                          className={`bg-${seasonColors[season]} text-white`}
                        >
                          <h6 className="mb-0 text-capitalize">{season}</h6>
                        </Card.Header>
                        <Card.Body>
                          <p className="small mb-3">{info.description}</p>

                          <h6 className="text-primary">Key Tasks:</h6>
                          <ul className="list-unstyled small">
                            {info.tasks.map((task, taskIdx) => (
                              <li key={taskIdx} className="mb-2">
                                <FaCut
                                  className={`text-${seasonColors[season]} me-1`}
                                  size={10}
                                />
                                {task}
                              </li>
                            ))}
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </div>
          </Tab>

          {/* Companion Plants Tab */}
          <Tab
            eventKey="companions"
            title={
              <span>
                <FaBug className="me-2" />
                Companion Plants
              </span>
            }
          >
            <div className="p-4">
              <h5 className="text-success mb-4">
                Beneficial Plant Associations
              </h5>

              <Row>
                <Col lg={8}>
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <h6 className="text-primary mb-3">
                        Recommended Companion Plants:
                      </h6>
                      <div className="d-flex flex-wrap gap-2 mb-4">
                        {companionPlants.map((plant, idx) => (
                          <Badge key={idx} bg="success" className="p-2">
                            {plant}
                          </Badge>
                        ))}
                      </div>

                      <h6 className="text-primary mb-3">
                        Benefits of Companion Planting:
                      </h6>
                      <ul className="list-unstyled">
                        <li className="mb-2">
                          <FaBug className="text-warning me-2" />
                          Natural pest control and beneficial insect attraction
                        </li>
                        <li className="mb-2">
                          <FaTint className="text-info me-2" />
                          Improved soil moisture retention and nutrient cycling
                        </li>
                        <li className="mb-2">
                          <FaLeaf className="text-success me-2" />
                          Enhanced biodiversity and ecosystem stability
                        </li>
                        <li className="mb-2">
                          <FaSeedling className="text-primary me-2" />
                          Maximized space utilization and yield per square foot
                        </li>
                      </ul>
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={4}>
                  <Card className="border-warning">
                    <Card.Header className="bg-warning text-dark">
                      <h6 className="mb-0">Planting Tips</h6>
                    </Card.Header>
                    <Card.Body>
                      <ul className="list-unstyled small">
                        <li className="mb-2">
                          • Plant companions at appropriate distances
                        </li>
                        <li className="mb-2">
                          • Consider mature sizes when spacing
                        </li>
                        <li className="mb-2">
                          • Rotate annual companions seasonally
                        </li>
                        <li className="mb-2">
                          • Monitor for competition for resources
                        </li>
                        <li className="mb-2">
                          • Use nitrogen-fixing plants to improve soil
                        </li>
                      </ul>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>
          </Tab>
        </Tabs>
      </Modal.Body>
    </Modal>
  );
};

export default TreeDetailModal;
