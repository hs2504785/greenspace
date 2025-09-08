"use client";

import { useState } from "react";
import {
  Card,
  Row,
  Col,
  Badge,
  Alert,
  Button,
  Offcanvas,
} from "react-bootstrap";
import {
  FaTree,
  FaLeaf,
  FaSeedling,
  FaVine,
  FaCarrot,
  FaInfoCircle,
  FaTimes,
  FaMapMarkerAlt,
  FaRuler,
  FaSun,
  FaTint,
  FaCalendarAlt,
  FaTools,
  FaAppleAlt,
  FaLemon,
} from "react-icons/fa";
import styles from "./InteractiveGridLayerGuide.module.css";

const InteractiveGridLayerGuide = () => {
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [offcanvasData, setOffcanvasData] = useState(null);

  // Function to get plant emoji icon and color
  const getPlantIcon = (plantName) => {
    const plant = plantName.toLowerCase();
    if (plant.includes("mango")) return { icon: "🥭", color: "#FF6B35" };
    if (plant.includes("jackfruit")) return { icon: "🍈", color: "#8B4513" };
    if (plant.includes("cashew")) return { icon: "🌰", color: "#D2691E" };
    if (plant.includes("coconut")) return { icon: "🥥", color: "#8B4513" };
    if (plant.includes("pomegranate")) return { icon: "🌱", color: "#DC143C" };
    if (plant.includes("guava")) return { icon: "🍃", color: "#228B22" };
    if (plant.includes("apple")) return { icon: "🍎", color: "#FF0000" };
    if (plant.includes("pear")) return { icon: "🍐", color: "#B8860B" };
    if (plant.includes("cherry")) return { icon: "🍒", color: "#DC143C" };
    if (plant.includes("grapes")) return { icon: "🍇", color: "#800080" };
    if (plant.includes("passion")) return { icon: "🍇", color: "#FF4500" };
    if (plant.includes("beans")) return { icon: "🫘", color: "#228B22" };
    if (plant.includes("pepper")) return { icon: "🌶️", color: "#FF6347" };
    if (plant.includes("sweet potato")) return { icon: "🍠", color: "#FF8C00" };
    if (plant.includes("ginger")) return { icon: "🫚", color: "#DAA520" };
    if (plant.includes("turmeric")) return { icon: "🌶️", color: "#B8860B" };
    if (plant.includes("strawberry")) return { icon: "🍓", color: "#FF69B4" };
    if (plant.includes("mint")) return { icon: "🌿", color: "#006400" };
    if (plant.includes("moringa")) return { icon: "🌿", color: "#32CD32" };
    if (plant.includes("spice")) return { icon: "🌿", color: "#8B4513" };
    if (plant.includes("herb")) return { icon: "🌿", color: "#228B22" };
    if (plant.includes("lemon")) return { icon: "🍋", color: "#DAA520" };
    // Default icon for other plants
    return { icon: "🌱", color: "#228B22" };
  };

  // Define the 7 layers with their properties
  const sevenLayers = {
    1: {
      name: "Overstory Tree Layer (60-100+ ft)",
      description:
        "Large canopy trees - the forest ceiling that provides shade and structure for the entire system",
      color: "#2d5016",
      examples: ["Mango", "Jackfruit", "Cashew", "Large Coconut"],
      positions: [0, 24],
      icon: <FaTree size={24} />,
      gridPositions: ["(0,12)", "(24,12)"],
      spacing: "24ft apart",
      plantingDepth: "3-4 feet",
      soilRequirements: "Deep, well-drained soil",
      sunRequirements: "Full sun",
      waterNeeds: "Moderate to high",
      harvestTime: "3-7 years to fruit",
      benefits: [
        "Provides shade",
        "Wind protection",
        "Carbon sequestration",
        "Main fruit production",
      ],
      managementTips: [
        "Annual pruning",
        "Deep watering",
        "Mulching around base",
        "Pest monitoring",
      ],
      companionPlants: ["Can support vines", "Provides canopy for understory"],
      seasonalCare: {
        spring: "Pruning, fertilizing",
        summer: "Deep watering, pest control",
        autumn: "Harvest, soil preparation",
        winter: "Dormant season care",
      },
    },
    2: {
      name: "Understory Tree Layer (20-60 ft)",
      description: "Medium-sized fruit trees under the canopy",
      color: "#4a7c59",
      examples: ["Pomegranate", "Guava", "Apple", "Pear"],
      positions: [12],
      icon: <FaTree size={20} />,
      gridPositions: ["(12,12)"],
    },
    3: {
      name: "Shrub Layer (3-20 ft)",
      description: "Berry bushes and small fruit trees",
      color: "#7fb069",
      examples: ["Barbados Cherry", "Blueberry", "Karonda"],
      positions: [6, 18],
      icon: <FaLeaf size={18} />,
      gridPositions: ["(6,12)", "(18,12)"],
    },
    4: {
      name: "Herbaceous Layer (1-3 ft)",
      description: "Non-woody perennial plants and herbs",
      color: "#a7c957",
      examples: ["Moringa leaves", "Spice plants", "Medicinal herbs"],
      positions: "Between trees in 3ft beds",
      icon: <FaSeedling size={16} />,
      gridPositions: ["Multiple positions between trees"],
    },
    5: {
      name: "Ground Cover Layer (0-1 ft)",
      description: "Low-growing plants covering the soil",
      color: "#c9e265",
      examples: ["Strawberry", "Mint", "Living mulch"],
      positions: "Covering entire beds",
      icon: <FaSeedling size={12} />,
      gridPositions: ["Throughout 3ft wide beds"],
    },
    6: {
      name: "Vine Layer (Climbing)",
      description: "Climbing plants using trees for support",
      color: "#f4a261",
      examples: ["Grapes", "Passion fruit", "Pepper vines", "Climbing beans"],
      positions: "On big and medium trees",
      icon: <FaVine size={16} />,
      gridPositions: ["(0,12)", "(12,12)", "(24,12) - climbing on trees"],
    },
    7: {
      name: "Root Layer (Underground)",
      description: "Root vegetables and tubers",
      color: "#e76f51",
      examples: ["Sweet potato", "Ginger", "Turmeric"],
      positions: "Underground throughout",
      icon: <FaCarrot size={16} />,
      gridPositions: ["Underground at all available positions"],
    },
  };

  // Define specific grid positions and what can be planted there
  const gridPositions = {
    // Big Tree positions (Layer 1) - Largest circles
    "0,12": {
      layers: [1, 6],
      primary: 1,
      label: "Big Tree + Vine",
      size: "big",
    },
    "24,12": {
      layers: [1, 6],
      primary: 1,
      label: "Big Tree + Vine",
      size: "big",
    },

    // Medium Tree position (Layer 2) - Medium-large circles
    "12,12": {
      layers: [2, 6],
      primary: 2,
      label: "Medium Tree + Vine",
      size: "medium",
    },

    // Small Tree positions (Layer 3) - Medium circles
    "6,12": { layers: [3], primary: 3, label: "Small Tree", size: "small" },
    "18,12": { layers: [3], primary: 3, label: "Small Tree", size: "small" },

    // Herbaceous positions (Layer 4) - Small circles
    "3,12": {
      layers: [4, 5, 7],
      primary: 4,
      label: "Herbs + Ground Cover + Roots",
      size: "herbaceous",
    },
    "9,12": {
      layers: [4, 5, 7],
      primary: 4,
      label: "Herbs + Ground Cover + Roots",
      size: "herbaceous",
    },
    "15,12": {
      layers: [4, 5, 7],
      primary: 4,
      label: "Herbs + Ground Cover + Roots",
      size: "herbaceous",
    },
    "21,12": {
      layers: [4, 5, 7],
      primary: 4,
      label: "Herbs + Ground Cover + Roots",
      size: "herbaceous",
    },
  };

  const handlePositionClick = (x, y) => {
    const key = `${x},${y}`;
    if (gridPositions[key]) {
      setSelectedPosition({ x, y, ...gridPositions[key] });
    } else if (y === 10.5 || y === 13.5) {
      // Root layer positions (1.5ft above/below main row)
      setSelectedPosition({
        x,
        y,
        layers: [7],
        primary: 7,
        label: "Root Layer (Underground)",
        size: "root",
      });
    } else {
      // For other positions, show general ground cover/root options
      setSelectedPosition({
        x,
        y,
        layers: [5, 7],
        primary: 5,
        label: "Ground Cover + Roots",
      });
    }
  };

  const handleLayerClick = (layerId) => {
    setSelectedLayer(selectedLayer === layerId ? null : layerId);
  };

  const handlePositionDetails = (layerData, position = null) => {
    setOffcanvasData({
      ...layerData,
      clickedPosition: position,
    });
    setShowOffcanvas(true);
  };

  // Generate grid points with proper size hierarchy
  const generateGridPoints = () => {
    const points = [];

    // Define circle sizes for different layers
    const getCircleSize = (positionData) => {
      if (!positionData) return 6; // Default small size for empty positions (doubled from 3)

      switch (positionData.size) {
        case "big":
          return 24; // Big trees (Layer 1) - Largest (doubled from 12)
        case "medium":
          return 18; // Medium trees (Layer 2) - Medium-large (doubled from 9)
        case "small":
          return 14; // Small trees (Layer 3) - Medium (doubled from 7)
        case "herbaceous":
          return 10; // Herbaceous (Layer 4) - Small (doubled from 5)
        default:
          return 6; // Ground cover/roots - Smallest (doubled from 3)
      }
    };

    for (let x = 0; x <= 24; x += 3) {
      for (let y = 0; y <= 24; y += 3) {
        const key = `${x},${y}`;
        const positionData = gridPositions[key];
        const circleSize = getCircleSize(positionData);

        // Get consistent color based on size/layer type
        const getCircleColor = (positionData) => {
          if (!positionData) return "#ddd"; // Default gray for empty positions

          switch (positionData.size) {
            case "big":
              return "#2d5016"; // Dark green for Big trees (Layer 1)
            case "medium":
              return "#4a7c59"; // Medium green for Medium trees (Layer 2)
            case "small":
              return "#7fb069"; // Light green for Small trees (Layer 3)
            case "herbaceous":
              return "#a7c957"; // Yellow-green for Herbaceous (Layer 4)
            default:
              return "#c9e265"; // Light yellow-green for Ground cover
          }
        };

        // Get layer number to display
        const getLayerNumber = (positionData) => {
          if (!positionData) return "";
          return positionData.primary.toString();
        };

        const centerX = x * 20 + 50;
        const centerY = y * 20 + 50;
        const layerNumber = getLayerNumber(positionData);

        // Check if this position should be highlighted or dimmed
        const isHighlighted =
          selectedLayer &&
          positionData &&
          positionData.primary === selectedLayer;
        const isDimmed =
          selectedLayer &&
          (!positionData || positionData.primary !== selectedLayer);

        // Special handling for vine layer (Layer 6)
        // When Layer 6 is selected, only highlight vine badges, not the supporting trees
        const isVineLayerSelected = selectedLayer === 6;
        const hasVineSupport = positionData && positionData.layers.includes(6);

        // For vine layer selection, we want to dim the trees but highlight vine badges separately
        const isVineHighlighted = false; // Trees should not be highlighted when Layer 6 is selected
        const isVineDimmed =
          isVineLayerSelected && (!positionData || positionData.primary !== 6);

        points.push(
          <g
            key={`${x}-${y}`}
            className={
              selectedLayer === 6
                ? isVineDimmed
                  ? styles.dimmed
                  : "" // Don't highlight the tree when Layer 6 is selected
                : isDimmed
                ? styles.dimmed
                : isHighlighted
                ? styles.highlighted
                : ""
            }
          >
            {/* Outlined circle */}
            <circle
              cx={centerX}
              cy={centerY}
              r={circleSize}
              fill="white"
              stroke={getCircleColor(positionData)}
              strokeWidth={
                selectedPosition &&
                selectedPosition.x === x &&
                selectedPosition.y === y
                  ? 4
                  : 2
              }
              className={styles.gridPoint}
              onClick={() => {
                if (positionData) {
                  handlePositionDetails(sevenLayers[positionData.primary], {
                    x,
                    y,
                  });
                }
              }}
              style={{ cursor: "pointer" }}
            />
            {/* Layer number text */}
            {layerNumber && (
              <text
                x={centerX}
                y={centerY + 4} // Slight offset for better centering
                textAnchor="middle"
                fontSize={
                  circleSize > 16
                    ? "18"
                    : circleSize > 12
                    ? "16"
                    : circleSize > 8
                    ? "14"
                    : "12"
                }
                fill={getCircleColor(positionData)}
                fontWeight="bold"
                className={styles.layerNumber}
                onClick={() => handlePositionClick(x, y)}
                style={{ cursor: "pointer", userSelect: "none" }}
              >
                {layerNumber}
              </text>
            )}
          </g>
        );
      }
    }

    // Add root layer positions at 1.5ft offset (top and bottom of main grid)
    for (let x = 0; x <= 24; x += 3) {
      // Top row root positions (1.5ft above main row)
      const topRootY = 12 - 1.5;
      const topKey = `${x},${topRootY}`;
      const topCenterX = x * 20 + 50;
      const topCenterY = topRootY * 20 + 50;

      // Check if root positions should be highlighted or dimmed
      const isRootHighlighted = selectedLayer === 7;
      const isRootDimmed = selectedLayer && selectedLayer !== 7;

      points.push(
        <g
          key={`root-top-${x}`}
          className={
            isRootDimmed
              ? styles.dimmed
              : isRootHighlighted
              ? styles.highlighted
              : ""
          }
        >
          <circle
            cx={topCenterX}
            cy={topCenterY}
            r="6"
            fill="white"
            stroke="#e76f51"
            strokeWidth="2"
            className={styles.rootPoint}
            onClick={() => handlePositionClick(x, topRootY)}
            style={{ cursor: "pointer" }}
          />
          <text
            x={topCenterX}
            y={topCenterY + 3}
            textAnchor="middle"
            fontSize="10"
            fill="#e76f51"
            fontWeight="bold"
            className={styles.rootNumber}
            onClick={() => handlePositionClick(x, topRootY)}
            style={{ cursor: "pointer", userSelect: "none" }}
          >
            7
          </text>
        </g>
      );

      // Bottom row root positions (1.5ft below main row)
      const bottomRootY = 12 + 1.5;
      const bottomKey = `${x},${bottomRootY}`;
      const bottomCenterX = x * 20 + 50;
      const bottomCenterY = bottomRootY * 20 + 50;

      points.push(
        <g
          key={`root-bottom-${x}`}
          className={
            isRootDimmed
              ? styles.dimmed
              : isRootHighlighted
              ? styles.highlighted
              : ""
          }
        >
          <circle
            cx={bottomCenterX}
            cy={bottomCenterY}
            r="6"
            fill="white"
            stroke="#e76f51"
            strokeWidth="2"
            className={styles.rootPoint}
            onClick={() => handlePositionClick(x, bottomRootY)}
            style={{ cursor: "pointer" }}
          />
          <text
            x={bottomCenterX}
            y={bottomCenterY + 3}
            textAnchor="middle"
            fontSize="10"
            fill="#e76f51"
            fontWeight="bold"
            className={styles.rootNumber}
            onClick={() => handlePositionClick(x, bottomRootY)}
            style={{ cursor: "pointer", userSelect: "none" }}
          >
            7
          </text>
        </g>
      );
    }

    // Add vine layer positions - separate from trees, positioned near supporting trees
    const vinePositions = [
      { x: 0, treeType: "Big Tree" }, // Big tree at 0ft
      { x: 12, treeType: "Medium Tree" }, // Medium tree at 12ft
      { x: 24, treeType: "Big Tree" }, // Big tree at 24ft
    ];

    vinePositions.forEach(({ x, treeType }) => {
      const vineCenterX = x * 20 + 50 + 30; // Position to the right of tree
      const vineCenterY = 12 * 20 + 50; // Same horizontal line as trees

      // Check if vine positions should be highlighted or dimmed
      const isVineHighlighted = selectedLayer === 6;
      const isVineDimmed = selectedLayer && selectedLayer !== 6;

      points.push(
        <g
          key={`vine-${x}`}
          className={
            isVineDimmed
              ? styles.dimmed
              : isVineHighlighted
              ? styles.vineHighlighted
              : ""
          }
        >
          <circle
            cx={vineCenterX}
            cy={vineCenterY}
            r="8"
            fill="#f4a261"
            stroke="white"
            strokeWidth="2"
            className={styles.vinePoint}
            onClick={(e) => {
              e.stopPropagation(); // Prevent event bubbling to tree
              handlePositionDetails(sevenLayers[6], { x, y: 12, treeType });
            }}
            style={{ cursor: "pointer" }}
          />
          <text
            x={vineCenterX}
            y={vineCenterY + 3}
            textAnchor="middle"
            fontSize="10"
            fill="white"
            fontWeight="bold"
            className={styles.vineNumber}
            onClick={(e) => {
              e.stopPropagation(); // Prevent event bubbling to tree
              handlePositionDetails(sevenLayers[6], { x, y: 12, treeType });
            }}
            style={{ cursor: "pointer", userSelect: "none" }}
          >
            6
          </text>
        </g>
      );
    });

    return points;
  };

  return (
    <div className="mt-4">
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-success text-white">
          <h5 className="mb-0">
            <FaTree className="me-2" />
            Interactive 24×24 Grid: 7-Layer Food Forest Guide
          </h5>
        </Card.Header>
        <Card.Body>
          <Alert variant="info" className="mb-4">
            <FaInfoCircle className="me-2" />
            <strong>Click on any grid position</strong> to see what layers can
            be planted there. Each grid square represents 1ft × 1ft. Circle
            sizes show layer hierarchy:
            <br />
            <small className="mt-1 d-block">
              <span style={{ color: "#2d5016" }}>●</span>{" "}
              <strong>Largest</strong>: Big Trees (0ft, 24ft) •
              <span style={{ color: "#4a7c59" }}>●</span> <strong>Large</strong>
              : Medium Tree (12ft) •<span style={{ color: "#7fb069" }}>●</span>{" "}
              <strong>Medium</strong>: Small Trees (6ft, 18ft) •
              <span style={{ color: "#a7c957" }}>●</span> <strong>Small</strong>
              : Herbaceous Layer (3ft intervals)
            </small>
          </Alert>

          <Row>
            <Col lg={8}>
              {/* Interactive Grid */}
              <Card className="mb-4">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    24×24 ft Grid Layout (Click positions to explore)
                  </h6>
                </Card.Header>
                <Card.Body className="text-center">
                  <svg
                    width="550"
                    height="550"
                    viewBox="0 0 600 600"
                    className={styles.gridSvg}
                  >
                    {/* Grid lines */}
                    {Array.from({ length: 9 }, (_, i) => (
                      <g key={`lines-${i}`}>
                        <line
                          x1={50}
                          y1={i * 60 + 50}
                          x2={530}
                          y2={i * 60 + 50}
                          stroke="#e0e0e0"
                          strokeWidth="1"
                        />
                        <line
                          x1={i * 60 + 50}
                          y1={50}
                          x2={i * 60 + 50}
                          y2={530}
                          stroke="#e0e0e0"
                          strokeWidth="1"
                        />
                      </g>
                    ))}

                    {/* Grid points */}
                    {generateGridPoints()}

                    {/* Labels - Top row with all positions marked */}
                    <text x={50} y={40} fontSize="12" fill="#666">
                      0ft
                    </text>
                    <text x={170} y={40} fontSize="12" fill="#666">
                      6ft
                    </text>
                    <text x={290} y={40} fontSize="12" fill="#666">
                      12ft
                    </text>
                    <text x={410} y={40} fontSize="12" fill="#666">
                      18ft
                    </text>
                    <text x={530} y={40} fontSize="12" fill="#666">
                      24ft
                    </text>
                  </svg>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              {/* Layer Legend */}
              <Card className="mb-4">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">7-Layer Legend</h6>
                </Card.Header>
                <Card.Body>
                  {Object.entries(sevenLayers).map(([layerId, layer]) => (
                    <div
                      key={layerId}
                      className={`d-flex align-items-center mb-2 p-2 rounded ${styles.layerItem}`}
                      style={{
                        backgroundColor:
                          selectedLayer === parseInt(layerId)
                            ? `${layer.color}20`
                            : "transparent",
                        border:
                          selectedLayer === parseInt(layerId)
                            ? `2px solid ${layer.color}`
                            : "1px solid #e0e0e0",
                        cursor: "pointer",
                      }}
                      onClick={() => handleLayerClick(parseInt(layerId))}
                    >
                      <div
                        className="me-2"
                        style={{
                          width: "20px",
                          height: "20px",
                          backgroundColor: layer.color,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          style={{
                            color: "white",
                            fontSize: "10px",
                            fontWeight: "bold",
                          }}
                        >
                          {layerId}
                        </span>
                      </div>
                      <div>
                        <small className="fw-bold">
                          {layer.name.split("(")[0]}
                        </small>
                        <br />
                        <small className="text-muted">
                          {layer.examples.slice(0, 2).join(", ")}
                        </small>
                      </div>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Grid Position Summary */}
          <Card className="mt-4 border-primary">
            <Card.Header className="bg-primary text-white">
              <h6 className="mb-0">
                <FaInfoCircle className="me-2" />
                Layer Positioning Summary
              </h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h6 className="text-primary">
                    Tree Positions (Main Structure):
                  </h6>
                  <ul className="list-unstyled">
                    <li className="mb-1">
                      <Badge bg="dark" className="me-2">
                        0ft, 24ft
                      </Badge>
                      <strong>Big Trees (Layer 1)</strong> - Overstory canopy
                    </li>
                    <li className="mb-1">
                      <Badge bg="secondary" className="me-2">
                        12ft
                      </Badge>
                      <strong>Medium Tree (Layer 2)</strong> - Understory
                    </li>
                    <li className="mb-1">
                      <Badge bg="success" className="me-2">
                        6ft, 18ft
                      </Badge>
                      <strong>Small Trees (Layer 3)</strong> - Shrub layer
                    </li>
                  </ul>
                </Col>
                <Col md={6}>
                  <h6 className="text-warning">Ground Layers (Fill spaces):</h6>
                  <ul className="list-unstyled">
                    <li className="mb-1">
                      <Badge bg="warning" className="me-2">
                        3ft intervals
                      </Badge>
                      <strong>Herbs (Layer 4)</strong> - Between trees
                    </li>
                    <li className="mb-1">
                      <Badge bg="info" className="me-2">
                        Everywhere
                      </Badge>
                      <strong>Ground Cover (Layer 5)</strong> - Soil protection
                    </li>
                    <li className="mb-1">
                      <Badge bg="danger" className="me-2">
                        Underground
                      </Badge>
                      <strong>Roots (Layer 7)</strong> - Below ground
                    </li>
                    <li className="mb-1">
                      <Badge
                        style={{ backgroundColor: "#f4a261" }}
                        className="me-2"
                      >
                        On trees
                      </Badge>
                      <strong>Vines (Layer 6)</strong> - Climbing support
                    </li>
                  </ul>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* 7-Layer System Explanation */}
          <Card className="mt-4 border-success">
            <Card.Header className="bg-success text-white">
              <h6 className="mb-0">
                <FaTree className="me-2" />
                7-Layer System on 1ft × 1ft Grid Layout
              </h6>
            </Card.Header>
            <Card.Body>
              <Alert variant="success" className="mb-4">
                <strong>Complete Food Forest System:</strong> Each layer serves
                a specific function, creating a self-sustaining ecosystem that
                maximizes food production while mimicking natural forest
                patterns.
              </Alert>

              <Row>
                <Col md={4}>
                  <h6 className="text-success">Tree Layers (Heights):</h6>
                  <div className="mb-2">
                    <Badge bg="dark" className="me-2">
                      Layer 1
                    </Badge>
                    <strong>Overstory (60-100+ ft)</strong>
                    <br />
                    <small className="text-muted">
                      Big trees - main canopy
                    </small>
                  </div>
                  <div className="mb-2">
                    <Badge
                      style={{ backgroundColor: sevenLayers[2].color }}
                      className="me-2"
                    >
                      Layer 2
                    </Badge>
                    <strong>Understory (20-60 ft)</strong>
                    <br />
                    <small className="text-muted">
                      Medium trees - secondary canopy
                    </small>
                  </div>
                  <div className="mb-3">
                    <Badge
                      style={{ backgroundColor: sevenLayers[3].color }}
                      className="me-2"
                    >
                      Layer 3
                    </Badge>
                    <strong>Shrub Layer (3-20 ft)</strong>
                    <br />
                    <small className="text-muted">Small trees & bushes</small>
                  </div>
                </Col>
                <Col md={4}>
                  <h6 className="text-info">Ground Layers:</h6>
                  <div className="mb-2">
                    <Badge
                      style={{ backgroundColor: sevenLayers[4].color }}
                      className="me-2"
                    >
                      Layer 4
                    </Badge>
                    <strong>Herbaceous (1-3 ft)</strong>
                    <br />
                    <small className="text-muted">
                      Herbs, vegetables, perennials
                    </small>
                  </div>
                  <div className="mb-2">
                    <Badge
                      style={{ backgroundColor: sevenLayers[5].color }}
                      className="me-2"
                    >
                      Layer 5
                    </Badge>
                    <strong>Ground Cover (0-1 ft)</strong>
                    <br />
                    <small className="text-muted">
                      Spreading plants, living mulch
                    </small>
                  </div>
                  <div className="mb-3">
                    <Badge
                      style={{ backgroundColor: sevenLayers[7].color }}
                      className="me-2"
                    >
                      Layer 7
                    </Badge>
                    <strong>Root Layer (Underground)</strong>
                    <br />
                    <small className="text-muted">
                      Root vegetables, tubers
                    </small>
                  </div>
                </Col>
                <Col md={4}>
                  <h6 className="text-warning">Climbing Layer:</h6>
                  <div className="mb-2">
                    <Badge
                      style={{ backgroundColor: sevenLayers[6].color }}
                      className="me-2"
                    >
                      Layer 6
                    </Badge>
                    <strong>Vine Layer (Climbing)</strong>
                    <br />
                    <small className="text-muted">
                      Uses trees for vertical support
                    </small>
                  </div>

                  <h6 className="text-secondary mt-3">Benefits:</h6>
                  <ul className="list-unstyled small">
                    <li>✅ Maximum space utilization</li>
                    <li>✅ Diverse food production</li>
                    <li>✅ Natural pest control</li>
                    <li>✅ Soil improvement</li>
                    <li>✅ Water conservation</li>
                    <li>✅ Carbon sequestration</li>
                  </ul>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Precise Grid Placement Analysis */}
          <Card className="mt-4 border-success">
            <Card.Header className="bg-success text-white">
              <h6 className="mb-0">
                <FaTree className="me-2" />
                Precise Grid Placement Analysis (1ft × 1ft Grid)
              </h6>
            </Card.Header>
            <Card.Body>
              <Alert variant="primary" className="mb-4">
                <strong>Based on Your Grid Layout:</strong> Trees planted at
                grid intersections with precise 1ft spacing for optimal layer
                integration and maximum productivity.
              </Alert>

              <Row>
                <Col md={6}>
                  <h6 className="text-success">Tree Positions on Grid:</h6>
                  <div className="mb-2">
                    <Badge bg="dark" className="me-2">
                      Big Trees (Layer 1)
                    </Badge>
                    <strong>Positions: (0,12) & (24,12)</strong>
                    <br />
                    <small className="text-muted">
                      24ft apart - maximum canopy spread without overlap
                    </small>
                  </div>
                  <div className="mb-2">
                    <Badge
                      style={{ backgroundColor: sevenLayers[2].color }}
                      className="me-2"
                    >
                      Medium Tree (Layer 2)
                    </Badge>
                    <strong>Position: (12,12)</strong>
                    <br />
                    <small className="text-muted">
                      Center - 12ft from each big tree
                    </small>
                  </div>
                  <div className="mb-3">
                    <Badge
                      style={{ backgroundColor: sevenLayers[3].color }}
                      className="me-2"
                    >
                      Small Trees (Layer 3)
                    </Badge>
                    <strong>Positions: (6,12) & (18,12)</strong>
                    <br />
                    <small className="text-muted">
                      6ft spacing - fills gaps between larger trees
                    </small>
                  </div>

                  <Alert variant="info" className="small">
                    <strong>Tree Spacing Logic:</strong> Each tree size has
                    optimal spacing to prevent competition while maximizing
                    canopy coverage.
                  </Alert>
                </Col>
                <Col md={6}>
                  <h6 className="text-warning">Layer Capacity per 24ft Row:</h6>
                  <div className="mb-2">
                    <Badge
                      style={{ backgroundColor: sevenLayers[7].color }}
                      className="me-2"
                    >
                      Root Vegetables
                    </Badge>
                    <strong>18 plants per row</strong>
                    <br />
                    <small className="text-muted">
                      9 top positions + 9 bottom positions at 1.5ft offset
                    </small>
                  </div>
                  <div className="mb-2">
                    <Badge
                      style={{ backgroundColor: sevenLayers[4].color }}
                      className="me-2"
                    >
                      Herbaceous Layer
                    </Badge>
                    <strong>4 positions per row</strong>
                    <br />
                    <small className="text-muted">
                      At 3ft, 9ft, 15ft, 21ft - between trees
                    </small>
                  </div>
                  <div className="mb-2">
                    <Badge
                      style={{ backgroundColor: sevenLayers[6].color }}
                      className="me-2"
                    >
                      Vine Layer
                    </Badge>
                    <strong>3 vines per row</strong>
                    <br />
                    <small className="text-muted">
                      On Big Trees (0ft, 24ft) + Medium Tree (12ft)
                    </small>
                  </div>
                  <div className="mb-2">
                    <Badge
                      style={{ backgroundColor: sevenLayers[5].color }}
                      className="me-2"
                    >
                      Ground Cover
                    </Badge>
                    <strong>Full coverage</strong>
                    <br />
                    <small className="text-muted">
                      Spreads throughout available ground space
                    </small>
                  </div>
                </Col>
              </Row>

              <hr />

              <h6 className="text-primary">
                Vine Placement on Grid Intersections:
              </h6>
              <Row className="g-3">
                <Col md={4}>
                  <div className="text-center p-3 border rounded bg-light">
                    <strong className="text-success">Vine Position 1</strong>
                    <br />
                    <small>Grid: (0,12) - Big Tree</small>
                    <br />
                    <Badge bg="success" className="mt-1">
                      Heavy Vines
                    </Badge>
                    <br />
                    <small className="text-muted">Grapes, Passion Fruit</small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center p-3 border rounded bg-light">
                    <strong className="text-success">Vine Position 2</strong>
                    <br />
                    <small>Grid: (12,12) - Medium Tree</small>
                    <br />
                    <Badge bg="warning" className="mt-1">
                      Medium Vines
                    </Badge>
                    <br />
                    <small className="text-muted">Climbing Beans, Pepper</small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center p-3 border rounded bg-light">
                    <strong className="text-success">Vine Position 3</strong>
                    <br />
                    <small>Grid: (24,12) - Big Tree</small>
                    <br />
                    <Badge bg="success" className="mt-1">
                      Heavy Vines
                    </Badge>
                    <br />
                    <small className="text-muted">Dragon Fruit, Kiwi</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* 24x24 Layout Specifications */}
          <Card className="mt-4 border-primary">
            <Card.Header className="bg-primary text-white">
              <h6 className="mb-0">
                <FaRuler className="me-2" />
                24×24 ft Layout Specifications
              </h6>
            </Card.Header>
            <Card.Body>
              <Alert variant="info" className="mb-4">
                <strong>Complete Layout Analysis:</strong> Detailed
                specifications for implementing the 7-layer system in a 24×24 ft
                plot with maximum efficiency.
              </Alert>

              <Row>
                <Col md={6}>
                  <h6 className="text-primary">Physical Layout:</h6>
                  <div className="mb-3">
                    <strong>Total Area:</strong> 576 sq ft (24×24)
                    <br />
                    <strong>Grid Resolution:</strong> 1ft × 1ft precision
                    <br />
                    <strong>Main Tree Row:</strong> Center line at 12ft
                    <br />
                    <strong>Root Zones:</strong> 1.5ft above/below main row
                    <br />
                    <strong>Bed Width:</strong> 3ft wide planting beds
                  </div>

                  <h6 className="text-success">Tree Specifications:</h6>
                  <div className="mb-2">
                    <Badge bg="dark" className="me-2">
                      Big Trees
                    </Badge>
                    <strong>2 trees</strong> - 24ft spacing
                    <br />
                    <small>Mature spread: 15-20ft diameter</small>
                  </div>
                  <div className="mb-2">
                    <Badge
                      style={{ backgroundColor: sevenLayers[2].color }}
                      className="me-2"
                    >
                      Medium Tree
                    </Badge>
                    <strong>1 tree</strong> - center position
                    <br />
                    <small>Mature spread: 10-15ft diameter</small>
                  </div>
                  <div className="mb-3">
                    <Badge
                      style={{ backgroundColor: sevenLayers[3].color }}
                      className="me-2"
                    >
                      Small Trees
                    </Badge>
                    <strong>2 trees</strong> - 6ft from center
                    <br />
                    <small>Mature spread: 6-10ft diameter</small>
                  </div>
                </Col>
                <Col md={6}>
                  <h6 className="text-warning">Production Capacity:</h6>
                  <div className="mb-2">
                    <strong>Annual Fruit Yield:</strong>
                    <br />
                    <small>• Big Trees: 100-200kg each</small>
                    <br />
                    <small>• Medium Tree: 50-100kg</small>
                    <br />
                    <small>• Small Trees: 20-50kg each</small>
                    <br />
                    <small>• Vines: 20-40kg total</small>
                  </div>

                  <div className="mb-2">
                    <strong>Vegetable Production:</strong>
                    <br />
                    <small>• Root Vegetables: 18 plants</small>
                    <br />
                    <small>• Herbaceous: 4 major positions</small>
                    <br />
                    <small>• Ground Cover: Continuous harvest</small>
                  </div>

                  <div className="mb-3">
                    <strong>Ecosystem Services:</strong>
                    <br />
                    <small>• Carbon Storage: 2-3 tons/year</small>
                    <br />
                    <small>• Water Retention: 80% improvement</small>
                    <br />
                    <small>• Biodiversity: 50+ species</small>
                    <br />
                    <small>• Soil Health: 300% organic matter increase</small>
                  </div>

                  <Alert variant="success" className="small">
                    <strong>ROI Timeline:</strong> Full productivity achieved in
                    5-7 years with sustainable 20+ year lifespan.
                  </Alert>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Card.Body>
      </Card>

      {/* Layer Details Offcanvas */}
      <Offcanvas
        show={showOffcanvas}
        onHide={() => setShowOffcanvas(false)}
        placement="end"
        style={{ width: "400px" }}
      >
        <Offcanvas.Header closeButton className="bg-success text-white">
          <Offcanvas.Title>
            {offcanvasData && (
              <>
                {offcanvasData.icon}
                <span className="ms-2">{offcanvasData.name}</span>
              </>
            )}
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {offcanvasData && (
            <>
              {/* Position Info */}
              {offcanvasData.clickedPosition && (
                <Alert variant="info" className="mb-3">
                  <FaMapMarkerAlt className="me-2" />
                  <strong>Position:</strong> ({offcanvasData.clickedPosition.x}
                  ft, {offcanvasData.clickedPosition.y}ft)
                  {offcanvasData.clickedPosition.treeType && (
                    <span> - {offcanvasData.clickedPosition.treeType}</span>
                  )}
                </Alert>
              )}

              {/* Description */}
              <Card className="mb-3">
                <Card.Body>
                  <p className="text-muted">{offcanvasData.description}</p>
                </Card.Body>
              </Card>

              {/* Plant Examples */}
              <Card className="mb-3">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <FaSeedling className="me-2 text-success" />
                    Recommended Plants
                  </h6>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex flex-wrap gap-2">
                    {offcanvasData.examples.map((plant, index) => {
                      const plantInfo = getPlantIcon(plant);
                      return (
                        <Badge
                          key={index}
                          bg="outline-success"
                          className="p-2 d-flex align-items-center gap-1"
                          style={{
                            border: `2px solid ${plantInfo.color}`,
                            color: plantInfo.color,
                            backgroundColor: "transparent",
                            fontSize: "0.875rem",
                            fontWeight: "500",
                          }}
                        >
                          <span style={{ fontSize: "16px" }}>
                            {plantInfo.icon}
                          </span>
                          {plant}
                        </Badge>
                      );
                    })}
                  </div>
                </Card.Body>
              </Card>

              {/* Specifications */}
              {offcanvasData.spacing && (
                <Card className="mb-3">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">
                      <FaRuler className="me-2 text-primary" />
                      Planting Specifications
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <Row className="g-2">
                      <Col xs={6}>
                        <small className="text-muted">Spacing:</small>
                        <br />
                        <strong>{offcanvasData.spacing}</strong>
                      </Col>
                      {offcanvasData.plantingDepth && (
                        <Col xs={6}>
                          <small className="text-muted">Planting Depth:</small>
                          <br />
                          <strong>{offcanvasData.plantingDepth}</strong>
                        </Col>
                      )}
                      <Col xs={6}>
                        <small className="text-muted">Sun Requirements:</small>
                        <br />
                        <FaSun className="text-warning me-1" />
                        <strong>{offcanvasData.sunRequirements}</strong>
                      </Col>
                      <Col xs={6}>
                        <small className="text-muted">Water Needs:</small>
                        <br />
                        <FaTint className="text-info me-1" />
                        <strong>{offcanvasData.waterNeeds}</strong>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              {/* Benefits */}
              {offcanvasData.benefits && (
                <Card className="mb-3">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">
                      <FaTree className="me-2 text-success" />
                      Benefits & Functions
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <ul className="list-unstyled">
                      {offcanvasData.benefits.map((benefit, index) => (
                        <li key={index} className="mb-1">
                          <Badge bg="outline-success" className="me-2">
                            ✓
                          </Badge>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </Card.Body>
                </Card>
              )}

              {/* Management Tips */}
              {offcanvasData.managementTips && (
                <Card className="mb-3">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">
                      <FaTools className="me-2 text-warning" />
                      Management Tips
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <ul className="list-unstyled">
                      {offcanvasData.managementTips.map((tip, index) => (
                        <li key={index} className="mb-1">
                          <Badge bg="outline-warning" className="me-2">
                            💡
                          </Badge>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </Card.Body>
                </Card>
              )}

              {/* Seasonal Care */}
              {offcanvasData.seasonalCare && (
                <Card className="mb-3">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">
                      <FaCalendarAlt className="me-2 text-info" />
                      Seasonal Care Guide
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <Row className="g-2">
                      <Col xs={6}>
                        <Badge bg="success" className="mb-1">
                          Spring
                        </Badge>
                        <br />
                        <small>{offcanvasData.seasonalCare.spring}</small>
                      </Col>
                      <Col xs={6}>
                        <Badge bg="warning" className="mb-1">
                          Summer
                        </Badge>
                        <br />
                        <small>{offcanvasData.seasonalCare.summer}</small>
                      </Col>
                      <Col xs={6}>
                        <Badge bg="danger" className="mb-1">
                          Autumn
                        </Badge>
                        <br />
                        <small>{offcanvasData.seasonalCare.autumn}</small>
                      </Col>
                      <Col xs={6}>
                        <Badge bg="info" className="mb-1">
                          Winter
                        </Badge>
                        <br />
                        <small>{offcanvasData.seasonalCare.winter}</small>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
};

export default InteractiveGridLayerGuide;
