"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, Button, Row, Col, Badge, Modal, Form } from "react-bootstrap";
import { toast } from "react-hot-toast";
import styles from "./CSSGridFarm.module.css";
import { getTreeClassFromPosition } from "../../utils/treeTypeClassifier";

const CSSGridFarm = ({
  farmId,
  onTreeClick,
  selectedLayoutId = null,
  showExpandButtons = true,
}) => {
  const [layout, setLayout] = useState(null);
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);

  const gridSize = 24; // 24x24 feet grid

  useEffect(() => {
    if (selectedLayoutId) {
      fetchLayout();
      fetchTrees();
    } else if (farmId) {
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

      console.log("Fetching trees from:", url); // Debug

      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Trees API error:", response.status, errorText);
        throw new Error(`Failed to fetch trees: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched trees:", data); // Debug

      // Ensure tree position data is properly structured
      const processedTrees = data.map((tree) => ({
        ...tree,
        position:
          tree.position ||
          (tree.tree_positions && tree.tree_positions[0]
            ? {
                x: tree.tree_positions[0].grid_x,
                y: tree.tree_positions[0].grid_y,
                block_index: tree.tree_positions[0].block_index,
                layout_id: tree.tree_positions[0].layout_id,
              }
            : null),
      }));

      console.log("Processed trees:", processedTrees); // Debug
      setTrees(processedTrees);
    } catch (error) {
      console.error("Error fetching trees:", error);
      toast.error(`Failed to load trees: ${error.message}`);
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

  const getTreeAtPosition = (blockIndex, x, y) => {
    try {
      if (!trees || !Array.isArray(trees) || !layout) return null;

      return trees.find((tree) =>
        tree.tree_positions?.some(
          (pos) =>
            pos.block_index === blockIndex &&
            pos.grid_x === x &&
            pos.grid_y === y &&
            pos.layout_id === layout?.id
        )
      );
    } catch (error) {
      console.error("Error in getTreeAtPosition:", error, { blockIndex, x, y });
      return null;
    }
  };

  const handleIntersectionClick = (blockIndex, x, y) => {
    const tree = getTreeAtPosition(blockIndex, x, y);
    if (onTreeClick) {
      onTreeClick(tree, { blockIndex, x, y });
    }
  };

  const getTreeStatusColor = (status) => {
    const colors = {
      healthy: "#28a745",
      growing: "#17a2b8",
      flowering: "#ffc107",
      fruiting: "#007bff",
      diseased: "#dc3545",
      dormant: "#6c757d",
    };
    return colors[status] || colors.healthy;
  };

  const expandGrid = async (direction) => {
    if (!layout) return;

    try {
      const currentBlocks = layout.grid_config.blocks;
      const newBlocks = [...currentBlocks];

      const maxX = Math.max(...currentBlocks.map((b) => b.x + b.width));
      const maxY = Math.max(...currentBlocks.map((b) => b.y + b.height));
      const minX = Math.min(...currentBlocks.map((b) => b.x));
      const minY = Math.min(...currentBlocks.map((b) => b.y));

      let newBlock;

      switch (direction) {
        case "right":
          for (let y = minY; y < maxY; y += gridSize) {
            newBlock = { x: maxX, y, width: gridSize, height: gridSize };
            newBlocks.push(newBlock);
          }
          break;
        case "left":
          for (let y = minY; y < maxY; y += gridSize) {
            newBlock = {
              x: minX - gridSize,
              y,
              width: gridSize,
              height: gridSize,
            };
            newBlocks.push(newBlock);
          }
          const offsetX = minX - gridSize < 0 ? gridSize : 0;
          if (offsetX > 0) {
            newBlocks.forEach((block) => (block.x += offsetX));
          }
          break;
        case "bottom":
          for (let x = minX; x < maxX; x += gridSize) {
            newBlock = { x, y: maxY, width: gridSize, height: gridSize };
            newBlocks.push(newBlock);
          }
          break;
        case "top":
          for (let x = minX; x < maxX; x += gridSize) {
            newBlock = {
              x,
              y: minY - gridSize,
              width: gridSize,
              height: gridSize,
            };
            newBlocks.push(newBlock);
          }
          const offsetY = minY - gridSize < 0 ? gridSize : 0;
          if (offsetY > 0) {
            newBlocks.forEach((block) => (block.y += offsetY));
          }
          break;
      }

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

  const renderBlock = (block, blockIndex) => {
    // Only render trees and empty spots where needed (much more efficient)
    const treeElements = [];
    const emptySpots = [];

    // Get trees for this block - using tree_positions array like getTreeAtPosition
    const blockTrees = trees.filter((tree) =>
      tree.tree_positions?.some(
        (pos) => pos.block_index === blockIndex && pos.layout_id === layout?.id
      )
    );

    // Add tree circles
    blockTrees.forEach((tree) => {
      const position = tree.tree_positions?.find(
        (pos) => pos.block_index === blockIndex && pos.layout_id === layout?.id
      );

      if (position && position.grid_x != null && position.grid_y != null) {
        treeElements.push(
          <div
            key={`tree-${tree.id}`}
            className={styles.intersection}
            style={{
              position: "absolute",
              left: `${position.grid_x * 20}px`, // Perfect grid alignment
              top: `${position.grid_y * 20}px`, // Perfect grid alignment
              zIndex: 10,
              transform: "translate(-50%, -50%)", // Center on grid line intersection
            }}
            onClick={() =>
              handleIntersectionClick(
                blockIndex,
                position.grid_x,
                position.grid_y
              )
            }
          >
            <div
              className={
                styles[
                  getTreeClassFromPosition(
                    position.grid_x,
                    position.grid_y,
                    block.width,
                    block.height
                  )
                ]
              }
              style={{ backgroundColor: getTreeStatusColor(tree.status) }}
              title={`${tree.name} (${tree.code}) - ${tree.status}`}
              data-status={tree.status}
            >
              {tree.code}
            </div>
          </div>
        );
      }
    });

    // Add visible circles at 3ft intervals (9x9 = 81 positions for 24x24 block)
    // But make ALL 1ft positions clickable (invisible planting spots)

    // First, add visible circles at 3ft spacing
    for (let y = 0; y <= block.height; y += 3) {
      for (let x = 0; x <= block.width; x += 3) {
        // Skip if beyond block boundaries
        if (x > block.width || y > block.height) continue;

        // Determine if this is an edge position
        const isEdge =
          x === 0 || x === block.width || y === 0 || y === block.height;

        const hasTree = blockTrees.some((tree) =>
          tree.tree_positions?.some(
            (pos) =>
              pos.block_index === blockIndex &&
              pos.grid_x === x &&
              pos.grid_y === y &&
              pos.layout_id === layout?.id
          )
        );

        if (!hasTree) {
          emptySpots.push(
            <div
              key={`visible-${blockIndex}-${x}-${y}`}
              className={styles.intersection}
              style={{
                position: "absolute",
                left: `${x * 20}px`, // Perfect grid alignment
                top: `${y * 20}px`, // Perfect grid alignment
                zIndex: 10,
                transform: "translate(-50%, -50%)",
              }}
              onClick={() => handleIntersectionClick(blockIndex, x, y)}
            >
              <div
                className={`${styles.emptyIntersection} ${
                  isEdge ? styles.edgeIntersection : ""
                }`}
                title={`Plant tree at ${x}ft, ${y}ft ${
                  isEdge
                    ? "- Edge position (3ft grid)"
                    : "- Interior position (3ft grid)"
                }`}
              />
            </div>
          );
        }
      }
    }

    // Add a single large clickable overlay for 1ft precision planting
    // This replaces 625 individual elements with just 1!
    emptySpots.push(
      <div
        key={`precision-overlay-${blockIndex}`}
        style={{
          position: "absolute",
          left: "0px",
          top: "0px",
          width: `${block.width * 20}px`,
          height: `${block.height * 20}px`,
          zIndex: 1, // Below visible circles
          cursor: "crosshair",
        }}
        onClick={(e) => {
          // Calculate exact click position for 1ft precision
          const rect = e.currentTarget.getBoundingClientRect();
          const x = Math.round((e.clientX - rect.left) / 20);
          const y = Math.round((e.clientY - rect.top) / 20);

          // Don't interfere with 3ft grid circles
          if (x % 3 === 0 && y % 3 === 0) return;

          // Check bounds
          if (x >= 0 && x <= block.width && y >= 0 && y <= block.height) {
            handleIntersectionClick(blockIndex, x, y);
          }
        }}
        title="Click anywhere for 1ft precision planting"
      />
    );

    return (
      <div
        key={blockIndex}
        className={styles.block}
        style={{
          position: "absolute",
          left: `${block.x * 20}px`, // Perfect positioning
          top: `${block.y * 20}px`, // Perfect positioning
          width: `${block.width * 20}px`, // Exact block size
          height: `${block.height * 20}px`, // Exact block size
          transform: `scale(${zoom})`,
          transformOrigin: "top left",
        }}
      >
        <div className={styles.blockHeader}>
          Block {blockIndex + 1} ({block.width}×{block.height}ft)
        </div>

        {/* Optimized grid with CSS background pattern */}
        <div
          className={styles.grid}
          style={{
            position: "relative",
            width: `${block.width * 20}px`,
            height: `${block.height * 20}px`,
          }}
        >
          {/* Trees and interactive spots only */}
          {treeElements}
          {emptySpots}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading farm layout...</p>
      </div>
    );
  }

  const blocks = layout?.grid_config?.blocks || [];

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <h4 className="mb-0">{layout?.name || "Farm Layout"}</h4>
          <small className="text-muted">{layout?.description}</small>
        </div>
        <div className="d-flex gap-2">
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.1))}
          >
            🔍- Zoom Out
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={() => setZoom(1)}
          >
            🎯 Reset ({(zoom * 100).toFixed(0)}%)
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={() => setZoom((prev) => Math.min(2, prev + 0.1))}
          >
            🔍+ Zoom In
          </Button>
          <Button size="sm" variant="outline-primary" onClick={fetchTrees}>
            🔄 Refresh
          </Button>
        </div>
      </Card.Header>

      <Card.Body>
        <div className="position-relative">
          {/* External Expansion Buttons - Outside the grid */}
          {showExpandButtons && (
            <>
              {/* Top Add Button */}
              <div
                style={{
                  position: "fixed",
                  top: "10px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 1000,
                }}
              >
                <Button
                  variant="success"
                  size="sm"
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
                    boxShadow: "0 2px 8px rgba(40, 167, 69, 0.3)",
                    border: "2px solid #ffffff",
                  }}
                  title="Add Row Above"
                >
                  +
                </Button>
              </div>

              {/* Right Add Button */}
              <div
                style={{
                  position: "fixed",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 1000,
                }}
              >
                <Button
                  variant="success"
                  size="sm"
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
                    boxShadow: "0 2px 8px rgba(40, 167, 69, 0.3)",
                    border: "2px solid #ffffff",
                  }}
                  title="Add Column Right"
                >
                  +
                </Button>
              </div>

              {/* Bottom Add Button */}
              <div
                style={{
                  position: "fixed",
                  bottom: "10px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 1000,
                }}
              >
                <Button
                  variant="success"
                  size="sm"
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
                    boxShadow: "0 2px 8px rgba(40, 167, 69, 0.3)",
                    border: "2px solid #ffffff",
                  }}
                  title="Add Row Below"
                >
                  +
                </Button>
              </div>

              {/* Left Add Button */}
              <div
                style={{
                  position: "fixed",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 1000,
                }}
              >
                <Button
                  variant="success"
                  size="sm"
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
                    boxShadow: "0 2px 8px rgba(40, 167, 69, 0.3)",
                    border: "2px solid #ffffff",
                  }}
                  title="Add Column Left"
                >
                  +
                </Button>
              </div>
            </>
          )}

          <div className={styles.farmContainer}>
            <div
              className={styles.farmLayout}
              style={{
                width: `${Math.max(...blocks.map((b) => b.x + b.width)) * 2}px`,
                height: `${
                  Math.max(...blocks.map((b) => b.y + b.height)) * 2
                }px`,
                minWidth: "1000px",
                minHeight: "600px",
              }}
            >
              {blocks.map((block, index) => renderBlock(block, index))}
            </div>
          </div>
        </div>

        {/* Controls and Legend */}
        <Row className="mt-3">
          <Col md={6}>
            <div className="d-flex flex-wrap gap-3 align-items-center">
              <small className="text-muted">
                <strong>Tree Types:</strong>
              </small>
              <div className="d-flex align-items-center gap-1">
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    backgroundColor: "#ffffff",
                    border: "2px solid #28a745",
                    color: "#28a745",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "8px",
                    fontWeight: "700",
                  }}
                >
                  M
                </div>
                <small>
                  Mango ({trees.filter((t) => t.code === "M").length})
                </small>
              </div>
              <div className="d-flex align-items-center gap-1">
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    backgroundColor: "#e3f2fd",
                    border: "2px solid #2196f3",
                    color: "#1976d2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "8px",
                    fontWeight: "700",
                  }}
                >
                  L
                </div>
                <small>
                  Lemon ({trees.filter((t) => t.code === "L").length})
                </small>
              </div>
              <div className="d-flex align-items-center gap-1">
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    backgroundColor: "#fff3e0",
                    border: "2px solid #ff9800",
                    color: "#f57c00",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "8px",
                    fontWeight: "700",
                  }}
                >
                  P
                </div>
                <small>
                  Pomegranate ({trees.filter((t) => t.code === "P").length})
                </small>
              </div>
              <div className="d-flex align-items-center gap-1">
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "2px solid #28a745",
                    boxShadow: "0 2px 6px rgba(40, 167, 69, 0.3)",
                  }}
                ></div>
                <small>Edge (Shared)</small>
              </div>
              <div className="d-flex align-items-center gap-1">
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    border: "1px solid #28a745",
                    opacity: "0.7",
                  }}
                ></div>
                <small>Interior (3ft)</small>
              </div>
              <div className="d-flex align-items-center gap-1">
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    backgroundColor: "transparent",
                    border: "1px dashed #28a745",
                    opacity: "0.5",
                    cursor: "crosshair",
                  }}
                ></div>
                <small>1ft Precision (Click anywhere)</small>
              </div>
            </div>
          </Col>
          <Col md={6} className="text-end">
            <small className="text-muted">
              <strong>3ft Grid System:</strong> 9 visible circles per 24ft block
              <br />
              <strong>1ft Precision:</strong> Click anywhere for exact planting
            </small>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default CSSGridFarm;
