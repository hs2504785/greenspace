"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  Row,
  Col,
  Card,
  Badge,
  Alert,
  Spinner,
  ButtonGroup,
  InputGroup,
} from "react-bootstrap";
import { toast } from "react-hot-toast";
import {
  LAYOUT_TEMPLATES,
  generateBlocks,
  calculateLayoutStats,
} from "./LayoutTemplates";

const EditLayoutModal = ({ show, onHide, layout, onLayoutUpdated, farmId }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [blocks, setBlocks] = useState([]);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState(null);
  const [showBlockEditor, setShowBlockEditor] = useState(false);

  // Initialize form data when layout changes
  useEffect(() => {
    if (layout) {
      setFormData({
        name: layout.name || "",
        description: layout.description || "",
      });
      setBlocks(layout.grid_config?.blocks || []);
    }
  }, [layout]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBlockChange = (index, field, value) => {
    const newBlocks = [...blocks];
    newBlocks[index] = {
      ...newBlocks[index],
      [field]: parseInt(value) || 0,
    };
    setBlocks(newBlocks);
  };

  const addBlock = () => {
    const newBlock = {
      x: 0,
      y: 0,
      width: 24,
      height: 24,
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlockIndex(blocks.length);
    setShowBlockEditor(true);
  };

  const removeBlock = (index) => {
    if (blocks.length <= 1) {
      toast.error("At least one block is required");
      return;
    }
    const newBlocks = blocks.filter((_, i) => i !== index);
    setBlocks(newBlocks);
    if (selectedBlockIndex === index) {
      setSelectedBlockIndex(null);
      setShowBlockEditor(false);
    }
  };

  const duplicateBlock = (index) => {
    const blockToDuplicate = blocks[index];
    const newBlock = {
      ...blockToDuplicate,
      x: blockToDuplicate.x + blockToDuplicate.width,
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
  };

  const updateLayout = async () => {
    if (!formData.name.trim()) {
      toast.error("Layout name is required");
      return;
    }

    if (blocks.length === 0) {
      toast.error("At least one block is required");
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch("/api/farm-layouts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: layout.id,
          name: formData.name.trim(),
          description: formData.description.trim(),
          grid_config: { blocks },
        }),
      });

      if (response.ok) {
        const updatedLayout = await response.json();
        toast.success("Layout updated successfully!");
        onLayoutUpdated(updatedLayout);
        onHide();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to update layout");
      }
    } catch (error) {
      console.error("Error updating layout:", error);
      toast.error("Failed to update layout");
    } finally {
      setIsUpdating(false);
    }
  };

  const resetForm = () => {
    if (layout) {
      setFormData({
        name: layout.name || "",
        description: layout.description || "",
      });
      setBlocks(layout.grid_config?.blocks || []);
    }
    setSelectedBlockIndex(null);
    setShowBlockEditor(false);
  };

  const stats = calculateLayoutStats(blocks);

  if (!layout) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="ti-pencil me-2"></i>
          Edit Layout: {layout.name}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Row>
          {/* Left Column - Layout Info */}
          <Col md={6}>
            <Card className="h-100">
              <Card.Header>
                <h6 className="mb-0">
                  <i className="ti-info-circle me-2"></i>
                  Layout Information
                </h6>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Layout Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter layout name"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Enter layout description"
                  />
                </Form.Group>

                <div className="mb-3">
                  <h6 className="mb-2">Layout Statistics</h6>
                  <div className="d-flex flex-wrap gap-2">
                    <Badge bg="info">{stats.totalBlocks} blocks</Badge>
                    <Badge bg="secondary">{stats.totalArea} sq ft</Badge>
                    <Badge bg="primary">
                      {stats.dimensions.width}×{stats.dimensions.height}ft
                    </Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Right Column - Block Management */}
          <Col md={6}>
            <Card className="h-100">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <i className="ti-layout-grid3 me-2"></i>
                  Block Management
                </h6>
                <Button
                  variant="success"
                  size="sm"
                  onClick={addBlock}
                  disabled={isUpdating}
                >
                  <i className="ti-plus me-1"></i>
                  Add Block
                </Button>
              </Card.Header>
              <Card.Body>
                {blocks.length === 0 ? (
                  <Alert variant="info" className="text-center">
                    <i className="ti-info-circle me-2"></i>
                    No blocks defined. Add your first block to get started.
                  </Alert>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {blocks.map((block, index) => (
                      <Card
                        key={index}
                        className={`border ${
                          selectedBlockIndex === index
                            ? "border-primary bg-primary-subtle"
                            : "border-secondary"
                        }`}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setSelectedBlockIndex(index);
                          setShowBlockEditor(true);
                        }}
                      >
                        <Card.Body className="py-2">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="flex-grow-1">
                              <h6 className="mb-1">
                                Block {index + 1}
                                {selectedBlockIndex === index && (
                                  <Badge bg="primary" className="ms-2">
                                    Selected
                                  </Badge>
                                )}
                              </h6>
                              <small className="text-muted">
                                Position: ({block.x}, {block.y}) | Size:{" "}
                                {block.width}×{block.height}ft
                              </small>
                            </div>
                            <ButtonGroup size="sm">
                              <Button
                                variant="outline-info"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateBlock(index);
                                }}
                                title="Duplicate Block"
                              >
                                <i className="ti-files"></i>
                              </Button>
                              <Button
                                variant="outline-danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeBlock(index);
                                }}
                                disabled={blocks.length <= 1}
                                title="Remove Block"
                              >
                                <i className="ti-trash"></i>
                              </Button>
                            </ButtonGroup>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Block Editor */}
        {showBlockEditor && selectedBlockIndex !== null && (
          <Card className="mt-3">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">
                <i className="ti-settings me-2"></i>
                Edit Block {selectedBlockIndex + 1}
              </h6>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  setShowBlockEditor(false);
                  setSelectedBlockIndex(null);
                }}
              >
                <i className="ti-close"></i>
              </Button>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>X Position (feet)</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      value={blocks[selectedBlockIndex]?.x || 0}
                      onChange={(e) =>
                        handleBlockChange(
                          selectedBlockIndex,
                          "x",
                          e.target.value
                        )
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Y Position (feet)</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      value={blocks[selectedBlockIndex]?.y || 0}
                      onChange={(e) =>
                        handleBlockChange(
                          selectedBlockIndex,
                          "y",
                          e.target.value
                        )
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Width (feet)</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      value={blocks[selectedBlockIndex]?.width || 24}
                      onChange={(e) =>
                        handleBlockChange(
                          selectedBlockIndex,
                          "width",
                          e.target.value
                        )
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Height (feet)</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      value={blocks[selectedBlockIndex]?.height || 24}
                      onChange={(e) =>
                        handleBlockChange(
                          selectedBlockIndex,
                          "height",
                          e.target.value
                        )
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={resetForm}>
          <i className="ti-reload me-1"></i>
          Reset
        </Button>
        <Button variant="outline-secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={updateLayout}
          disabled={isUpdating || !formData.name.trim()}
        >
          {isUpdating ? (
            <>
              <Spinner size="sm" className="me-2" />
              Updating...
            </>
          ) : (
            <>
              <i className="ti-check me-1"></i>
              Update Layout
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditLayoutModal;
