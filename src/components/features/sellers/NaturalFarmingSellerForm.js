"use client";

import { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Badge,
  Alert,
  ProgressBar,
  InputGroup,
  Modal,
  Tooltip,
  OverlayTrigger,
} from "react-bootstrap";
import toastService from "@/utils/toastService";

const FARMING_METHODS = [
  {
    value: "organic",
    label: "Organic Certified",
    icon: "🌿",
    description: "Certified organic farming practices",
  },
  {
    value: "natural",
    label: "Natural Farming",
    icon: "🌱",
    description: "Chemical-free natural growing methods",
  },
  {
    value: "pesticide_free",
    label: "Pesticide-Free",
    icon: "🚫",
    description: "No pesticides or harmful chemicals",
  },
  {
    value: "traditional",
    label: "Traditional Methods",
    icon: "🌾",
    description: "Time-tested traditional farming",
  },
  {
    value: "biodynamic",
    label: "Biodynamic",
    icon: "🌙",
    description: "Holistic biodynamic approach",
  },
  {
    value: "permaculture",
    label: "Permaculture",
    icon: "♻️",
    description: "Sustainable permaculture design",
  },
  {
    value: "home_grown",
    label: "Home Garden",
    icon: "🏠",
    description: "Small-scale home cultivation",
  },
  {
    value: "terrace_garden",
    label: "Terrace Garden",
    icon: "🏢",
    description: "Urban terrace gardening",
  },
];

const CERTIFICATIONS = [
  { value: "organic_certified", label: "Organic Certification", icon: "📜" },
  { value: "biodynamic", label: "Biodynamic Certification", icon: "🌙" },
  { value: "fair_trade", label: "Fair Trade", icon: "🤝" },
  { value: "rainforest_alliance", label: "Rainforest Alliance", icon: "🌳" },
  {
    value: "local_certification",
    label: "Local Organic Authority",
    icon: "🏛️",
  },
];

