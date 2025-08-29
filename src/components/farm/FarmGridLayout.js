"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Row,
  Col,
  Container,
  Spinner,
  Alert,
} from "react-bootstrap";
import { toast } from "react-hot-toast";
import styles from "./FarmGridLayout.module.css";
import { getTreeClassFromPosition } from "../../utils/treeTypeClassifier";

const FarmGridLayout = ({
  farmId,
  onTreeClick,
  selectedLayoutId = null,
  showExpandButtons = true,
}) => {
  const [layout, setLayout] = useState(null);
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gridSize] = useState(24); // 24x24 feet grid

  useEffect(() => {
    if (selectedLayoutId) {
      fetchLayout();
      fetchTrees();
    } else if (farmId) {
      // First try to fetch existing layouts
      fetchLayout();
    }
  }, [farmId, selectedLayoutId]);

  const fetchLayout = async () => {
    try {
      const response = await fetch(`/api/farm-layouts?farmId=${farmId}`);
      if (!response.ok) throw new Error("Failed to fetch layout");

      const layouts = await response.json();
      const activeLayout = selectedLayoutId
        ? layouts.find((l) => l.id === selectedLayoutId)
        : layouts.find((l) => l.is_active) || layouts[0];

      if (activeLayout) {
        setLayout(activeLayout);
        fetchTrees();
      } else {
        // No layouts found, create default layout
        createDefaultLayout();
      }
    } catch (error) {
      console.error("Error fetching layout:", error);
      toast.error("Failed to load farm layout");
    }
  };

  const fetchTrees = async () => {
    try {
      setLoading(true);
      const url = selectedLayoutId
        ? `/api/trees?farmId=${farmId}&layoutId=${selectedLayoutId}`
        : `/api/trees?farmId=${farmId}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch trees");

      const data = await response.json();
      setTrees(data);
    } catch (error) {
      console.error("Error fetching trees:", error);
      toast.error("Failed to load trees");
    } finally {
      setLoading(false);
    }
  };

  const createDefaultLayout = async () => {
    try {
      const defaultConfig = {
        blocks: [
          { x: 0, y: 0, width: 24, height: 24 },
          { x: 24, y: 0, width: 24, height: 24 },
          { x: 0, y: 24, width: 24, height: 24 },
          { x: 24, y: 24, width: 24, height: 24 },
          { x: 0, y: 48, width: 24, height: 24 },
          { x: 24, y: 48, width: 24, height: 24 },
          { x: 0, y: 72, width: 24, height: 24 },
          { x: 24, y: 72, width: 24, height: 24 },
        ],
      };

      const response = await fetch("/api/farm-layouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farm_id: farmId,
          name: "Default Farm Layout",
          description: "Initial 8-block layout (2x4 grid of 24x24 blocks)",
          grid_config: defaultConfig,
          is_active: true,
        }),
      });

      if (response.ok) {
        const newLayout = await response.json();
        setLayout(newLayout);
        fetchTrees();
        toast.success("Default layout created!");
      }
    } catch (error) {
      console.error("Error creating default layout:", error);
      toast.error("Failed to create layout");
    } finally {
      setLoading(false);
    }
  };

  const expandGrid = async (direction) => {
    if (!layout) return;

    try {
      const currentBlocks = layout.grid_config.blocks;
      const newBlocks = [...currentBlocks];

      // Calculate the current boundaries
      const maxX = Math.max(...currentBlocks.map((b) => b.x + b.width));
      const maxY = Math.max(...currentBlocks.map((b) => b.y + b.height));
      const minX = Math.min(...currentBlocks.map((b) => b.x));
      const minY = Math.min(...currentBlocks.map((b) => b.y));

      let newBlock;

      switch (direction) {
        case "right":
          // Add blocks to the right of each row
          for (let y = minY; y < maxY; y += gridSize) {
            newBlock = { x: maxX, y, width: gridSize, height: gridSize };
            newBlocks.push(newBlock);
          }
          break;
        case "left":
          // Add blocks to the left of each row
          for (let y = minY; y < maxY; y += gridSize) {
            newBlock = {
              x: minX - gridSize,
              y,
              width: gridSize,
              height: gridSize,
            };
            newBlocks.push(newBlock);
          }
          // Adjust all existing blocks to maintain positive coordinates
          const offsetX = minX - gridSize < 0 ? gridSize : 0;
          if (offsetX > 0) {
            newBlocks.forEach((block) => (block.x += offsetX));
          }
          break;
        case "bottom":
          // Add blocks to the bottom of each column
          for (let x = minX; x < maxX; x += gridSize) {
            newBlock = { x, y: maxY, width: gridSize, height: gridSize };
            newBlocks.push(newBlock);
          }
          break;
        case "top":
          // Add blocks to the top of each column
          for (let x = minX; x < maxX; x += gridSize) {
            newBlock = {
              x,
              y: minY - gridSize,
              width: gridSize,
              height: gridSize,
            };
            newBlocks.push(newBlock);
          }
          // Adjust all existing blocks to maintain positive coordinates
          const offsetY = minY - gridSize < 0 ? gridSize : 0;
          if (offsetY > 0) {
            newBlocks.forEach((block) => (block.y += offsetY));
          }
          break;
      }

      // Update the layout
      const updatedConfig = { ...layout.grid_config, blocks: newBlocks };
      const response = await fetch("/api/farm-layouts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: layout.id,
          grid_config: updatedConfig,
        }),
      });

      if (response.ok) {
        const updatedLayout = await response.json();
        setLayout(updatedLayout);
        toast.success(`Grid expanded to ${direction}!`);
      }
    } catch (error) {
      console.error("Error expanding grid:", error);
      toast.error("Failed to expand grid");
    }
  };

  const getTreeAtPosition = (blockIndex, x, y) => {
    return trees.find((tree) =>
      tree.tree_positions.some(
        (pos) =>
          pos.block_index === blockIndex &&
          pos.grid_x === x &&
          pos.grid_y === y &&
          pos.layout_id === layout?.id
      )
    );
  };

  const handleCellClick = (blockIndex, x, y) => {
    const tree = getTreeAtPosition(blockIndex, x, y);
    if (tree && onTreeClick) {
      onTreeClick(tree, { blockIndex, x, y });
    } else if (onTreeClick) {
      // Click on empty cell
      onTreeClick(null, { blockIndex, x, y });
    }
  };

  const renderGrid = (block, blockIndex) => {
    const cells = [];

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const tree = getTreeAtPosition(blockIndex, x, y);
        const cellKey = `${blockIndex}-${x}-${y}`;

        cells.push(
          <div
            key={cellKey}
            className={`${styles.gridCell} ${
              tree ? styles.hasTree : styles.emptyCell
            }`}
            onClick={() => handleCellClick(blockIndex, x, y)}
            style={{
              left: `${(x * 100) / gridSize}%`,
              top: `${(y * 100) / gridSize}%`,
              width: `${100 / gridSize}%`,
              height: `${100 / gridSize}%`,
            }}
          >
            {tree && (
              <div
                className={
                  styles[
                    getTreeClassFromPosition(x, y, block.width, block.height)
                  ]
                }
                title={`${tree.name} (${tree.code})`}
              >
                {tree.code}
              </div>
            )}
          </div>
        );
      }
    }

    return cells;
  };

  const renderBlock = (block, index) => (
    <div
      key={index}
      className={styles.gridBlock}
      style={{
        left: `${block.x * 2}px`, // Scale factor for display
        top: `${block.y * 2}px`,
        width: `${block.width * 2}px`,
        height: `${block.height * 2}px`,
      }}
    >
      <div className={styles.blockLabel}>
        Block {index + 1} ({block.width}×{block.height}ft)
      </div>
      <div className={styles.gridContainer}>{renderGrid(block, index)}</div>
    </div>
  );

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-2">Loading farm layout...</p>
      </div>
    );
  }

  if (!layout) {
    return (
      <Alert variant="warning">
        <Alert.Heading>No Layout Found</Alert.Heading>
        <p>No farm layout found. Please create a layout first.</p>
      </Alert>
    );
  }

  const blocks = layout.grid_config.blocks || [];
  const totalWidth = Math.max(...blocks.map((b) => b.x + b.width)) * 2;
  const totalHeight = Math.max(...blocks.map((b) => b.y + b.height)) * 2;

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <h4 className="mb-0">{layout.name}</h4>
          <small className="text-muted">{layout.description}</small>
        </div>
        <div className="d-flex gap-2">
          <Button size="sm" variant="outline-primary" onClick={fetchTrees}>
            Refresh
          </Button>
        </div>
      </Card.Header>

      <Card.Body style={{ padding: "10px", height: "calc(100vh - 160px)" }}>
        <div
          className="position-relative"
          style={{ margin: "10px", height: "100%" }}
        >
          {/* External Expansion Buttons - Outside the grid */}
          {showExpandButtons && (
            <>
              {/* Top Add Button */}
              <div
                className={styles.expandButton}
                style={{
                  position: "fixed",
                  top: "10px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 1000,
                }}
              >
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => expandGrid("top")}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    padding: "0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                  title="Add Row Above"
                >
                  +
                </Button>
              </div>

              {/* Right Add Button */}
              <div
                className={styles.expandButton}
                style={{
                  position: "fixed",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 1000,
                }}
              >
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => expandGrid("right")}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    padding: "0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                  title="Add Column Right"
                >
                  +
                </Button>
              </div>

              {/* Bottom Add Button */}
              <div
                className={styles.expandButton}
                style={{
                  position: "fixed",
                  bottom: "10px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 1000,
                }}
              >
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => expandGrid("bottom")}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    padding: "0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                  title="Add Row Below"
                >
                  +
                </Button>
              </div>

              {/* Left Add Button */}
              <div
                className={styles.expandButton}
                style={{
                  position: "fixed",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 1000,
                }}
              >
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => expandGrid("left")}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    padding: "0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                  title="Add Column Left"
                >
                  +
                </Button>
              </div>
            </>
          )}

          {/* Grid Layout */}
          <div
            className={styles.farmLayout}
            style={{
              width: `${totalWidth}px`,
              height: `${totalHeight}px`,
              minHeight: "400px",
            }}
          >
            {blocks.map((block, index) => renderBlock(block, index))}
          </div>
        </div>

        {/* Legend */}
        <Row className="mt-3">
          <Col>
            <div className="d-flex flex-wrap gap-3 align-items-center">
              <small className="text-muted">Legend:</small>
              <div className="d-flex align-items-center gap-1">
                <div
                  className={styles.legendCircle}
                  style={{ backgroundColor: "#28a745" }}
                ></div>
                <small>Planted Tree</small>
              </div>
              <div className="d-flex align-items-center gap-1">
                <div
                  className={styles.legendCircle}
                  style={{
                    backgroundColor: "#f8f9fa",
                    border: "1px solid #dee2e6",
                  }}
                ></div>
                <small>Empty Spot</small>
              </div>
              <small className="text-muted">
                Click on any position to plant or view tree details
              </small>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default FarmGridLayout;
