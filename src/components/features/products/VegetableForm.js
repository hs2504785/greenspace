"use client";

import { useState, useEffect } from "react";
import { Modal, Form, Button, Row, Col } from "react-bootstrap";
import { useSession } from "next-auth/react";
import toastService from "@/utils/toastService";
import vegetableService from "@/services/VegetableService";

const CATEGORIES = ["leafy", "root", "fruit", "exotic", "seasonal", "organic"];
const SOURCE_TYPES = ["farm", "home garden"];
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

export default function VegetableForm({
  show,
  onHide,
  onSuccess,
  vegetable = null,
}) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState(vegetable?.images || []);
  const [dragOver, setDragOver] = useState(false);
  const [formData, setFormData] = useState(
    vegetable || {
      name: "",
      description: "",
      price: "",
      quantity: "",
      category: "leafy",
      source_type: "farm",
      unit: "kg",
      location: "",
      images: [],
    }
  );

  useEffect(() => {
    if (vegetable) {
      setFormData(vegetable);
      setImagePreviews(vegetable.images || []);
      setImageFiles([]);
    } else {
      setFormData({
        name: "",
        description: "",
        price: "",
        quantity: "",
        category: "leafy",
        source_type: "farm",
        unit: "kg",
        location: "",
        images: [],
      });
      setImagePreviews([]);
      setImageFiles([]);
    }
  }, [vegetable]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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

    // Validate file types and sizes
    const validFiles = filesToAdd.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toastService.error(`${file.name} is not a valid image file.`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toastService.error(`${file.name} is too large. Maximum size is 5MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Add new image files
    setImageFiles((prev) => [...prev, ...validFiles]);

    // Create previews for new images
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
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

  // Helper function to get current unit type information
  const getCurrentUnitType = () => {
    return (
      UNIT_TYPES.find((unit) => unit.value === formData.unit) || UNIT_TYPES[0]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Additional client-side validation
      if (!formData.name || formData.name.trim() === "") {
        throw new Error("Product name is required.");
      }
      if (!formData.location || formData.location.trim() === "") {
        throw new Error("Location is required. Please enter a location.");
      }
      if (!formData.price || formData.price === "") {
        throw new Error("Price is required. Enter 0 for free items.");
      }
      if (!formData.quantity || formData.quantity === "") {
        throw new Error("Quantity is required.");
      }

      // Debug session information
      console.log("🔍 Session state:", {
        isAuthenticated: !!session,
        user: session?.user,
        email: session?.user?.email,
        userId: session?.user?.id,
        fullSession: session,
      });

      console.log(
        "📸 Image files:",
        imageFiles.map((f) => f?.name)
      );
      let imageUrls = [];

      // Upload new image files
      if (imageFiles.length > 0) {
        console.log("🔄 Uploading images...");
        const uploadPromises = imageFiles.map((file) =>
          vegetableService.uploadImage(file)
        );
        imageUrls = await Promise.all(uploadPromises);
        console.log("✅ Image upload results:", imageUrls);
      } else {
        console.log("ℹ️ No new images to upload");
      }

      // Combine existing images (that weren't files) with new uploaded images
      const existingImageUrls = imagePreviews.filter(
        (preview) =>
          typeof preview === "string" &&
          (preview.startsWith("http") || preview.startsWith("https"))
      );
      const finalImageUrls = [...existingImageUrls, ...imageUrls];

      const ownerId = session?.user?.id;
      console.log("👤 Owner ID:", ownerId);

      if (!ownerId) {
        console.error("❌ No user ID in session:", session);
        throw new Error("User ID not found in session. Please log in again.");
      }

      // Debug data being sent
      const vegetableData = {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        owner_id: ownerId,
        images: finalImageUrls.length > 0 ? finalImageUrls : formData.images,
      };

      console.log("Session user:", {
        id: session?.user?.id,
        email: session?.user?.email,
      });
      console.log("Submitting vegetable with owner_id:", ownerId);

      console.log("Submitting vegetable data:", vegetableData);

      console.log("💾 Saving product to database...");

      if (vegetable?.id) {
        console.log("🔄 Updating existing vegetable:", vegetable.id);
        try {
          const updated = await vegetableService.updateVegetable(
            vegetable.id,
            vegetableData
          );
          console.log("✅ Update response:", updated);
          toastService.presets.saveSuccess();
        } catch (updateError) {
          console.error("❌ Update failed:", updateError);
          throw updateError;
        }
      } else {
        console.log("🔄 Creating new vegetable...");
        try {
          const created = await vegetableService.createVegetable(vegetableData);
          console.log("✅ Create response:", created);
          toastService.presets.saveSuccess();
        } catch (createError) {
          console.error("❌ Create failed:", createError);
          throw createError;
        }
      }

      // Add a small delay before refreshing the list
      setTimeout(() => {
        onSuccess();
        onHide();
      }, 500);
    } catch (error) {
      console.error("💥 Error saving product:", {
        message: error?.message || "No error message",
        error: error,
        errorString: String(error),
        errorStack: error?.stack,
        formData: formData,
        session: session?.user,
        errorName: error?.name,
        errorCode: error?.code,
      });

      const errorMessage =
        error?.message ||
        error?.toString() ||
        "Failed to save product. Please try again.";
      toastService.presets.saveError();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <style>{`
        .image-preview-card:hover .make-primary-btn {
          opacity: 1 !important;
          pointer-events: auto !important;
        }
      `}</style>
      <Modal.Header closeButton>
        <Modal.Title>
          {vegetable ? "Edit Product" : "Add New Product"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Product Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter product name (e.g., Marigold Sapling, Tomatoes)"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              placeholder="Enter product description"
            />
          </Form.Group>

          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Price ({getCurrentUnitType().priceLabel}){" "}
                  <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder={`Enter price per ${getCurrentUnitType().quantityLabel.slice(
                    0,
                    -1
                  )}`}
                />
                <Form.Text className="text-muted">
                  Enter 0 for free items
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Quantity ({getCurrentUnitType().quantityLabel}){" "}
                  <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                  min="0"
                  placeholder={`Enter quantity in ${
                    getCurrentUnitType().quantityLabel
                  }`}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Unit</Form.Label>
                <Form.Select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  required
                >
                  {UNIT_TYPES.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Source Type</Form.Label>
                <Form.Select
                  name="source_type"
                  value={formData.source_type}
                  onChange={handleInputChange}
                  required
                >
                  {SOURCE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type
                        .split(" ")
                        .map(
                          (word) => word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(" ")}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>
              Location <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              placeholder="Enter your location (e.g., Bangalore, Sector 15, or Village Name)"
            />
            <Form.Text className="text-muted">
              Specify where the product is available for pickup/delivery
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
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
                imagePreviews.length >= 5 ? "bg-light text-muted" : "bg-light"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                minHeight: "120px",
                cursor: imagePreviews.length >= 5 ? "not-allowed" : "pointer",
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
                    imagePreviews.length >= 5 ? "text-muted" : "text-success"
                  }`}
                  style={{ fontSize: "2.5rem" }}
                ></i>
                {imagePreviews.length >= 5 ? (
                  <p className="mb-1 text-muted">Maximum 5 images reached</p>
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
                    <div key={index} className="col-6 col-md-4 col-lg-3">
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
                              <i className="ti-star me-1"></i>Primary
                            </span>
                          )}

                          {/* Make Primary Button (shows on hover, only for non-primary images) */}
                          {index !== 0 && (
                            <button
                              type="button"
                              className="btn btn-success btn-sm position-absolute bottom-0 start-0 end-0 m-2 make-primary-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                makePrimary(index);
                              }}
                              style={{
                                fontSize: "12px",
                                padding: "6px 12px",
                                opacity: 0,
                                transition: "opacity 0.2s ease",
                                pointerEvents: "none",
                                backgroundColor: "rgba(40, 167, 69, 0.9)",
                                borderColor: "rgba(40, 167, 69, 0.9)",
                                color: "white",
                                backdropFilter: "blur(4px)",
                                fontWeight: "500",
                              }}
                            >
                              <i className="ti-star me-1"></i>Make Primary
                            </button>
                          )}

                          {/* Remove Button */}
                          <button
                            type="button"
                            className="btn btn-link position-absolute top-0 end-0 m-1 p-1 lh-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index);
                            }}
                            style={{
                              width: "28px",
                              height: "28px",
                              fontSize: "16px",
                              color: "#dc3545",
                              backgroundColor: "rgba(255, 255, 255, 0.9)",
                              borderRadius: "50%",
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
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="success" onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <div
                className="spinner-border spinner-border-sm me-2"
                role="status"
              >
                <span className="visually-hidden">Loading...</span>
              </div>
              Saving...
            </>
          ) : (
            <>
              <i
                className={`ti ${vegetable ? "ti-refresh" : "ti-plus"} me-2`}
              ></i>
              {vegetable ? "Update Product" : "Add Product"}
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