export default function NaturalFarmingSellerForm({ onSuccess, userInfo }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Info
    location: userInfo?.location || "",
    contact_number: userInfo?.phone || "",
    whatsapp_number: userInfo?.whatsapp_number || "",

    // Farm Details
    farm_name: "",
    farm_description: "",
    farming_methods: [],
    farm_size_acres: "",
    years_farming: "",
    certifications: [],

    // Growing Practices
    growing_practices: "",
    soil_management: "",
    pest_management: "",
    water_source: "",
    seasonal_calendar: "",

    // Farm Verification
    farm_photos: [],
    farm_visit_available: false,
    farm_visit_address: "",
    preferred_visit_times: "",

    // Documents
    documents: [],
  });

  const [loading, setLoading] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);

  const totalSteps = 4;
  const progressPercentage = (currentStep / totalSteps) * 100;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleArrayToggle = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const handleFileUpload = async (files, field) => {
    // In a real implementation, upload to your file storage service
    // For now, we'll simulate with mock URLs
    const fileUrls = Array.from(files).map(
      (file, index) =>
        `https://example.com/uploads/${Date.now()}_${index}_${file.name}`
    );

    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ...fileUrls],
    }));

    toastService.success(`${files.length} file(s) uploaded successfully`);
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return (
          formData.farm_name && formData.farm_description && formData.location
        );
      case 2:
        return formData.farming_methods.length > 0 && formData.years_farming;
      case 3:
        return formData.growing_practices && formData.pest_management;
      case 4:
        return formData.farm_photos.length > 0;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    } else {
      toastService.error("Please fill in all required fields");
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      toastService.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/seller-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to submit application");

      toastService.success(
        "Natural farming seller application submitted successfully!"
      );
      onSuccess && onSuccess();
    } catch (error) {
      console.error("Error submitting application:", error);
      toastService.error("Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderFarmingMethodInfo = (method) => (
    <OverlayTrigger
      placement="top"
      overlay={<Tooltip>{method.description}</Tooltip>}
    >
      <div
        className={`farming-method-card p-3 border rounded cursor-pointer ${
          formData.farming_methods.includes(method.value)
            ? "border-success bg-light"
            : "border-secondary"
        }`}
        onClick={() => handleArrayToggle("farming_methods", method.value)}
      >
        <div className="text-center">
          <div style={{ fontSize: "2rem" }}>{method.icon}</div>
          <div className="fw-bold">{method.label}</div>
          <small className="text-muted">{method.description}</small>
        </div>
      </div>
    </OverlayTrigger>
  );

  const renderStep1 = () => (
    <Card>
      <Card.Header className="bg-success text-white">
        <h5 className="mb-0">🌱 Farm Information</h5>
      </Card.Header>
      <Card.Body>
        <Form>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Farm Name *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., Green Valley Organic Farm"
                  value={formData.farm_name}
                  onChange={(e) =>
                    handleInputChange("farm_name", e.target.value)
                  }
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Contact Number *</Form.Label>
                <Form.Control
                  type="tel"
                  value={formData.contact_number}
                  onChange={(e) =>
                    handleInputChange("contact_number", e.target.value)
                  }
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Farm Description *</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Describe your farm, its history, your farming journey, and what makes your natural farming practices special..."
              value={formData.farm_description}
              onChange={(e) =>
                handleInputChange("farm_description", e.target.value)
              }
            />
            <Form.Text className="text-muted">
              Share your passion for natural farming and what sets you apart
            </Form.Text>
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Farm Location *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="City, State"
                  value={formData.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>WhatsApp Number</Form.Label>
                <Form.Control
                  type="tel"
                  placeholder="For direct customer communication"
                  value={formData.whatsapp_number}
                  onChange={(e) =>
                    handleInputChange("whatsapp_number", e.target.value)
                  }
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Card.Body>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <Card.Header className="bg-success text-white">
        <h5 className="mb-0">🌾 Farm Size & Experience</h5>
      </Card.Header>
      <Card.Body>
        <Form>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Years in Farming *</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  max="50"
                  placeholder="e.g., 8"
                  value={formData.years_farming}
                  onChange={(e) =>
                    handleInputChange("years_farming", e.target.value)
                  }
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Farm Size (Acres)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g., 2.5"
                  value={formData.farm_size_acres}
                  onChange={(e) =>
                    handleInputChange("farm_size_acres", e.target.value)
                  }
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-4">
            <Form.Label>
              Farming Methods *{" "}
              <Button
                variant="outline-info"
                size="sm"
                onClick={() => setShowMethodModal(true)}
              >
                ℹ️ Learn More
              </Button>
            </Form.Label>
            <Row className="g-3">
              {FARMING_METHODS.map((method) => (
                <Col md={4} sm={6} key={method.value}>
                  {renderFarmingMethodInfo(method)}
                </Col>
              ))}
            </Row>
            <Form.Text className="text-muted">
              Select all methods that apply to your farming practices
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Farm Size (in acres)</Form.Label>
            <InputGroup>
              <Form.Control
                type="number"
                step="0.1"
                min="0"
                value={formData.farm_size_acres}
                onChange={(e) =>
                  handleInputChange("farm_size_acres", e.target.value)
                }
              />
              <InputGroup.Text>acres</InputGroup.Text>
            </InputGroup>
            <Form.Text className="text-muted">
              Approximate cultivation area (0.1 acres = 4356 sq ft)
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Certifications (if any)</Form.Label>
            <Row className="g-2">
              {CERTIFICATIONS.map((cert) => (
                <Col md={4} sm={6} key={cert.value}>
                  <Form.Check
                    type="checkbox"
                    id={`cert-${cert.value}`}
                    label={`${cert.icon} ${cert.label}`}
                    checked={formData.certifications.includes(cert.value)}
                    onChange={() =>
                      handleArrayToggle("certifications", cert.value)
                    }
                  />
                </Col>
              ))}
            </Row>
          </Form.Group>
        </Form>
      </Card.Body>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <Card.Header className="bg-success text-white">
        <h5 className="mb-0">🌿 Growing Practices & Methods</h5>
      </Card.Header>
      <Card.Body>
        <Form>
          <Form.Group className="mb-4">
            <Form.Label>Growing Practices *</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Describe your specific growing practices, soil preparation, seed selection, natural fertilizers used..."
              value={formData.growing_practices}
              onChange={(e) =>
                handleInputChange("growing_practices", e.target.value)
              }
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Natural Pest Management *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="How do you handle pests naturally? (neem oil, companion planting, beneficial insects, etc.)"
              value={formData.pest_management}
              onChange={(e) =>
                handleInputChange("pest_management", e.target.value)
              }
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Soil Management</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Composting, natural fertilizers, soil health practices..."
                  value={formData.soil_management}
                  onChange={(e) =>
                    handleInputChange("soil_management", e.target.value)
                  }
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Water Source</Form.Label>
                <Form.Select
                  value={formData.water_source}
                  onChange={(e) =>
                    handleInputChange("water_source", e.target.value)
                  }
                >
                  <option value="">Select water source</option>
                  <option value="rainwater">Rainwater Harvesting</option>
                  <option value="borewell">Borewell</option>
                  <option value="municipal">Municipal Supply</option>
                  <option value="river">River/Stream</option>
                  <option value="well">Traditional Well</option>
                  <option value="mixed">Multiple Sources</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Seasonal Calendar</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="What crops do you grow in different seasons? (Summer: tomatoes, peppers | Winter: leafy greens, etc.)"
              value={formData.seasonal_calendar}
              onChange={(e) =>
                handleInputChange("seasonal_calendar", e.target.value)
              }
            />
          </Form.Group>
        </Form>
      </Card.Body>
    </Card>
  );

  const renderStep4 = () => (
    <Card>
      <Card.Header className="bg-success text-white">
        <h5 className="mb-0">📸 Farm Verification & Documents</h5>
      </Card.Header>
      <Card.Body>
        <Alert variant="info">
          <Alert.Heading>🔍 Build Trust with Buyers</Alert.Heading>
          <p className="mb-0">
            Upload photos of your farm to help buyers see your natural farming
            practices. This builds confidence and trust in your products!
          </p>
        </Alert>

        <Form.Group className="mb-4">
          <Form.Label>Farm Photos * (minimum 3 photos)</Form.Label>
          <Form.Control
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileUpload(e.target.files, "farm_photos")}
          />
          <Form.Text className="text-muted">
            Include: growing areas, plants/crops, natural methods in action,
            farm overview
          </Form.Text>

          {formData.farm_photos.length > 0 && (
            <div className="mt-3">
              <h6>Uploaded Photos: {formData.farm_photos.length}</h6>
              {formData.farm_photos.map((url, index) => (
                <Badge key={index} bg="success" className="me-2">
                  Photo {index + 1}
                </Badge>
              ))}
            </div>
          )}
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label>Supporting Documents (optional)</Form.Label>
          <Form.Control
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={(e) => handleFileUpload(e.target.files, "documents")}
          />
          <Form.Text className="text-muted">
            Certifications, land documents, or other relevant documents
          </Form.Text>
        </Form.Group>

        <Card className="border-info mb-4">
          <Card.Header className="bg-info text-white">
            <h6 className="mb-0">🏡 Farm Visit Options (Optional)</h6>
          </Card.Header>
          <Card.Body>
            <Form.Check
              type="checkbox"
              id="farm-visit"
              label="Allow buyers to visit my farm (builds ultimate trust!)"
              checked={formData.farm_visit_available}
              onChange={(e) =>
                handleInputChange("farm_visit_available", e.target.checked)
              }
              className="mb-3"
            />

            {formData.farm_visit_available && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Farm Visit Address</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Complete address for farm visits"
                    value={formData.farm_visit_address}
                    onChange={(e) =>
                      handleInputChange("farm_visit_address", e.target.value)
                    }
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Preferred Visit Times</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., Weekends 10 AM - 4 PM, advance booking required"
                    value={formData.preferred_visit_times}
                    onChange={(e) =>
                      handleInputChange("preferred_visit_times", e.target.value)
                    }
                  />
                </Form.Group>
              </>
            )}
          </Card.Body>
        </Card>
      </Card.Body>
    </Card>
  );

  return (
    <Container className="py-4">
      <Card className="shadow-lg">
        <Card.Header className="bg-primary text-white text-center">
          <h3>🌱 Join as Natural Farming Seller</h3>
          <p className="mb-0">
            Help buyers discover naturally grown, chemical-free produce
          </p>
        </Card.Header>

        <Card.Body className="p-0">
          {/* Progress Bar */}
          <div className="p-4 bg-light border-bottom">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-muted">
                {Math.round(progressPercentage)}% Complete
              </span>
            </div>
            <ProgressBar now={progressPercentage} variant="success" />
          </div>

          <div className="p-4">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </div>

          {/* Navigation */}
          <div className="p-4 bg-light border-top">
            <div className="d-flex justify-content-between">
              <Button
                variant="outline-secondary"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <i className="ti ti-arrow-left me-2"></i>
                Previous
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  variant="success"
                  onClick={nextStep}
                  disabled={!validateStep(currentStep)}
                >
                  Next
                  <i className="ti ti-arrow-right ms-2"></i>
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={!validateStep(currentStep) || loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-check me-2"></i>
                      Submit Application
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Farming Methods Info Modal */}
      <Modal
        show={showMethodModal}
        onHide={() => setShowMethodModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>🌱 Natural Farming Methods</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            {FARMING_METHODS.map((method) => (
              <Col md={6} key={method.value}>
                <Card className="h-100">
                  <Card.Body className="text-center">
                    <div style={{ fontSize: "3rem" }}>{method.icon}</div>
                    <h5>{method.label}</h5>
                    <p className="text-muted">{method.description}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Modal.Body>
      </Modal>
    </Container>
  );
}
