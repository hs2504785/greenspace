"use client";

import { useState, useEffect } from "react";
import { Modal, Form, Button, Row, Col } from "react-bootstrap";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import vegetableService from "@/services/VegetableService";

const CATEGORIES = ["leafy", "root", "fruit", "exotic", "seasonal", "organic"];
const SOURCE_TYPES = ["farm", "home garden"];

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Debug session information
      console.log("Session state:", {
        isAuthenticated: !!session,
        user: session?.user,
        email: session?.user?.email,
      });

      let imageUrl = "";
      if (imageFile) {
        imageUrl = await vegetableService.uploadImage(imageFile);
      }

      const ownerId = session?.user?.id;
      if (!ownerId) {
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

      if (vegetable?.id) {
        const updated = await vegetableService.updateVegetable(
          vegetable.id,
          vegetableData
        );
        console.log("Update response:", updated);
        toast.success("Product updated successfully!");
      } else {
        const created = await vegetableService.createVegetable(vegetableData);
        console.log("Create response:", created);
        toast.success("Product added successfully!");
      }

      // Add a small delay before refreshing the list
      setTimeout(() => {
        onSuccess();
        onHide();
      }, 500);
    } catch (error) {
      console.error("Error saving product:", {
        message: error.message,
        error: error,
        formData: formData,
        session: session?.user,
      });
      toast.error(error.message || "Failed to save product. Please try again.");
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
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter product name"
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
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Price (₹/kg)</Form.Label>
                <Form.Control
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="Enter price per kg"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Quantity (kg)</Form.Label>
                <Form.Control
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                  min="0"
                  placeholder="Enter quantity in kg"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
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
            <Form.Label>Location</Form.Label>
            <Form.Control
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              placeholder="Enter location"
            />
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
          {loading ? "Saving..." : vegetable ? "Update Product" : "Add Product"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
