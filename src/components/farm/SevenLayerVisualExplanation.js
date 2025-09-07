"use client";

import { useState } from "react";
import { Card, Row, Col, Badge, Button, Alert } from "react-bootstrap";
import { FaTree, FaLeaf, FaSeedling, FaVine, FaCarrot } from "react-icons/fa";
import styles from "./SevenLayerVisualExplanation.module.css";

const SevenLayerVisualExplanation = () => {
  const [selectedLayer, setSelectedLayer] = useState(null);

  // 24x24 layout with trees at 6ft intervals: B-S-M-S-B pattern
  const layoutPattern = [
    { position: 0, type: "B", size: "big", name: "Big Tree" },
    { position: 6, type: "S", size: "small", name: "Small Tree" },
    { position: 12, type: "M", size: "medium", name: "Medium Tree" },
    { position: 18, type: "S", size: "small", name: "Small Tree" },
    { position: 24, type: "B", size: "big", name: "Big Tree" },
  ];

  const sevenLayers = {
    1: {
      name: "Overstory Tree Layer (60-100+ ft)",
      description: "Large canopy trees - the forest ceiling",
      color: "#2d5016",
      examples: ["Mango", "Jackfruit", "Cashew", "Large Coconut"],
      position: "Big trees (B) at 0ft and 24ft",
      icon: <FaTree size={24} />,
    },
    2: {
      name: "Understory Tree Layer (20-60 ft)",
      description: "Medium-sized fruit trees under the canopy",
      color: "#4a7c59",
      examples: ["Pomegranate", "Guava", "Apple", "Pear"],
      position: "Medium tree (M) at 12ft center",
      icon: <FaTree size={20} />,
    },
    3: {
      name: "Shrub Layer (3-20 ft)",
      description: "Berry bushes and small fruit trees",
      color: "#7fb069",
      examples: ["Barbados Cherry", "Blueberry", "Karonda"],
      position: "Small trees (S) at 6ft and 18ft",
      icon: <FaLeaf size={18} />,
    },
    4: {
      name: "Herbaceous Layer (1-3 ft)",
      description: "Non-woody perennial plants and herbs",
      color: "#a7c957",
      examples: ["Moringa leaves", "Spice plants", "Medicinal herbs"],
      position: "Between all trees in 3ft beds",
      icon: <FaSeedling size={16} />,
    },
    5: {
      name: "Ground Cover Layer (0-1 ft)",
      description: "Low-growing plants covering the soil",
      color: "#c9e265",
      examples: ["Strawberry", "Mint", "Living mulch"],
      position: "Covering entire 3ft wide beds",
      icon: <FaSeedling size={12} />,
    },
    6: {
      name: "Vine Layer (Climbing)",
      description:
        "Climbing plants using trees for support - 3 vine plants per 24×24 row",
      color: "#f4a261",
      examples: ["Grapes", "Passion fruit", "Pepper vines", "Climbing beans"],
      position:
        "3 vines total: 2 on Big trees (0ft & 24ft) + 1 on Medium tree (12ft)",
      icon: <FaVine size={16} />,
    },
    7: {
      name: "Root Layer (Underground)",
      description: "Root vegetables and tubers",
      color: "#e76f51",
      examples: ["Sweet potato", "Ginger", "Turmeric"],
      position: "Underground throughout beds",
      icon: <FaCarrot size={16} />,
    },
  };

  return (
    <div className="mt-4">
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-success text-white">
          <h5 className="mb-0">
            <FaTree className="me-2" />
            7-Layer Cross-Section: 24×24 ft Layout (One Row)
          </h5>
        </Card.Header>
        <Card.Body>
          <Alert variant="info" className="mb-4">
            <strong>Layout Pattern:</strong> B-S-M-S-B
            (Big-Small-Medium-Small-Big) trees at 6ft intervals with 3ft wide
            beds between them.
          </Alert>

          {/* Visual Cross-Section */}
          <div className={styles.crossSection}>
            {/* Layer Height Visualization - Shows all 7 layers vertically */}
            <div className={styles.layerVisualization}>
              <div className={styles.layerInfo}>
                <strong>7-Layer Forest System</strong>
                <br />
                <small>
                  Trees represent layers by height: Big(60-100ft) →
                  Medium(20-60ft) → Small(3-20ft)
                </small>
              </div>
            </div>

            {/* All Trees at Ground Level */}
            <div className={styles.treesContainer}>
              {/* Big Tree at 0ft */}
              <div
                className={`${styles.bigTree} ${
                  selectedLayer && selectedLayer !== 1 ? styles.dimmed : ""
                } ${selectedLayer === 1 ? styles.highlighted : ""}`}
                style={{ backgroundColor: sevenLayers[1].color }}
                onClick={() => setSelectedLayer(selectedLayer === 1 ? null : 1)}
              >
                <FaTree size={35} color="white" />
                <span className={styles.treeLabel}>B (0ft)</span>
              </div>

              {/* Small Tree at 6ft */}
              <div
                className={`${styles.smallTree} ${
                  selectedLayer && selectedLayer !== 3 ? styles.dimmed : ""
                } ${selectedLayer === 3 ? styles.highlighted : ""}`}
                style={{ backgroundColor: sevenLayers[3].color }}
                onClick={() => setSelectedLayer(selectedLayer === 3 ? null : 3)}
              >
                <FaLeaf size={18} color="white" />
                <span className={styles.treeLabel}>S (6ft)</span>
              </div>

              {/* Medium Tree at 12ft */}
              <div
                className={`${styles.mediumTree} ${
                  selectedLayer && selectedLayer !== 2 ? styles.dimmed : ""
                } ${selectedLayer === 2 ? styles.highlighted : ""}`}
                style={{ backgroundColor: sevenLayers[2].color }}
                onClick={() => setSelectedLayer(selectedLayer === 2 ? null : 2)}
              >
                <FaTree size={25} color="white" />
                <span className={styles.treeLabel}>M (12ft)</span>
              </div>

              {/* Small Tree at 18ft */}
              <div
                className={`${styles.smallTree} ${
                  selectedLayer && selectedLayer !== 3 ? styles.dimmed : ""
                } ${selectedLayer === 3 ? styles.highlighted : ""}`}
                style={{ backgroundColor: sevenLayers[3].color }}
                onClick={() => setSelectedLayer(selectedLayer === 3 ? null : 3)}
              >
                <FaLeaf size={18} color="white" />
                <span className={styles.treeLabel}>S (18ft)</span>
              </div>

              {/* Big Tree at 24ft */}
              <div
                className={`${styles.bigTree} ${
                  selectedLayer && selectedLayer !== 1 ? styles.dimmed : ""
                } ${selectedLayer === 1 ? styles.highlighted : ""}`}
                style={{ backgroundColor: sevenLayers[1].color }}
                onClick={() => setSelectedLayer(selectedLayer === 1 ? null : 1)}
              >
                <FaTree size={35} color="white" />
                <span className={styles.treeLabel}>B (24ft)</span>
              </div>
            </div>

            {/* Layer 6: Vine Layer - Climbing on trees */}
            <div
              className={`${styles.vineLayer} ${
                selectedLayer && selectedLayer !== 6 ? styles.dimmed : ""
              }`}
            >
              {/* Vines on first big tree */}
              <div
                className={`${styles.vine} ${styles.vineLeft} ${
                  selectedLayer === 6 ? styles.highlighted : ""
                }`}
                onClick={() => setSelectedLayer(selectedLayer === 6 ? null : 6)}
                title="Vine on Big Tree (0ft)"
              >
                <FaVine size={14} color="#f4a261" />
              </div>

              {/* Vines on medium tree */}
              <div
                className={`${styles.vine} ${styles.vineCenter} ${
                  selectedLayer === 6 ? styles.highlighted : ""
                }`}
                onClick={() => setSelectedLayer(selectedLayer === 6 ? null : 6)}
                title="Vine on Medium Tree (12ft)"
              >
                <FaVine size={12} color="#f4a261" />
              </div>

              {/* Vines on last big tree */}
              <div
                className={`${styles.vine} ${styles.vineRight} ${
                  selectedLayer === 6 ? styles.highlighted : ""
                }`}
                onClick={() => setSelectedLayer(selectedLayer === 6 ? null : 6)}
                title="Vine on Big Tree (24ft)"
              >
                <FaVine size={14} color="#f4a261" />
              </div>
            </div>

            {/* Ground Level */}
            <div className={styles.groundLine}></div>

            {/* Layer 4: Herbaceous Layer */}
            <div
              className={`${styles.herbaceousLayer} ${
                selectedLayer && selectedLayer !== 4 ? styles.dimmed : ""
              } ${selectedLayer === 4 ? styles.highlighted : ""}`}
              style={{ backgroundColor: sevenLayers[4].color }}
              onClick={() => setSelectedLayer(selectedLayer === 4 ? null : 4)}
            >
              <div className={styles.layerContent}>
                <FaSeedling size={14} color="white" />
                <span className={styles.layerText}>
                  Herbaceous Layer (3ft beds)
                </span>
              </div>
            </div>

            {/* Layer 5: Ground Cover */}
            <div
              className={`${styles.groundCoverLayer} ${
                selectedLayer && selectedLayer !== 5 ? styles.dimmed : ""
              } ${selectedLayer === 5 ? styles.highlighted : ""}`}
              style={{ backgroundColor: sevenLayers[5].color }}
              onClick={() => setSelectedLayer(selectedLayer === 5 ? null : 5)}
            >
              <div className={styles.layerContent}>
                <FaSeedling size={10} color="white" />
                <span className={styles.layerText}>
                  Ground Cover (entire surface)
                </span>
              </div>
            </div>

            {/* Soil Line */}
            <div className={styles.soilLine}></div>

            {/* Layer 7: Root Layer */}
            <div
              className={`${styles.rootLayer} ${
                selectedLayer && selectedLayer !== 7 ? styles.dimmed : ""
              } ${selectedLayer === 7 ? styles.highlighted : ""}`}
              style={{ backgroundColor: sevenLayers[7].color }}
              onClick={() => setSelectedLayer(selectedLayer === 7 ? null : 7)}
            >
              <div className={styles.layerContent}>
                <FaCarrot size={14} color="white" />
                <span className={styles.layerText}>
                  Root Layer (underground)
                </span>
              </div>
            </div>

            {/* Measurement Scale */}
            <div className={styles.measurementScale}>
              <div className={styles.scaleMarker} style={{ left: "0%" }}>
                0ft
              </div>
              <div className={styles.scaleMarker} style={{ left: "25%" }}>
                6ft
              </div>
              <div className={styles.scaleMarker} style={{ left: "50%" }}>
                12ft
              </div>
              <div className={styles.scaleMarker} style={{ left: "75%" }}>
                18ft
              </div>
              <div className={styles.scaleMarker} style={{ left: "100%" }}>
                24ft
              </div>
            </div>
          </div>

          {/* Layer Selection Buttons */}
          <Row className="mt-4">
            <Col>
              <h6 className="text-primary mb-3">
                Click on layers above or select here:
                {selectedLayer && (
                  <Badge bg="success" className="ms-2">
                    Layer {selectedLayer} Selected
                  </Badge>
                )}
              </h6>
              <div className="d-flex flex-wrap gap-2">
                {Object.entries(sevenLayers).map(([layerNum, layer]) => (
                  <Button
                    key={layerNum}
                    variant={
                      selectedLayer === parseInt(layerNum)
                        ? "dark"
                        : "outline-secondary"
                    }
                    size="sm"
                    onClick={() =>
                      setSelectedLayer(
                        selectedLayer === parseInt(layerNum)
                          ? null
                          : parseInt(layerNum)
                      )
                    }
                    className="d-flex align-items-center"
                  >
                    {layer.icon}
                    <span className="ms-2">Layer {layerNum}</span>
                  </Button>
                ))}
                {selectedLayer && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => setSelectedLayer(null)}
                    className="d-flex align-items-center"
                  >
                    <span>Clear Selection</span>
                  </Button>
                )}
              </div>
            </Col>
          </Row>

          {/* Selected Layer Details */}
          {selectedLayer && (
            <Card
              className="mt-4 border-0"
              style={{
                borderLeft: `4px solid ${sevenLayers[selectedLayer].color}`,
              }}
            >
              <Card.Header
                style={{
                  backgroundColor: sevenLayers[selectedLayer].color,
                  color: "white",
                }}
              >
                <h6 className="mb-0 d-flex align-items-center">
                  {sevenLayers[selectedLayer].icon}
                  <span className="ms-2">
                    Layer {selectedLayer}: {sevenLayers[selectedLayer].name}
                  </span>
                </h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <p className="mb-3">
                      {sevenLayers[selectedLayer].description}
                    </p>
                    <h6 className="text-success">Position in 24×24 Layout:</h6>
                    <p className="small text-muted">
                      {sevenLayers[selectedLayer].position}
                    </p>
                  </Col>
                  <Col md={6}>
                    <h6 className="text-primary">Example Plants:</h6>
                    <div className="d-flex flex-wrap gap-1">
                      {sevenLayers[selectedLayer].examples.map((plant, idx) => (
                        <Badge key={idx} bg="success" className="mb-1">
                          {plant}
                        </Badge>
                      ))}
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          {/* 7-Layer System Explanation */}
          <Card className="mt-4 border-primary">
            <Card.Header className="bg-primary text-white">
              <h6 className="mb-0">
                <FaTree className="me-2" />
                7-Layer System on 1ft × 1ft Grid Layout
              </h6>
            </Card.Header>
            <Card.Body>
              <Alert variant="info" className="mb-4">
                <strong>Grid-Based Placement:</strong> Using your 24×24 grid
                with 1ft precision, trees are planted at specific grid
                intersections for optimal spacing and layer integration.
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
                  </ul>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Grid-Based Placement Analysis */}
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
                    <strong>Tree Pattern:</strong> B-S-M-S-B along Y=12
                    centerline
                    <br />
                    <strong>Spacing:</strong> 0ft → 6ft → 12ft → 18ft → 24ft
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
                    <strong>20 plants per row</strong>
                    <br />
                    <small className="text-muted">
                      25 grid squares - 5 tree positions = 20 root crops
                    </small>
                  </div>

                  <div className="mb-2">
                    <Badge
                      style={{ backgroundColor: sevenLayers[5].color }}
                      className="me-2"
                    >
                      Ground Cover
                    </Badge>
                    <strong>Full coverage (25 sq ft)</strong>
                    <br />
                    <small className="text-muted">
                      Spreads across all 25 grid squares
                    </small>
                  </div>

                  <div className="mb-2">
                    <Badge
                      style={{ backgroundColor: sevenLayers[4].color }}
                      className="me-2"
                    >
                      Herbaceous Plants
                    </Badge>
                    <strong>20-40 plants</strong>
                    <br />
                    <small className="text-muted">
                      1-2 herbs per available grid square
                    </small>
                  </div>

                  <div className="mb-3">
                    <Badge
                      style={{ backgroundColor: sevenLayers[6].color }}
                      className="me-2"
                    >
                      Climbing Vines
                    </Badge>
                    <strong>3 vines total</strong>
                    <br />
                    <small className="text-muted">
                      Planted at base of 2 Big + 1 Medium tree
                    </small>
                  </div>
                </Col>
              </Row>

              <hr />

              <Row>
                <Col>
                  <h6 className="text-primary">
                    Vine Placement on Grid Intersections:
                  </h6>
                  <Row className="g-3">
                    <Col md={4}>
                      <div className="text-center p-3 border rounded bg-light">
                        <strong className="text-success">
                          Vine Position 1
                        </strong>
                        <br />
                        <small>Grid: (0,12) - Big Tree</small>
                        <br />
                        <Badge bg="success" className="mt-1">
                          Heavy Vines
                        </Badge>
                        <br />
                        <small className="text-muted">
                          Grapes, Passion Fruit
                        </small>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="text-center p-3 border rounded bg-light">
                        <strong className="text-warning">
                          Vine Position 2
                        </strong>
                        <br />
                        <small>Grid: (12,12) - Medium Tree</small>
                        <br />
                        <Badge bg="warning" className="mt-1">
                          Light Vines
                        </Badge>
                        <br />
                        <small className="text-muted">
                          Beans, Pepper Vines
                        </small>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="text-center p-3 border rounded bg-light">
                        <strong className="text-success">
                          Vine Position 3
                        </strong>
                        <br />
                        <small>Grid: (24,12) - Big Tree</small>
                        <br />
                        <Badge bg="success" className="mt-1">
                          Heavy Vines
                        </Badge>
                        <br />
                        <small className="text-muted">
                          Grapes, Passion Fruit
                        </small>
                      </div>
                    </Col>
                  </Row>

                  <Alert variant="success" className="mt-3">
                    <strong>Grid Advantage:</strong> The 1ft precision allows
                    exact positioning for optimal root spacing, canopy
                    management, and harvest accessibility while maintaining the
                    7-layer ecosystem balance.
                  </Alert>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Layout Specifications */}
          <Card className="mt-4 border-info">
            <Card.Header className="bg-info text-white">
              <h6 className="mb-0">24×24 ft Layout Specifications</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <h6 className="text-success">Tree Spacing:</h6>
                  <ul className="list-unstyled small">
                    <li>• Trees every 6 feet</li>
                    <li>• Pattern: B-S-M-S-B</li>
                    <li>• Total width: 24 feet</li>
                  </ul>
                </Col>
                <Col md={3}>
                  <h6 className="text-warning">Bed Layout:</h6>
                  <ul className="list-unstyled small">
                    <li>• 3ft wide beds between trees</li>
                    <li>• Herbaceous plants in beds</li>
                    <li>• Ground cover throughout</li>
                  </ul>
                </Col>
                <Col md={3}>
                  <h6 className="text-primary">Vine Plants:</h6>
                  <ul className="list-unstyled small">
                    <li>
                      • <strong>3 vines total per row</strong>
                    </li>
                    <li>• 2 vines on Big trees (0ft & 24ft)</li>
                    <li>• 1 vine on Medium tree (12ft)</li>
                    <li>• Small trees too small for vines</li>
                  </ul>
                </Col>
                <Col md={3}>
                  <h6 className="text-info">Sky Space Usage:</h6>
                  <ul className="list-unstyled small">
                    <li>• Sunlight capture</li>
                    <li>• Rain water collection</li>
                    <li>• Bird habitat & nesting</li>
                    <li>• Air circulation</li>
                  </ul>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Card.Body>
      </Card>
    </div>
  );
};

export default SevenLayerVisualExplanation;
