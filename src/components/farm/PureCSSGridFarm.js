"use client";

import { useState, useEffect, memo } from "react";
import { Card, Button, Row, Col } from "react-bootstrap";
import { toast } from "react-hot-toast";
import styles from "./PureCSSGridFarm.module.css";

const PureCSSGridFarm = memo(
  ({
    farmId,
    onTreeClick,
    selectedLayoutId = null,
    showExpandButtons = true,
    showHeader = true,
    zoom: externalZoom,
  }) => {
    const [layout, setLayout] = useState(null);
    const [trees, setTrees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [internalZoom, setInternalZoom] = useState(1);
    const [showPlantingGuides, setShowPlantingGuides] = useState(true);

    // Use external zoom if provided, otherwise use internal zoom
    const zoom = externalZoom !== undefined ? externalZoom : internalZoom;
    const setZoom = externalZoom !== undefined ? () => {} : setInternalZoom;

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
            // Adjust all existing blocks to maintain positive coordinates
            const offsetX = minX - 24 < 0 ? 24 : 0;
            if (offsetX > 0) {
              newBlocks.forEach((block) => (block.x += offsetX));
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
            // Adjust all existing blocks to maintain positive coordinates
            const offsetY = minY - 24 < 0 ? 24 : 0;
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
                  left: `${absoluteX * 24}px`, // Perfect alignment with 24px grid lines
                  top: `${absoluteY * 24}px`, // Perfect alignment with 24px grid lines
                  transform: "translate(-50%, -50%)", // Center on grid intersection
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
                      left: `${absoluteX * 24}px`, // Perfect alignment with 24px grid lines
                      top: `${absoluteY * 24}px`, // Perfect alignment with 24px grid lines
                      transform: "translate(-50%, -50%)", // Center on grid intersection
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
                      className={
                        isEdge ? styles.edgeGuide : styles.interiorGuide
                      }
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
        {showHeader && (
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
        )}

        <Card.Body style={{ padding: "10px" }}>
          {/* Container for grid and external expansion buttons */}
          <div className={styles.layoutContainer}>
            {/* External Expansion Buttons - Outside the grid */}
            {showExpandButtons && (
              <>
                {/* Top Add Button */}
                <div
                  style={{
                    position: "fixed",
                    top: "105px",
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
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      padding: "0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      fontWeight: "bold",
                      boxShadow: "0 3px 10px rgba(40, 167, 69, 0.4)",
                      border: "3px solid #ffffff",
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
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      padding: "0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      fontWeight: "bold",
                      boxShadow: "0 3px 10px rgba(40, 167, 69, 0.4)",
                      border: "3px solid #ffffff",
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
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      padding: "0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      fontWeight: "bold",
                      boxShadow: "0 3px 10px rgba(40, 167, 69, 0.4)",
                      border: "3px solid #ffffff",
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
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      padding: "0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      fontWeight: "bold",
                      boxShadow: "0 3px 10px rgba(40, 167, 69, 0.4)",
                      border: "3px solid #ffffff",
                    }}
                    title="Add Column Left"
                  >
                    +
                  </Button>
                </div>
              </>
            )}

            {/* Clean Grid Container - No button padding */}
            <div className={styles.gridContainer}>
              {/* Scrollable Grid Wrapper */}
              <div className={styles.gridWrapper}>
                {/* **PURE CSS GRID - MAXIMUM PERFORMANCE** */}
                <div
                  className={styles.pureGrid}
                  style={{
                    width: `${maxX * 24}px`,
                    height: `${maxY * 24}px`,
                    transform: `scale(${zoom})`,
                    transformOrigin: "top left",
                    cursor: "crosshair",
                    position: "relative",
                    // Grid background is now handled in CSS module for proper visibility
                  }}
                  onClick={(e) => {
                    // **Single click handler for entire grid!**
                    const rect = e.currentTarget.getBoundingClientRect();
                    // Perfect 24px grid alignment for 1ft precision
                    const absoluteX = Math.round((e.clientX - rect.left) / 24);
                    const absoluteY = Math.round((e.clientY - rect.top) / 24);

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
                        left: `${block.x * 24 + 4}px`, // Small offset from corner
                        top: `${block.y * 24 + 2}px`, // Small offset from corner
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

                  {/* Right border lines for rightmost blocks - centered on edge circles */}
                  {blocks
                    .filter((block) => block.x + block.width === maxX) // Find rightmost blocks
                    .map((block, index) => (
                      <div
                        key={`right-border-${index}`}
                        style={{
                          position: "absolute",
                          left: `${(block.x + block.width) * 24 - 1.25}px`, // Center on rightmost circle positions
                          top: `${block.y * 24}px`, // Top of block
                          width: "2.5px", // Same thickness as other block borders
                          height: `${block.height * 24}px`, // Full height of block
                          background: "#28a745", // Same green color as other borders
                          pointerEvents: "none",
                          zIndex: 1,
                        }}
                      />
                    ))}

                  {/* **Only render actual planted trees + smart planting guides!** */}
                  {plantedTrees}
                  {plantingGuides}
                </div>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  }
);

PureCSSGridFarm.displayName = "PureCSSGridFarm";

export default PureCSSGridFarm;
