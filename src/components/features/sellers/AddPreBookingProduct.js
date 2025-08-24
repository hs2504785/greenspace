"use client";

import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Badge,
  Spinner,
} from "react-bootstrap";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toastService from "@/utils/toastService";
import VegetableService from "@/services/VegetableService";

const defaultCategories = ["Leafy", "Root", "Fruit", "Herbs", "Vegetable"];
const harvestSeasons = ["Spring", "Summer", "Monsoon", "Winter", "Year-round"];

export default function AddPreBookingProduct() {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    estimated_available_date: "",
    harvest_season: "",
    min_order_quantity: "1",
    seller_confidence: "90",
    prebooking_notes: "",
    description: "",
    location: "",
    advance_payment_required: false,
    advance_payment_percentage: "0",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { data: session } = useSession();
  const router = useRouter();

  // Fetch user's default location when component mounts
  useEffect(() => {
    const fetchUserDefaultLocation = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch("/api/users/profile");
          const data = await response.json();

          if (data.user?.location && data.user.location.trim()) {
            setFormData((prev) => ({
              ...prev,
              location: data.user.location,
            }));
            console.log(
              "Pre-filled prebooking location from user profile:",
              data.user.location
            );
          }
        } catch (error) {
          console.error(
            "Failed to fetch user default location for prebooking:",
            error
          );
          // Don't show error to user, just continue without pre-filling
        }
      }
    };

    fetchUserDefaultLocation();
  }, [session]);

  // Calculate minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  // Calculate maximum date (1 year from now)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (
      !formData.price ||
      isNaN(formData.price) ||
      parseFloat(formData.price) < 0
    ) {
      newErrors.price = "Valid price is required";
    }

    if (!formData.estimated_available_date) {
      newErrors.estimated_available_date = "Expected harvest date is required";
    }

    if (!formData.harvest_season) {
      newErrors.harvest_season = "Harvest season is required";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    }

    if (
      !formData.min_order_quantity ||
      isNaN(formData.min_order_quantity) ||
      parseFloat(formData.min_order_quantity) <= 0
    ) {
      newErrors.min_order_quantity = "Valid minimum order quantity is required";
    }

    if (
      !formData.seller_confidence ||
      isNaN(formData.seller_confidence) ||
      parseInt(formData.seller_confidence) < 1 ||
      parseInt(formData.seller_confidence) > 100
    ) {
      newErrors.seller_confidence = "Confidence level must be between 1-100";
    }

    if (formData.advance_payment_required) {
      const percentage = parseInt(formData.advance_payment_percentage);
      if (isNaN(percentage) || percentage < 1 || percentage > 100) {
        newErrors.advance_payment_percentage =
          "Advance payment percentage must be between 1-100";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!session?.user?.id) {
      toastService.error("Please login to add prebooking products");
      return;
    }

    if (!validateForm()) {
      toastService.error("Please fix the errors below");
      return;
    }

    try {
      setLoading(true);

      const vegetableData = {
        name: formData.name.trim(),
        category: formData.category,
        price: parseFloat(formData.price),
        quantity: 0, // Prebooking products start with 0 quantity
        unit: "kg",
        description:
          formData.description.trim() || `Pre-booking for ${formData.name}`,
        location: formData.location.trim(),
        owner_id: session.user.id,
        source_type: "seller",
        product_type: "prebooking",
        estimated_available_date: formData.estimated_available_date,
        harvest_season: formData.harvest_season,
        min_order_quantity: parseFloat(formData.min_order_quantity),
        seller_confidence: parseInt(formData.seller_confidence),
        prebooking_notes: formData.prebooking_notes.trim() || null,
        advance_payment_required: formData.advance_payment_required,
        advance_payment_percentage: formData.advance_payment_required
          ? parseInt(formData.advance_payment_percentage)
          : 0,
      };

      console.log("Creating prebooking product:", vegetableData);

      const result = await VegetableService.createVegetable(vegetableData);

      if (result) {
        toastService.success(
          `Pre-booking product "${formData.name}" created successfully!`,
          { icon: "🌱", duration: 5000 }
        );

        // Reset form
        setFormData({
          name: "",
          category: "",
          price: "",
          estimated_available_date: "",
          harvest_season: "",
          min_order_quantity: "1",
          seller_confidence: "90",
          prebooking_notes: "",
          description: "",
          location: "",
          advance_payment_required: false,
          advance_payment_percentage: "0",
        });

        // Redirect to product management or stay on page
        // router.push("/seller/products");
      }
    } catch (error) {
      console.error("Error creating prebooking product:", error);
      toastService.error(
        "Failed to create prebooking product. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <Container className="py-5">
        <Alert variant="warning" className="text-center">
          <i className="ti-info-circle me-2"></i>
          Please login as a seller to add prebooking products.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="h3 mb-1">🌱 Add Pre-booking Product</h1>
        <p className="text-muted mb-0">
          Create a listing for vegetables you plan to grow based on customer
          demand
        </p>
      </div>

      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                {/* Basic Product Info */}
                <div className="mb-4">
                  <h5 className="mb-3">🥬 Product Information</h5>

                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Product Name *</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g., Organic Winter Tomatoes"
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          isInvalid={!!errors.name}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.name}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Category *</Form.Label>
                        <Form.Select
                          value={formData.category}
                          onChange={(e) =>
                            handleInputChange("category", e.target.value)
                          }
                          isInvalid={!!errors.category}
                        >
                          <option value="">Select category</option>
                          {defaultCategories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {errors.category}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Expected Price (₹/kg) *</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.50"
                          min="0"
                          placeholder="45.00"
                          value={formData.price}
                          onChange={(e) =>
                            handleInputChange("price", e.target.value)
                          }
                          isInvalid={!!errors.price}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.price}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Location *</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g., Pune, Maharashtra"
                          value={formData.location}
                          onChange={(e) =>
                            handleInputChange("location", e.target.value)
                          }
                          isInvalid={!!errors.location}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.location}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col xs={12}>
                      <Form.Group>
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          placeholder="Describe your prebooking product, growing methods, special features..."
                          value={formData.description}
                          onChange={(e) =>
                            handleInputChange("description", e.target.value)
                          }
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                {/* Harvest & Availability */}
                <div className="mb-4">
                  <h5 className="mb-3">📅 Harvest & Availability</h5>

                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Expected Harvest Date *</Form.Label>
                        <Form.Control
                          type="date"
                          min={minDate}
                          max={maxDateStr}
                          value={formData.estimated_available_date}
                          onChange={(e) =>
                            handleInputChange(
                              "estimated_available_date",
                              e.target.value
                            )
                          }
                          isInvalid={!!errors.estimated_available_date}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.estimated_available_date}
                        </Form.Control.Feedback>
                        <Form.Text>
                          When will this product be ready for harvest?
                        </Form.Text>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Harvest Season *</Form.Label>
                        <Form.Select
                          value={formData.harvest_season}
                          onChange={(e) =>
                            handleInputChange("harvest_season", e.target.value)
                          }
                          isInvalid={!!errors.harvest_season}
                        >
                          <option value="">Select season</option>
                          {harvestSeasons.map((season) => (
                            <option key={season} value={season}>
                              {season}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {errors.harvest_season}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                {/* Order Requirements */}
                <div className="mb-4">
                  <h5 className="mb-3">📦 Order Requirements</h5>

                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Minimum Order Quantity (kg) *</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.5"
                          min="0.5"
                          max="100"
                          value={formData.min_order_quantity}
                          onChange={(e) =>
                            handleInputChange(
                              "min_order_quantity",
                              e.target.value
                            )
                          }
                          isInvalid={!!errors.min_order_quantity}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.min_order_quantity}
                        </Form.Control.Feedback>
                        <Form.Text>
                          Minimum quantity customers must order
                        </Form.Text>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Your Confidence Level (%) *</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          max="100"
                          value={formData.seller_confidence}
                          onChange={(e) =>
                            handleInputChange(
                              "seller_confidence",
                              e.target.value
                            )
                          }
                          isInvalid={!!errors.seller_confidence}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.seller_confidence}
                        </Form.Control.Feedback>
                        <Form.Text>
                          How confident are you in delivering this product?
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                {/* Payment & Notes */}
                <div className="mb-4">
                  <h5 className="mb-3">💰 Payment & Special Notes</h5>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="advance_payment"
                      label="Require advance payment"
                      checked={formData.advance_payment_required}
                      onChange={(e) =>
                        handleInputChange(
                          "advance_payment_required",
                          e.target.checked
                        )
                      }
                    />
                  </Form.Group>

                  {formData.advance_payment_required && (
                    <Row className="g-3 mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Advance Payment Percentage *</Form.Label>
                          <Form.Control
                            type="number"
                            min="1"
                            max="100"
                            value={formData.advance_payment_percentage}
                            onChange={(e) =>
                              handleInputChange(
                                "advance_payment_percentage",
                                e.target.value
                              )
                            }
                            isInvalid={!!errors.advance_payment_percentage}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.advance_payment_percentage}
                          </Form.Control.Feedback>
                          <Form.Text>
                            Percentage of total amount required upfront
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                  )}

                  <Form.Group>
                    <Form.Label>Special Notes for Customers</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Any special instructions, growing methods, quality promises, etc."
                      value={formData.prebooking_notes}
                      onChange={(e) =>
                        handleInputChange("prebooking_notes", e.target.value)
                      }
                      maxLength={500}
                    />
                    <Form.Text>
                      {formData.prebooking_notes.length}/500 characters
                    </Form.Text>
                  </Form.Group>
                </div>

                {/* Preview */}
                <div className="mb-4 p-3 bg-light rounded">
                  <h6 className="mb-2">📋 Preview</h6>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{formData.name || "Product Name"}</strong>
                      {formData.category && (
                        <Badge bg="secondary" className="ms-2">
                          {formData.category}
                        </Badge>
                      )}
                      <div className="small text-muted">
                        {formData.location || "Location"} •{" "}
                        {formData.harvest_season || "Season"}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold text-success">
                        ₹{formData.price || "0"}/kg
                      </div>
                      <div className="small text-muted">
                        Min: {formData.min_order_quantity || "1"}kg
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <Button
                    variant="outline-secondary"
                    onClick={() => router.back()}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="success"
                    type="submit"
                    disabled={loading}
                    className="px-4"
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Creating...
                      </>
                    ) : (
                      <>🌱 Create Pre-booking Product</>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
