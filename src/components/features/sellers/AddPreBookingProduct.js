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
import LocationAutoDetect from "@/components/common/LocationAutoDetect";

const defaultCategories = ["Leafy", "Root", "Fruit", "Herbs", "Vegetable"];
const harvestSeasons = ["Spring", "Summer", "Monsoon", "Winter", "Year-round"];

const UNIT_TYPES = [
  {
    value: "kg",
    label: "Kilogram (kg)",
    priceLabel: "₹/kg",
    quantityLabel: "kg",
  },
  {
    value: "pieces",
    label: "Pieces",
    priceLabel: "₹/piece",
    quantityLabel: "pieces",
  },
  {
    value: "bundle",
    label: "Bundle",
    priceLabel: "₹/bundle",
    quantityLabel: "bundle",
  },
  {
    value: "grams",
    label: "Grams",
    priceLabel: "₹/100g",
    quantityLabel: "grams",
  },
];

export default function AddPreBookingProduct() {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    estimated_available_date: "",
    harvest_season: "",
    min_order_quantity: "1",
    unit: "kg",
    seller_confidence: "90",
    prebooking_notes: "",
    description: "",
    location: "",
    advance_payment_required: false,
    advance_payment_percentage: "0",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [dragOver, setDragOver] = useState(false);
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

  // Helper function to get current unit type information
  const getCurrentUnitType = () => {
    return (
      UNIT_TYPES.find((unit) => unit.value === formData.unit) || UNIT_TYPES[0]
    );
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Image handling functions
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    handleNewImages(files);
  };

  const handleNewImages = (files) => {
    // Limit to 5 images total
    const remainingSlots = 5 - imagePreviews.length;
    const filesToAdd = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      toastService.warning(
        `Only ${remainingSlots} more images can be added. Maximum 5 images allowed.`
      );
    }

    // Create preview URLs and add files
    filesToAdd.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviews((prev) => [...prev, e.target.result]);
        };
        reader.readAsDataURL(file);
        setImageFiles((prev) => [...prev, file]);
      }
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleNewImages(files);
  };

  const removeImage = (index) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const makePrimary = (targetIndex) => {
    if (targetIndex === 0) return; // Already primary

    setImagePreviews((prev) => {
      const newPreviews = [...prev];
      const [selectedImage] = newPreviews.splice(targetIndex, 1);
      newPreviews.unshift(selectedImage); // Move to first position
      return newPreviews;
    });

    setImageFiles((prev) => {
      const newFiles = [...prev];
      if (targetIndex < newFiles.length) {
        const [selectedFile] = newFiles.splice(targetIndex, 1);
        newFiles.unshift(selectedFile); // Move to first position
      }
      return newFiles;
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
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

      // Upload images first if any
      let imageUrls = [];
      if (imageFiles.length > 0) {
        console.log("🔄 Uploading images...");
        const uploadPromises = imageFiles.map((file) =>
          VegetableService.uploadImage(file)
        );
        const uploadResults = await Promise.all(uploadPromises);

        // Extract ALL variant URLs for each image
        imageUrls = uploadResults.flatMap((result) => {
          if (typeof result === "string") {
            return [result]; // Old format - single URL
          } else if (result.variants) {
            // New format - return all three variants
            return [
              result.variants.thumbnail,
              result.variants.medium,
              result.variants.large,
            ];
          } else {
            return [result.url]; // Fallback
          }
        });

        console.log("✅ Image upload results:", imageUrls);
      }

      const vegetableData = {
        name: formData.name.trim(),
        category: formData.category,
        price: 0, // Prebooking products don't have fixed prices
        quantity: 0, // Prebooking products start with 0 quantity
        unit: formData.unit,
        description:
          formData.description.trim() || `Pre-booking for ${formData.name}`,
        location: formData.location.trim(),
        owner_id: session.user.id,
        source_type: "seller",
        product_type: "prebooking",
        images: imageUrls,
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
          estimated_available_date: "",
          harvest_season: "",
          min_order_quantity: "1",
          unit: "kg",
          seller_confidence: "90",
          prebooking_notes: "",
          description: "",
          location: "",
          advance_payment_required: false,
          advance_payment_percentage: "0",
        });

        // Reset image state
        setImageFiles([]);
        setImagePreviews([]);
        setDragOver(false);

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

                    <Col xs={12}>
                      <LocationAutoDetect
                        name="location"
                        value={formData.location}
                        onChange={(e) =>
                          handleInputChange("location", e.target.value)
                        }
                        placeholder="Type your location or click 'Detect' to auto-fill"
                        required
                        label="Location"
                        showRequiredIndicator
                        isInvalid={!!errors.location}
                        errorMessage={errors.location}
                      />
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

                    <Col xs={12}>
                      <Form.Group>
                        <Form.Label>
                          Product Images{" "}
                          <span className="text-muted">(Maximum 5 images)</span>
                        </Form.Label>

                        {/* Image Upload Area */}
                        <div
                          className={`border-2 border-dashed rounded-3 p-4 text-center position-relative ${
                            dragOver
                              ? "border-success bg-success bg-opacity-10"
                              : "border-secondary"
                          } ${
                            imagePreviews.length >= 5
                              ? "bg-light text-muted"
                              : "bg-light"
                          }`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          style={{
                            minHeight: "120px",
                            cursor:
                              imagePreviews.length >= 5
                                ? "not-allowed"
                                : "pointer",
                            transition: "all 0.2s ease",
                          }}
                          onClick={() => {
                            if (imagePreviews.length < 5) {
                              document.getElementById("imageInput").click();
                            }
                          }}
                        >
                          <input
                            id="imageInput"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            style={{ display: "none" }}
                            disabled={imagePreviews.length >= 5}
                          />

                          <div className="d-flex flex-column align-items-center justify-content-center h-100">
                            <i
                              className={`ti-cloud-up mb-2 ${
                                imagePreviews.length >= 5
                                  ? "text-muted"
                                  : "text-success"
                              }`}
                              style={{ fontSize: "2.5rem" }}
                            ></i>
                            {imagePreviews.length >= 5 ? (
                              <p className="mb-1 text-muted">
                                Maximum 5 images reached
                              </p>
                            ) : (
                              <>
                                <p className="mb-1 fw-semibold">
                                  Drag & drop images here or click to browse
                                </p>
                                <p className="mb-0 small text-muted">
                                  Support JPG, PNG, GIF up to 5MB each •{" "}
                                  {5 - imagePreviews.length} slots remaining
                                </p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Image Previews Grid */}
                        {imagePreviews.length > 0 && (
                          <div className="mt-3">
                            <div className="row g-3">
                              {imagePreviews.map((preview, index) => (
                                <div
                                  key={index}
                                  className="col-6 col-md-4 col-lg-3"
                                >
                                  <div className="position-relative bg-light rounded-3 p-2 h-100 image-preview-card">
                                    <div className="position-relative">
                                      <img
                                        src={preview}
                                        alt={`Preview ${index + 1}`}
                                        className="w-100 rounded-2"
                                        style={{
                                          height: "120px",
                                          objectFit: "cover",
                                        }}
                                      />

                                      {/* Primary Badge */}
                                      {index === 0 && (
                                        <span
                                          className="position-absolute top-0 start-0 badge bg-success m-1"
                                          style={{ fontSize: "0.7rem" }}
                                        >
                                          <i className="ti-star me-1"></i>
                                          Primary
                                        </span>
                                      )}

                                      {/* Make Primary Button (shows on hover, only for non-primary images) */}
                                      {index !== 0 && (
                                        <button
                                          type="button"
                                          className="btn btn-success btn-sm position-absolute bottom-0 start-0 end-0 m-2"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            makePrimary(index);
                                          }}
                                          style={{
                                            fontSize: "12px",
                                            padding: "6px 12px",
                                            backgroundColor:
                                              "rgba(40, 167, 69, 0.9)",
                                            borderColor:
                                              "rgba(40, 167, 69, 0.9)",
                                            color: "white",
                                            backdropFilter: "blur(4px)",
                                            fontWeight: "500",
                                          }}
                                          onMouseEnter={(e) => {
                                            e.target.style.opacity = "1";
                                          }}
                                          onMouseLeave={(e) => {
                                            e.target.style.opacity = "0.8";
                                          }}
                                        >
                                          <i className="ti-star me-1"></i>Make
                                          Primary
                                        </button>
                                      )}

                                      {/* Remove Button */}
                                      <button
                                        type="button"
                                        className="position-absolute top-0 end-0 m-2 d-flex align-items-center justify-content-center"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeImage(index);
                                        }}
                                        style={{
                                          width: "28px",
                                          height: "28px",
                                          fontSize: "16px",
                                          color: "#dc3545",
                                          backgroundColor:
                                            "rgba(255, 255, 255, 0.9)",
                                          borderRadius: "50%",
                                          border: "none",
                                          textDecoration: "none",
                                        }}
                                      >
                                        <i className="ti-close"></i>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>
                          Order Quantity ({getCurrentUnitType().quantityLabel})
                          *
                        </Form.Label>
                        <Form.Control
                          type="number"
                          step="0.5"
                          min="0.5"
                          max="100"
                          placeholder={`Enter quantity in ${
                            getCurrentUnitType().quantityLabel
                          }`}
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

                    <Col md={2}>
                      <Form.Group>
                        <Form.Label>Unit</Form.Label>
                        <Form.Select
                          value={formData.unit}
                          onChange={(e) =>
                            handleInputChange("unit", e.target.value)
                          }
                        >
                          {UNIT_TYPES.map((unit) => (
                            <option key={unit.value} value={unit.value}>
                              {unit.label}
                            </option>
                          ))}
                        </Form.Select>
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
