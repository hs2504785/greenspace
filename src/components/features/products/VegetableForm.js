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
    value: "bundles",
    label: "Bundles",
    priceLabel: "₹/bundle",
    quantityLabel: "bundles",
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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    vegetable?.images?.[0] || ""
  );
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
      setImagePreview(vegetable.images?.[0] || "");
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
      setImagePreview("");
      setImageFile(null);
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
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
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

      console.log("📸 Image file:", imageFile?.name);
      let imageUrl = "";
      if (imageFile) {
        console.log("🔄 Uploading image...");
        imageUrl = await vegetableService.uploadImage(imageFile);
        console.log("✅ Image upload result:", imageUrl);
      } else {
        console.log("ℹ️ No image to upload");
      }

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
        images: imageUrl ? [imageUrl] : formData.images,
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
            <Form.Label>Product Image</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    maxWidth: "200px",
                    maxHeight: "200px",
                    objectFit: "cover",
                  }}
                  className="border rounded"
                />
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
