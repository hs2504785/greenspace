"use client";

import { useState, useEffect } from "react";
import { Card, Button, Row, Col } from "react-bootstrap";
import { toast } from "react-hot-toast";
import styles from "./PureCSSGridFarm.module.css";

const PureCSSGridFarm = ({
  farmId,
  onTreeClick,
  selectedLayoutId = null,
  showExpandButtons = true,
}) => {
  const [layout, setLayout] = useState(null);
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [showPlantingGuides, setShowPlantingGuides] = useState(true);

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

      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Trees API error:", response.status, errorText);
        throw new Error(`Failed to fetch trees: ${response.status}`);
      }

      const data = await response.json();
      setTrees(data);
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
          for (let y = minY; y < maxY; y += 24) {
            newBlock = { x: maxX, y, width: 24, height: 24 };
            newBlocks.push(newBlock);
          }
          break;
        case "left":
          for (let y = minY; y < maxY; y += 24) {
            newBlock = { x: minX - 24, y, width: 24, height: 24 };
            newBlocks.push(newBlock);
          }
          break;
        case "bottom":
          for (let x = minX; x < maxX; x += 24) {
            newBlock = { x, y: maxY, width: 24, height: 24 };
            newBlocks.push(newBlock);
          }
          break;
        case "top":
          for (let x = minX; x < maxX; x += 24) {
            newBlock = { x, y: minY - 24, width: 24, height: 24 };
            newBlocks.push(newBlock);
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

  if (!layout) return null;

  const blocks = layout.grid_config.blocks;
  const maxX = Math.max(...blocks.map((b) => b.x + b.width));
  const maxY = Math.max(...blocks.map((b) => b.y + b.height));

  // **PURE CSS GRID - Only render actual planted trees!**
  const plantedTrees = trees.flatMap(
    (tree) =>
      tree.tree_positions
        ?.filter((pos) => pos.layout_id === layout.id)
        ?.map((pos) => {
          const block = blocks[pos.block_index];
          if (!block) return null;

          // Calculate absolute position on entire grid
          const absoluteX = block.x + pos.grid_x;
          const absoluteY = block.y + pos.grid_y;

          return (
            <div
              key={`tree-${tree.id}-${pos.block_index}`}
              className={styles.plantedTree}
              style={{
                position: "absolute",
                left: `${absoluteX * 20}px`,
                top: `${absoluteY * 20}px`,
                transform: "translate(-50%, -50%)",
                zIndex: 1000,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onTreeClick(tree, {
                  x: pos.grid_x,
                  y: pos.grid_y,
                  blockIndex: pos.block_index,
                });
              }}
            >
              <div
                className={styles.treeCircle}
                title={`${tree.code} - ${tree.name}`}
              >
                {tree.code}
              </div>
            </div>
          );
        })
        .filter(Boolean) || []
  );

  // **Smart Planting Guides - Only 3ft intervals for performance**
  const plantingGuides = showPlantingGuides
    ? blocks.flatMap((block, blockIndex) => {
        const guides = [];

        // Generate 3ft interval guides (much fewer than 1ft)
        for (let y = 0; y <= block.height; y += 3) {
          for (let x = 0; x <= block.width; x += 3) {
            // Skip if beyond boundaries
            if (x > block.width || y > block.height) continue;

            // Calculate absolute position
            const absoluteX = block.x + x;
            const absoluteY = block.y + y;

            // Check if there's already a tree here
            const hasTree = trees.some((tree) =>
              tree.tree_positions?.some(
                (pos) =>
                  pos.block_index === blockIndex &&
                  pos.grid_x === x &&
                  pos.grid_y === y &&
                  pos.layout_id === layout.id
              )
            );

            if (!hasTree) {
              // Determine if this is an edge position
              const isEdge =
                x === 0 || x === block.width || y === 0 || y === block.height;

              guides.push(
                <div
                  key={`guide-${blockIndex}-${x}-${y}`}
                  className={styles.plantingGuide}
                  style={{
                    position: "absolute",
                    left: `${absoluteX * 20}px`,
                    top: `${absoluteY * 20}px`,
                    transform: "translate(-50%, -50%)",
                    zIndex: isEdge ? 100 : 50,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTreeClick(null, {
                      x: x,
                      y: y,
                      blockIndex: blockIndex,
                    });
                  }}
                >
                  <div
                    className={isEdge ? styles.edgeGuide : styles.interiorGuide}
                    title={`Plant tree at ${x}ft, ${y}ft ${
                      isEdge ? "(Edge - Shared)" : "(3ft Grid)"
                    }`}
                  />
                </div>
              );
            }
          }
        }

        return guides;
      })
    : [];

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <h4 className="mb-0">{layout.name || "Farm Layout"}</h4>
          <small className="text-muted">{layout.description}</small>
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
          <Button
            size="sm"
            variant={showPlantingGuides ? "success" : "outline-secondary"}
            onClick={() => setShowPlantingGuides(!showPlantingGuides)}
          >
            {showPlantingGuides ? "🟢" : "⚪"} Guides
          </Button>
        </div>
      </Card.Header>

      <Card.Body>
        <div className="position-relative">
          {/* Expansion Buttons */}
          {showExpandButtons && (
            <>
              <div
                style={{
                  position: "absolute",
                  top: "-45px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 20,
                }}
              >
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => expandGrid("top")}
                  className="shadow"
                >
                  ⬆️ Add Row Above
                </Button>
              </div>
              <div
                style={{
                  position: "absolute",
                  right: "-140px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 20,
                }}
              >
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => expandGrid("right")}
                  className="shadow"
                >
                  ➡️ Add Column
                </Button>
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: "-45px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 20,
                }}
              >
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => expandGrid("bottom")}
                  className="shadow"
                >
                  ⬇️ Add Row Below
                </Button>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: "-140px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 20,
                }}
              >
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => expandGrid("left")}
                  className="shadow"
                >
                  ⬅️ Add Column
                </Button>
              </div>
            </>
          )}

          {/* **PURE CSS GRID - MAXIMUM PERFORMANCE** */}
          <div
            className={styles.pureGrid}
            style={{
              width: `${maxX * 20}px`,
              height: `${maxY * 20}px`,
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              // **Pure CSS Grid Background - Clean lines without interfering borders**
              backgroundImage: `
                linear-gradient(to right, rgba(224, 224, 224, 0.5) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(224, 224, 224, 0.5) 1px, transparent 1px),
                linear-gradient(to right, rgba(40, 167, 69, 0.3) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(40, 167, 69, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: `
                20px 20px,
                20px 20px,
                ${24 * 20}px ${24 * 20}px,
                ${24 * 20}px ${24 * 20}px
              `,
              cursor: "crosshair",
              position: "relative",
            }}
            onClick={(e) => {
              // **Single click handler for entire grid!**
              const rect = e.currentTarget.getBoundingClientRect();
              const absoluteX = Math.round((e.clientX - rect.left) / 20);
              const absoluteY = Math.round((e.clientY - rect.top) / 20);

              // Find which block this click belongs to
              const clickedBlock = blocks.find(
                (block) =>
                  absoluteX >= block.x &&
                  absoluteX <= block.x + block.width &&
                  absoluteY >= block.y &&
                  absoluteY <= block.y + block.height
              );

              if (clickedBlock) {
                const blockIndex = blocks.indexOf(clickedBlock);
                const relativeX = absoluteX - clickedBlock.x;
                const relativeY = absoluteY - clickedBlock.y;

                // Check if there's already a tree here
                const existingTree = trees.find((tree) =>
                  tree.tree_positions?.some(
                    (pos) =>
                      pos.block_index === blockIndex &&
                      pos.grid_x === relativeX &&
                      pos.grid_y === relativeY &&
                      pos.layout_id === layout.id
                  )
                );

                if (existingTree) {
                  // Click on existing tree
                  onTreeClick(existingTree, {
                    x: relativeX,
                    y: relativeY,
                    blockIndex: blockIndex,
                  });
                } else {
                  // Empty spot - plant new tree
                  onTreeClick(null, {
                    x: relativeX,
                    y: relativeY,
                    blockIndex: blockIndex,
                  });
                }
              }
            }}
            title="Click anywhere to plant trees - 1ft precision!"
          >
            {/* Block labels overlay - minimal and clean */}
            {blocks.map((block, index) => (
              <div
                key={`block-label-${index}`}
                className={styles.blockLabel}
                style={{
                  position: "absolute",
                  left: `${block.x * 20 + 4}px`, // Small offset from corner
                  top: `${block.y * 20 + 2}px`, // Small offset from corner
                  height: "16px", // Much smaller height
                  background: "rgba(40, 167, 69, 0.05)",
                  border: "none", // Remove all borders
                  borderRadius: "3px",
                  padding: "0 6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: "500",
                  color: "#28a745",
                  pointerEvents: "none",
                  zIndex: 5,
                }}
              >
                Block {index + 1}
              </div>
            ))}

            {/* **Only render actual planted trees + smart planting guides!** */}
            {plantedTrees}
            {plantingGuides}
          </div>
        </div>

        {/* Legend */}
        <Row className="mt-3">
          <Col md={8}>
            <div className="d-flex flex-wrap gap-3 align-items-center">
              <small className="text-muted">
                <strong>🚀 Pure CSS Grid - Lightning Fast!</strong>
              </small>
              <div className="d-flex align-items-center gap-1">
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    backgroundColor: "#28a745",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: "700",
                  }}
                >
                  M
                </div>
                <small>Planted Trees ({trees.length} total)</small>
              </div>

              {showPlantingGuides && (
                <>
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
                    <small>Edge Guides (Shared)</small>
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
                    <small>Interior Guides (3ft)</small>
                  </div>
                </>
              )}

              <small className="text-muted">
                • 1ft Precision: Click anywhere • 3ft Guides:{" "}
                {showPlantingGuides ? "Visible" : "Hidden"}
              </small>
            </div>
          </Col>
          <Col md={4} className="text-end">
            <small className="text-muted">
              <strong>DOM Elements:</strong>{" "}
              {plantedTrees.length +
                blocks.length +
                (showPlantingGuides ? plantingGuides.length : 0)}{" "}
              only!
              <br />
              <strong>Performance:</strong> ⚡ Maximum
            </small>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default PureCSSGridFarm;
