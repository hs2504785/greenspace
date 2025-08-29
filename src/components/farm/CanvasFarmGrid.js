"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, Button, Row, Col, Badge } from "react-bootstrap";
import { toast } from "react-hot-toast";

const CanvasFarmGrid = ({
  farmId,
  onTreeClick,
  selectedLayoutId = null,
  showExpandButtons = true,
}) => {
  const canvasRef = useRef(null);
  const [layout, setLayout] = useState(null);
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const gridSize = 24; // 24x24 feet grid
  const cellSize = 20; // Base size of each cell in pixels
  const blockPadding = 40; // Padding between blocks

  useEffect(() => {
    if (selectedLayoutId) {
      fetchLayout();
      fetchTrees();
    } else if (farmId) {
      fetchLayout();
    }
  }, [farmId, selectedLayoutId]);

  useEffect(() => {
    if (layout) {
      centerView();
      drawGrid();
    }
  }, [layout]);

  useEffect(() => {
    if (layout) {
      drawGrid();
    }
  }, [trees, zoom, pan]);

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

  const drawGrid = () => {
    const canvas = canvasRef.current;
    if (!canvas || !layout) return;

    const ctx = canvas.getContext("2d");
    const blocks = layout.grid_config.blocks || [];

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context
    ctx.save();

    // Apply zoom and pan
    ctx.scale(zoom, zoom);
    ctx.translate(pan.x, pan.y);

    // Draw each block
    blocks.forEach((block, blockIndex) => {
      drawBlock(ctx, block, blockIndex);
    });

    // Restore context
    ctx.restore();
  };

  const drawBlock = (ctx, block, blockIndex) => {
    const startX = block.x * cellSize;
    const startY = block.y * cellSize;

    // Draw block background
    ctx.fillStyle = "#f8f9fa";
    ctx.fillRect(
      startX,
      startY,
      block.width * cellSize,
      block.height * cellSize
    );

    // Draw block border
    ctx.strokeStyle = "#28a745";
    ctx.lineWidth = 3;
    ctx.strokeRect(
      startX,
      startY,
      block.width * cellSize,
      block.height * cellSize
    );

    // Draw block label
    ctx.fillStyle = "#28a745";
    ctx.font = "bold 14px Arial";
    ctx.fillText(
      `Block ${blockIndex + 1} (${block.width}×${block.height}ft)`,
      startX + 5,
      startY - 8
    );

    // Draw grid lines
    ctx.strokeStyle = "#dee2e6";
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= block.width; x++) {
      const lineX = startX + x * cellSize;
      ctx.beginPath();
      ctx.moveTo(lineX, startY);
      ctx.lineTo(lineX, startY + block.height * cellSize);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= block.height; y++) {
      const lineY = startY + y * cellSize;
      ctx.beginPath();
      ctx.moveTo(startX, lineY);
      ctx.lineTo(startX + block.width * cellSize, lineY);
      ctx.stroke();
    }

    // Draw intersection dots and trees
    for (let x = 0; x < block.width; x++) {
      for (let y = 0; y < block.height; y++) {
        const dotX = startX + x * cellSize + cellSize / 2;
        const dotY = startY + y * cellSize + cellSize / 2;

        const tree = getTreeAtPosition(blockIndex, x, y);

        if (tree) {
          // Draw tree circle
          ctx.fillStyle = getTreeColor(tree.status);
          ctx.beginPath();
          ctx.arc(dotX, dotY, cellSize * 0.35, 0, 2 * Math.PI);
          ctx.fill();

          // Draw tree border
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.stroke();

          // Draw tree code
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 12px Arial";
          ctx.textAlign = "center";
          ctx.fillText(tree.code, dotX, dotY + 4);
        } else {
          // Draw empty intersection dot
          ctx.fillStyle = "#6c757d";
          ctx.beginPath();
          ctx.arc(dotX, dotY, 3, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }
  };

  const getTreeColor = (status) => {
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

  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    if (!canvas || !layout) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoom - pan.x;
    const y = (event.clientY - rect.top) / zoom - pan.y;

    const blocks = layout.grid_config.blocks || [];

    blocks.forEach((block, blockIndex) => {
      const startX = block.x * cellSize;
      const startY = block.y * cellSize;

      if (
        x >= startX &&
        x <= startX + block.width * cellSize &&
        y >= startY &&
        y <= startY + block.height * cellSize
      ) {
        const gridX = Math.floor((x - startX) / cellSize);
        const gridY = Math.floor((y - startY) / cellSize);

        if (
          gridX >= 0 &&
          gridX < block.width &&
          gridY >= 0 &&
          gridY < block.height
        ) {
          const tree = getTreeAtPosition(blockIndex, gridX, gridY);
          if (onTreeClick) {
            onTreeClick(tree, { blockIndex, x: gridX, y: gridY });
          }
        }
      }
    });
  };

  const handleMouseDown = (event) => {
    setIsDragging(true);
    setLastMousePos({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event) => {
    if (!isDragging) return;

    const deltaX = event.clientX - lastMousePos.x;
    const deltaY = event.clientY - lastMousePos.y;

    setPan((prev) => ({
      x: prev.x + deltaX / zoom,
      y: prev.y + deltaY / zoom,
    }));

    setLastMousePos({ x: event.clientX, y: event.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (event) => {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.max(0.1, Math.min(3, prev * zoomFactor)));
  };

  const centerView = () => {
    if (!layout || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const blocks = layout.grid_config.blocks || [];

    if (blocks.length === 0) return;

    // Calculate bounds of all blocks
    const minX = Math.min(...blocks.map((b) => b.x));
    const minY = Math.min(...blocks.map((b) => b.y));
    const maxX = Math.max(...blocks.map((b) => b.x + b.width));
    const maxY = Math.max(...blocks.map((b) => b.y + b.height));

    const gridWidth = (maxX - minX) * cellSize;
    const gridHeight = (maxY - minY) * cellSize;

    // Calculate center position
    const centerX = canvas.width / 2 - gridWidth / 2 - minX * cellSize;
    const centerY = canvas.height / 2 - gridHeight / 2 - minY * cellSize;

    setPan({ x: centerX, y: centerY });
  };

  const resetView = () => {
    setZoom(1);
    centerView();
  };

  const zoomIn = () => {
    setZoom((prev) => Math.min(3, prev * 1.2));
  };

  const zoomOut = () => {
    setZoom((prev) => Math.max(0.1, prev / 1.2));
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

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <h4 className="mb-0">{layout?.name || "Farm Layout"}</h4>
          <small className="text-muted">{layout?.description}</small>
        </div>
        <div className="d-flex gap-2">
          <Button size="sm" variant="outline-secondary" onClick={zoomOut}>
            🔍- Zoom Out
          </Button>
          <Button size="sm" variant="outline-secondary" onClick={resetView}>
            🎯 Center
          </Button>
          <Button size="sm" variant="outline-secondary" onClick={zoomIn}>
            🔍+ Zoom In
          </Button>
          <Button size="sm" variant="outline-primary" onClick={fetchTrees}>
            🔄 Refresh
          </Button>
        </div>
      </Card.Header>

      <Card.Body>
        <div className="position-relative">
          {/* Expansion Buttons */}
          {showExpandButtons && (
            <>
              {/* Top */}
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

              {/* Right */}
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

              {/* Bottom */}
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

              {/* Left */}
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

          <canvas
            ref={canvasRef}
            width={1200}
            height={800}
            style={{
              border: "2px solid #dee2e6",
              borderRadius: "8px",
              cursor: isDragging ? "grabbing" : "grab",
              width: "100%",
              height: "600px",
              maxWidth: "100%",
            }}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          />

          {/* Zoom indicator */}
          <div
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              background: "rgba(0,0,0,0.7)",
              color: "white",
              padding: "5px 10px",
              borderRadius: "5px",
              fontSize: "12px",
            }}
          >
            Zoom: {(zoom * 100).toFixed(0)}%
          </div>
        </div>

        {/* Controls and Legend */}
        <Row className="mt-3">
          <Col md={6}>
            <div className="d-flex flex-wrap gap-3 align-items-center">
              <small className="text-muted">Legend:</small>
              <div className="d-flex align-items-center gap-1">
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    backgroundColor: "#28a745",
                  }}
                ></div>
                <small>Healthy Tree</small>
              </div>
              <div className="d-flex align-items-center gap-1">
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    backgroundColor: "#6c757d",
                  }}
                ></div>
                <small>Empty Spot</small>
              </div>
            </div>
          </Col>
          <Col md={6} className="text-end">
            <small className="text-muted">
              <strong>Controls:</strong> Click to plant/view • Drag to pan •
              Scroll to zoom
            </small>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default CanvasFarmGrid;
