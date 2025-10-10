"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Button,
  Row,
  Col,
  Card,
  Badge,
  Alert,
  Spinner,
} from "react-bootstrap";
import { toast } from "react-hot-toast";
import {
  LAYOUT_TEMPLATES,
  generateBlocks,
  calculateLayoutStats,
  getSuggestedArrangements,
} from "./LayoutTemplates";

const CreateLayoutModal = ({
  show,
  onHide,
  farmId,
  onLayoutCreated,
  existingLayouts = [],
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState("24x24");
  const [customSize, setCustomSize] = useState({ width: 24, height: 24 });
  const [arrangement, setArrangement] = useState("2x4");
  const [layoutName, setLayoutName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [previewBlocks, setPreviewBlocks] = useState([]);
  const [maxBlocks, setMaxBlocks] = useState(20);

  // Update arrangement when template changes
  useEffect(() => {
    const template = LAYOUT_TEMPLATES[selectedTemplate];
    if (template && !template.arrangements.includes(arrangement)) {
      setArrangement(template.defaultArrangement);
    }
  }, [selectedTemplate, arrangement]);

  // Generate preview blocks
  useEffect(() => {
    try {
      const blocks = generateBlocks(
        selectedTemplate,
        arrangement,
        selectedTemplate === "custom" ? customSize : null
      );
      setPreviewBlocks(blocks);
    } catch (error) {
      console.error("Error generating preview blocks:", error);
      setPreviewBlocks([]);
    }
  }, [selectedTemplate, arrangement, customSize]);

  // Auto-generate layout name
  useEffect(() => {
    if (!layoutName && selectedTemplate && arrangement) {
      const template = LAYOUT_TEMPLATES[selectedTemplate];
      const [cols, rows] = arrangement.split("x").map(Number);
      const suggestedName = `${template.name} - ${cols}×${rows} Grid`;
      setLayoutName(suggestedName);
    }
  }, [selectedTemplate, arrangement, layoutName]);

  const handleTemplateChange = (templateKey) => {
    setSelectedTemplate(templateKey);
    const template = LAYOUT_TEMPLATES[templateKey];
    if (template) {
      setArrangement(template.defaultArrangement);
    }
  };

  const handleCustomSizeChange = (dimension, value) => {
    const newSize = { ...customSize, [dimension]: parseInt(value) || 1 };
    setCustomSize(newSize);
  };

  const handleArrangementChange = (newArrangement) => {
    setArrangement(newArrangement);
  };

  const validateForm = () => {
    if (!layoutName.trim()) {
      toast.error("Please enter a layout name");
      return false;
    }

    if (selectedTemplate === "custom") {
      if (customSize.width < 1 || customSize.height < 1) {
        toast.error("Block dimensions must be at least 1ft");
        return false;
      }
      if (customSize.width > 100 || customSize.height > 100) {
        toast.error("Block dimensions cannot exceed 100ft");
        return false;
      }
    }

    // Check for duplicate names
    const isDuplicate = existingLayouts.some(
      (layout) => layout.name.toLowerCase() === layoutName.toLowerCase()
    );
    if (isDuplicate) {
      toast.error("A layout with this name already exists");
      return false;
    }

    return true;
  };

  const createLayout = async () => {
    if (!validateForm()) return;

    setIsCreating(true);
    try {
      const blocks = generateBlocks(
        selectedTemplate,
        arrangement,
        selectedTemplate === "custom" ? customSize : null
      );

      const stats = calculateLayoutStats(blocks);
      const template = LAYOUT_TEMPLATES[selectedTemplate];

      const response = await fetch("/api/farm-layouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farm_id: farmId,
          name: layoutName.trim(),
          description:
            description.trim() ||
            `${template.description} - ${arrangement} arrangement (${stats.totalBlocks} blocks, ${stats.totalArea} sq ft)`,
          grid_config: { blocks },
          is_active: false, // Don't auto-activate new layouts
        }),
      });

      if (response.ok) {
        const newLayout = await response.json();
        toast.success(`Layout "${layoutName}" created successfully!`);
        onLayoutCreated(newLayout);
        resetForm();
        onHide();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create layout");
      }
    } catch (error) {
      console.error("Error creating layout:", error);
      toast.error("Failed to create layout");
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setSelectedTemplate("24x24");
    setCustomSize({ width: 24, height: 24 });
    setArrangement("2x4");
    setLayoutName("");
    setDescription("");
    setMaxBlocks(20);
  };

  const stats = calculateLayoutStats(previewBlocks);
  const template = LAYOUT_TEMPLATES[selectedTemplate];
  const suggestedArrangements = getSuggestedArrangements(
    selectedTemplate,
    maxBlocks
  );

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="border-success">
        <Modal.Title className="d-flex align-items-center gap-2">
          <i className={`ti-${template.icon} text-${template.color}`}></i>
          Create New Farm Layout
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="d-flex flex-column gap-4">
          {/* Template Selection */}
          <div>
            <Form.Label className="fw-medium mb-3">
              <i className="ti-layout-grid3 me-2"></i>
              Choose Template
            </Form.Label>
            <Row className="g-3">
              {Object.entries(LAYOUT_TEMPLATES).map(([key, template]) => (
                <Col xs={12} md={6} lg={4} key={key}>
                  <Card
                    className={`border-${
                      template.color
                    } border-opacity-25 cursor-pointer ${
                      selectedTemplate === key
                        ? `border-${template.color} bg-${template.color}-subtle`
                        : ""
                    }`}
                    onClick={() => handleTemplateChange(key)}
                    style={{ cursor: "pointer" }}
                  >
                    <Card.Body className="py-3">
                      <div className="d-flex align-items-start gap-3">
                        <div className={`text-${template.color} flex-shrink-0`}>
                          <i className={`ti-${template.icon} fs-4`}></i>
                        </div>
                        <div className="flex-grow-1 min-width-0">
                          <h6 className="mb-1 text-truncate">
                            {template.name}
                          </h6>
                          <small className="text-muted d-block text-wrap">
                            {template.description}
                          </small>
                          <div className="mt-1">
                            <Badge bg={template.color} className="me-1">
                              {template.blockSize.width}×
                              {template.blockSize.height}ft
                            </Badge>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {selectedTemplate === key && (
                            <i className="ti-check-circle text-success fs-5"></i>
                          )}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>

          {/* Custom Size Input */}
          {selectedTemplate === "custom" && (
            <div>
              <Form.Label className="fw-medium mb-2">
                <i className="ti-ruler me-2"></i>
                Block Dimensions
              </Form.Label>
              <Row className="g-2">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Width (ft)</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      max="100"
                      value={customSize.width}
                      onChange={(e) =>
                        handleCustomSizeChange("width", e.target.value)
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Height (ft)</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      max="100"
                      value={customSize.height}
                      onChange={(e) =>
                        handleCustomSizeChange("height", e.target.value)
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>
          )}

          {/* Arrangement Selection */}
          <div>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <Form.Label className="fw-medium mb-0">
                <i className="ti-layout-grid2 me-2"></i>
                Grid Arrangement
              </Form.Label>
              <Form.Control
                type="number"
                min="1"
                max="50"
                value={maxBlocks}
                onChange={(e) => setMaxBlocks(parseInt(e.target.value) || 20)}
                style={{ width: "80px" }}
                size="sm"
              />
            </div>
            <div className="d-flex flex-wrap gap-2">
              {suggestedArrangements.map((arr) => {
                const [cols, rows] = arr.split("x").map(Number);
                const totalBlocks = cols * rows;
                return (
                  <Button
                    key={arr}
                    variant={
                      arrangement === arr ? template.color : "outline-secondary"
                    }
                    size="sm"
                    onClick={() => handleArrangementChange(arr)}
                    className="d-flex align-items-center gap-1"
                  >
                    {arr}
                    <Badge bg="secondary" className="ms-1">
                      {totalBlocks}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Layout Details */}
          <div>
            <Form.Label className="fw-medium mb-2">
              <i className="ti-file-text me-2"></i>
              Layout Details
            </Form.Label>
            <Row className="g-2">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Layout Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={layoutName}
                    onChange={(e) => setLayoutName(e.target.value)}
                    placeholder="Enter layout name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Description (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description"
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>

          {/* Preview Stats */}
          {previewBlocks.length > 0 && (
            <Card className="border-info border-opacity-25 bg-light">
              <Card.Body className="py-3">
                <h6 className="card-title text-info mb-3">
                  <i className="ti-bar-chart me-2"></i>
                  Layout Preview
                </h6>
                <Row className="g-2 text-center">
                  <Col md={3}>
                    <div className="bg-white rounded p-2">
                      <div className="h5 text-primary mb-0">
                        {stats.totalBlocks}
                      </div>
                      <small className="text-muted">Blocks</small>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="bg-white rounded p-2">
                      <div className="h5 text-success mb-0">
                        {stats.totalArea}
                      </div>
                      <small className="text-muted">Total Area (sq ft)</small>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="bg-white rounded p-2">
                      <div className="h5 text-info mb-0">
                        {stats.dimensions.width}×{stats.dimensions.height}
                      </div>
                      <small className="text-muted">Dimensions (ft)</small>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="bg-white rounded p-2">
                      <div className="h5 text-warning mb-0">
                        {stats.averageBlockSize}
                      </div>
                      <small className="text-muted">Avg Block Size</small>
                    </div>
                  </Col>
                </Row>
                <div className="mt-2 text-center">
                  <small className="text-muted">
                    <i className="ti-info-circle me-1"></i>
                    {template.useCase}
                  </small>
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer className="border-top">
        <Button
          variant="outline-secondary"
          onClick={onHide}
          disabled={isCreating}
        >
          Cancel
        </Button>
        <Button
          variant="success"
          onClick={createLayout}
          disabled={isCreating || previewBlocks.length === 0}
        >
          {isCreating ? (
            <>
              <Spinner size="sm" className="me-2" />
              Creating...
            </>
          ) : (
            <>
              <i className="ti-plus me-2"></i>
              Create Layout
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateLayoutModal;
