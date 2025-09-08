"use client";

import { useState, useEffect } from "react";
import { Card, Row, Col, Badge, Button, Alert, Spinner } from "react-bootstrap";
import {
  FaTree,
  FaLeaf,
  FaSeedling,
  FaEye,
  FaLayerGroup,
  FaAppleAlt,
  FaLemon,
} from "react-icons/fa";
import { getTreeType } from "@/utils/treeTypeClassifier";
import styles from "./SevenLayerGrid.module.css";

const SevenLayerGrid = ({ sevenLayerData, trees, onTreeClick, loading }) => {
  const [selectedLayer, setSelectedLayer] = useState(null);

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
  const [showAllLayers, setShowAllLayers] = useState(true);
  const [gridData, setGridData] = useState([]);

  const gridSize = 24; // 24x24 feet grid

  useEffect(() => {
    generateGridData();
  }, [trees]);

  const generateGridData = () => {
    const grid = [];

    // Generate grid positions for a 24x24 grid
    for (let y = 0; y <= gridSize; y += 3) {
      // Every 3 feet
      for (let x = 0; x <= gridSize; x += 3) {
        const treeType = getTreeType(x, y, gridSize, gridSize);
        const layerInfo = getLayerForPosition(x, y, treeType);

        grid.push({
          x,
          y,
          treeType,
          layer: layerInfo.layer,
          layerData: sevenLayerData[layerInfo.layer],
          suggestedTrees: getSuggestedTreesForLayer(layerInfo.layer),
          position: `${x},${y}`,
        });
      }
    }

    setGridData(grid);
  };

  const getLayerForPosition = (x, y, treeType) => {
    // Determine which layer this position belongs to based on tree type and position
    switch (treeType) {
      case "big":
        return { layer: 1 }; // Canopy layer
      case "centerBig":
        return { layer: 1 }; // Canopy layer
      case "medium":
        return { layer: 2 }; // Sub-canopy layer
      case "small":
        return { layer: 3 }; // Shrub layer
      case "tiny":
        // For tiny positions, distribute across layers 4-7
        const hash = (x + y) % 4;
        return { layer: 4 + hash }; // Layers 4, 5, 6, 7
      default:
        return { layer: 5 }; // Ground cover by default
    }
  };

  const getSuggestedTreesForLayer = (layerNum) => {
    if (!sevenLayerData[layerNum] || !trees.length) return [];

    const layerExamples = sevenLayerData[layerNum].examples;
    return trees.filter((tree) =>
      layerExamples.some(
        (example) =>
          tree.name.toLowerCase().includes(example.toLowerCase()) ||
          example.toLowerCase().includes(tree.name.toLowerCase())
      )
    );
  };

  const getGridCellClass = (gridItem) => {
    const baseClass = styles.gridCell;
    const layerClass = selectedLayer
      ? gridItem.layer === selectedLayer
        ? styles.selectedLayer
        : styles.dimmedLayer
      : styles.normalLayer;

    return `${baseClass} ${layerClass}`;
  };

  const getGridCellStyle = (gridItem) => {
    const layerData = gridItem.layerData;
    const opacity = selectedLayer && gridItem.layer !== selectedLayer ? 0.3 : 1;

    return {
      backgroundColor: layerData?.color || "#e9ecef",
      opacity,
      border:
        gridItem.layer === selectedLayer
          ? "2px solid #fff"
          : "1px solid rgba(255,255,255,0.3)",
    };
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm mt-3">
        <Card.Body className="text-center py-5">
          <Spinner animation="border" variant="success" />
          <p className="mt-3 text-muted">Loading tree data...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="mt-3">
      {/* Layer Controls */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <div className="d-flex flex-wrap align-items-center justify-content-between mb-3">
            <h4 className="text-success mb-0">
              <FaLayerGroup className="me-2" />
              Interactive 7-Layer Visualization
            </h4>
            <Button
              variant={showAllLayers ? "success" : "outline-success"}
              size="sm"
              onClick={() => {
                setShowAllLayers(!showAllLayers);
                setSelectedLayer(null);
              }}
            >
              <FaEye className="me-1" />
              {showAllLayers ? "Hide Layers" : "Show All Layers"}
            </Button>
          </div>

          <Alert variant="info" className="mb-3">
            <strong>How to use:</strong> Click on layer badges below to
            highlight specific layers in the grid. Each colored cell represents
            the optimal planting position for that layer's plants.
          </Alert>

          {/* Layer Selection Badges */}
          <div className="d-flex flex-wrap gap-2">
            {Object.entries(sevenLayerData).map(([layerNum, layerInfo]) => (
              <Badge
                key={layerNum}
                bg={selectedLayer === parseInt(layerNum) ? "dark" : "light"}
                text={selectedLayer === parseInt(layerNum) ? "white" : "dark"}
                className={`p-2 cursor-pointer ${styles.layerBadge}`}
                style={{
                  borderLeft: `4px solid ${layerInfo.color}`,
                  cursor: "pointer",
                }}
                onClick={() =>
                  setSelectedLayer(
                    selectedLayer === parseInt(layerNum)
                      ? null
                      : parseInt(layerNum)
                  )
                }
              >
                <strong>Layer {layerNum}:</strong> {layerInfo.name}
              </Badge>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Grid Visualization */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-success text-white">
          <h5 className="mb-0">
            <FaTree className="me-2" />
            24×24 Feet Orchard Layout
            {selectedLayer && (
              <Badge bg="light" text="dark" className="ms-2">
                Showing Layer {selectedLayer}:{" "}
                {sevenLayerData[selectedLayer].name}
              </Badge>
            )}
          </h5>
        </Card.Header>
        <Card.Body className="p-2">
          <div className={styles.gridContainer}>
            <div
              className={styles.grid}
              style={{
                gridTemplateColumns: `repeat(${
                  Math.floor(gridSize / 3) + 1
                }, 1fr)`,
                gridTemplateRows: `repeat(${
                  Math.floor(gridSize / 3) + 1
                }, 1fr)`,
              }}
            >
              {gridData.map((gridItem, index) => (
                <div
                  key={index}
                  className={getGridCellClass(gridItem)}
                  style={getGridCellStyle(gridItem)}
                  onClick={() => {
                    if (gridItem.suggestedTrees.length > 0) {
                      onTreeClick(gridItem.suggestedTrees[0]);
                    }
                  }}
                  title={`Layer ${gridItem.layer}: ${gridItem.layerData?.name} (${gridItem.x}', ${gridItem.y}')`}
                >
                  <div className={styles.cellContent}>
                    {gridItem.treeType === "big" && <FaTree size={12} />}
                    {gridItem.treeType === "centerBig" && <FaTree size={10} />}
                    {gridItem.treeType === "medium" && <FaLeaf size={8} />}
                    {gridItem.treeType === "small" && <FaSeedling size={6} />}
                    {gridItem.treeType === "tiny" && (
                      <div className={styles.tinyDot} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grid Legend */}
          <Row className="mt-3">
            <Col md={6}>
              <h6 className="text-primary">Grid Scale:</h6>
              <ul className="list-unstyled small">
                <li>• Each cell = 3×3 feet</li>
                <li>• Total area = 24×24 feet (576 sq ft)</li>
                <li>• Grid spacing follows permaculture principles</li>
              </ul>
            </Col>
            <Col md={6}>
              <h6 className="text-primary">Plant Symbols:</h6>
              <ul className="list-unstyled small">
                <li>
                  <FaTree className="me-2" />
                  Large trees (Canopy)
                </li>
                <li>
                  <FaLeaf className="me-2" />
                  Medium trees (Sub-canopy)
                </li>
                <li>
                  <FaSeedling className="me-2" />
                  Shrubs & small plants
                </li>
                <li>
                  <span className={styles.tinyDot + " me-2"} />
                  Ground cover & herbs
                </li>
              </ul>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Selected Layer Information */}
      {selectedLayer && (
        <Card className="border-0 shadow-sm mt-3">
          <Card.Header
            style={{
              backgroundColor: sevenLayerData[selectedLayer].color,
              color: "white",
            }}
          >
            <h5 className="mb-0">
              Layer {selectedLayer}: {sevenLayerData[selectedLayer].name}
            </h5>
          </Card.Header>
          <Card.Body>
            <p className="mb-3">{sevenLayerData[selectedLayer].description}</p>

            <Row>
              <Col md={4}>
                <h6 className="text-success">Recommended Plants:</h6>
                <div className="d-flex flex-wrap gap-2">
                  {sevenLayerData[selectedLayer].examples.map((plant, idx) => {
                    const plantInfo = getPlantIcon(plant);
                    return (
                      <Badge
                        key={idx}
                        bg="outline-success"
                        className="mb-1 p-2 d-flex align-items-center gap-1"
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
              </Col>
              <Col md={4}>
                <h6 className="text-primary">Benefits:</h6>
                <ul className="list-unstyled small">
                  {sevenLayerData[selectedLayer].benefits.map(
                    (benefit, idx) => (
                      <li key={idx}>• {benefit}</li>
                    )
                  )}
                </ul>
              </Col>
              <Col md={4}>
                <h6 className="text-warning">Spacing:</h6>
                <p className="small mb-2">
                  {sevenLayerData[selectedLayer].spacing}
                </p>
                <h6 className="text-info">Grid Position:</h6>
                <p className="small">
                  {sevenLayerData[selectedLayer].gridPositions}
                </p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default SevenLayerGrid;
