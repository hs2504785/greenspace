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
  Tab,
  Tabs,
} from "react-bootstrap";
import { toast } from "react-hot-toast";
import {
  LAYOUT_TEMPLATES,
  generateBlocks,
  calculateLayoutStats,
} from "./LayoutTemplates";

const TemplateManagementModal = ({
  show,
  onHide,
  layout,
  onTemplateCreated,
  farmId,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [templateData, setTemplateData] = useState({
    name: "",
    description: "",
    category: "custom",
  });
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [activeTab, setActiveTab] = useState("save");

  // Load saved templates on mount
  useEffect(() => {
    if (show) {
      loadSavedTemplates();
    }
  }, [show]);

  const loadSavedTemplates = async () => {
    try {
      // For now, we'll use localStorage to store templates
      // In a real app, you'd fetch from an API
      const templates = JSON.parse(localStorage.getItem("layoutTemplates") || "[]");
      setSavedTemplates(templates);
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  const handleInputChange = (field, value) => {
    setTemplateData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveAsTemplate = async () => {
    if (!templateData.name.trim()) {
      toast.error("Template name is required");
      return;
    }

    if (!layout) {
      toast.error("No layout to save as template");
      return;
    }

    setIsSaving(true);

    try {
      const template = {
        id: Date.now().toString(),
        name: templateData.name.trim(),
        description: templateData.description.trim(),
        category: templateData.category,
        layout_config: layout.grid_config,
        created_at: new Date().toISOString(),
        stats: calculateLayoutStats(layout.grid_config.blocks),
      };

      // Save to localStorage (in a real app, save to database)
      const existingTemplates = JSON.parse(localStorage.getItem("layoutTemplates") || "[]");
      const updatedTemplates = [...existingTemplates, template];
      localStorage.setItem("layoutTemplates", JSON.stringify(updatedTemplates));

      toast.success(`Template "${template.name}" saved successfully!`);
      setSavedTemplates(updatedTemplates);
      setTemplateData({ name: "", description: "", category: "custom" });
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const createFromTemplate = async (template) => {
    if (!farmId) {
      toast.error("Farm ID is required");
      return;
    }

    try {
      const newLayout = {
        farm_id: farmId,
        name: `${template.name} Layout`,
        description: `Created from template: ${template.description}`,
        grid_config: template.layout_config,
        is_active: false,
      };

      const response = await fetch("/api/farm-layouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLayout),
      });

      if (response.ok) {
        const createdLayout = await response.json();
        toast.success(`Layout created from template "${template.name}"!`);
        if (onTemplateCreated) {
          onTemplateCreated(createdLayout);
        }
        onHide();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to create layout from template");
      }
    } catch (error) {
      console.error("Error creating layout from template:", error);
      toast.error("Failed to create layout from template");
    }
  };

  const deleteTemplate = (templateId) => {
    try {
      const updatedTemplates = savedTemplates.filter(t => t.id !== templateId);
      localStorage.setItem("layoutTemplates", JSON.stringify(updatedTemplates));
      setSavedTemplates(updatedTemplates);
      toast.success("Template deleted successfully!");
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    }
  };

  if (!layout) return null;

  const stats = calculateLayoutStats(layout.grid_config.blocks);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="ti-bookmark me-2"></i>
          Template Management
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-3"
        >
          {/* Save as Template Tab */}
          <Tab eventKey="save" title="Save as Template">
            <Row>
              <Col md={6}>
                <Card className="h-100">
                  <Card.Header>
                    <h6 className="mb-0">
                      <i className="ti-save me-2"></i>
                      Save Current Layout
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <Form.Group className="mb-3">
                      <Form.Label>Template Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={templateData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Enter template name"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={templateData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="Describe this template"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Category</Form.Label>
                      <Form.Select
                        value={templateData.category}
                        onChange={(e) => handleInputChange("category", e.target.value)}
                      >
                        <option value="custom">Custom</option>
                        <option value="vegetable">Vegetable Garden</option>
                        <option value="fruit">Fruit Trees</option>
                        <option value="herb">Herb Garden</option>
                        <option value="mixed">Mixed Crops</option>
                      </Form.Select>
                    </Form.Group>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6}>
                <Card className="h-100">
                  <Card.Header>
                    <h6 className="mb-0">
                      <i className="ti-info-circle me-2"></i>
                      Layout Preview
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-3">
                      <h6>{layout.name}</h6>
                      <p className="text-muted small">{layout.description}</p>
                    </div>

                    <div className="mb-3">
                      <h6>Layout Statistics</h6>
                      <div className="d-flex flex-wrap gap-2">
                        <Badge bg="info">{stats.totalBlocks} blocks</Badge>
                        <Badge bg="secondary">{stats.totalArea} sq ft</Badge>
                        <Badge bg="primary">
                          {stats.dimensions.width}×{stats.dimensions.height}ft
                        </Badge>
                      </div>
                    </div>

                    <div className="mb-3">
                      <h6>Block Details</h6>
                      <div className="small text-muted">
                        {layout.grid_config.blocks.map((block, index) => (
                          <div key={index}>
                            Block {index + 1}: {block.width}×{block.height}ft at ({block.x}, {block.y})
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab>

          {/* Use Templates Tab */}
          <Tab eventKey="use" title="Use Templates">
            <Row>
              <Col md={6}>
                <Card className="h-100">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">
                      <i className="ti-layout-grid3 me-2"></i>
                      Saved Templates
                    </h6>
                    <Badge bg="info">{savedTemplates.length}</Badge>
                  </Card.Header>
                  <Card.Body>
                    {savedTemplates.length === 0 ? (
                      <Alert variant="info" className="text-center">
                        <i className="ti-info-circle me-2"></i>
                        No saved templates yet. Save your first template to get started!
                      </Alert>
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        {savedTemplates.map((template) => (
                          <Card key={template.id} className="border-secondary">
                            <Card.Body className="py-2">
                              <div className="d-flex justify-content-between align-items-center">
                                <div className="flex-grow-1">
                                  <h6 className="mb-1">{template.name}</h6>
                                  <small className="text-muted d-block">
                                    {template.description}
                                  </small>
                                  <div className="mt-1">
                                    <Badge bg="info" className="me-1 small">
                                      {template.stats.totalBlocks} blocks
                                    </Badge>
                                    <Badge bg="secondary" className="small">
                                      {template.category}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="d-flex gap-1">
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    onClick={() => createFromTemplate(template)}
                                    title="Create Layout"
                                  >
                                    <i className="ti-plus"></i>
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => deleteTemplate(template.id)}
                                    title="Delete Template"
                                  >
                                    <i className="ti-trash"></i>
                                  </Button>
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        ))}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6}>
                <Card className="h-100">
                  <Card.Header>
                    <h6 className="mb-0">
                      <i className="ti-lightbulb me-2"></i>
                      Built-in Templates
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="d-flex flex-column gap-2">
                      {Object.entries(LAYOUT_TEMPLATES).map(([key, template]) => (
                        <Card key={key} className="border-success-subtle">
                          <Card.Body className="py-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <div className="flex-grow-1">
                                <h6 className="mb-1 d-flex align-items-center gap-2">
                                  <i className={`ti-${template.icon}`}></i>
                                  {template.name}
                                </h6>
                                <small className="text-muted d-block">
                                  {template.description}
                                </small>
                                <div className="mt-1">
                                  <Badge bg="success" className="small">
                                    {template.useCase}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => {
                                  // Create layout from built-in template
                                  const blocks = generateBlocks(key, template.defaultArrangement);
                                  const newLayout = {
                                    farm_id: farmId,
                                    name: `${template.name} Layout`,
                                    description: template.description,
                                    grid_config: { blocks },
                                    is_active: false,
                                  };
                                  
                                  fetch("/api/farm-layouts", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(newLayout),
                                  })
                                  .then(response => response.json())
                                  .then(createdLayout => {
                                    toast.success(`Layout created from "${template.name}" template!`);
                                    if (onTemplateCreated) {
                                      onTemplateCreated(createdLayout);
                                    }
                                    onHide();
                                  })
                                  .catch(error => {
                                    console.error("Error creating layout:", error);
                                    toast.error("Failed to create layout from template");
                                  });
                                }}
                                title="Create Layout"
                              >
                                <i className="ti-plus"></i>
                              </Button>
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab>
        </Tabs>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>
          Close
        </Button>
        {activeTab === "save" && (
          <Button
            variant="primary"
            onClick={saveAsTemplate}
            disabled={isSaving || !templateData.name.trim()}
          >
            {isSaving ? (
              <>
                <Spinner size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              <>
                <i className="ti-save me-1"></i>
                Save as Template
              </>
            )}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default TemplateManagementModal;
