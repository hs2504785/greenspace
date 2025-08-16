"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Row,
  Col,
  Badge,
  Button,
  Card,
  Form,
} from "react-bootstrap";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useSession } from "next-auth/react";
import { checkCartForSimilarFreeItems } from "@/utils/freeItemValidation";
import UserAvatar from "../common/UserAvatar";
import toastService from "@/utils/toastService";

export default function VegetableDetails({ vegetable }) {
  const router = useRouter();
  const { addToCart, items } = useCart();
  const { data: session } = useSession();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Check if item is free and similar items in cart
  const isFree = Number(vegetable?.price) === 0;
  const similarFreeItemCheck = isFree
    ? checkCartForSimilarFreeItems(items, vegetable?.name || "")
    : { hasConflict: false };
  const hasSimilarFreeItemInCart = similarFreeItemCheck.hasConflict;

  // Use the actual available quantity for both free and paid items
  const maxQuantity = vegetable?.quantity || 1;

  if (!vegetable) {
    router.push("/");
    return null;
  }

  const handleWhatsAppClick = () => {
    const message = `Hi, I'm interested in buying ${vegetable.name}`;
    const whatsappUrl = `https://wa.me/${
      vegetable.owner?.whatsapp
    }?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleAddToCart = async () => {
    try {
      console.log("Adding to cart - Vegetable:", vegetable);
      console.log("Owner details:", vegetable.owner);
      console.log("WhatsApp number:", vegetable.owner?.whatsapp);

      const result = await addToCart(
        {
          ...vegetable,
          availableQuantity: maxQuantity,
        },
        quantity,
        session?.user?.id
      );

      if (!result.success) {
        toastService.error(result.error);
      } else {
        const isFree = Number(vegetable.price) === 0;
        toastService.success(
          `Added ${quantity} ${vegetable.unit || "kg"} of ${
            vegetable.name
          } to cart!`,
          {
            icon: isFree ? "🎁" : "🛒",
          }
        );
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toastService.error("Failed to add item to cart. Please try again.");
    }
  };

  // Rest of the component remains the same
  return (
    <Container className="py-4">
      <style>{`
        .product-gallery .btn:hover {
          transform: scale(1.05);
          transition: transform 0.2s ease;
        }
        .product-gallery .cursor-pointer:hover {
          transform: scale(1.05);
          transition: transform 0.2s ease;
        }
        .product-gallery img {
          transition: opacity 0.3s ease;
        }
        .image-container .nav-arrow {
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .image-container:hover .nav-arrow {
          opacity: 1;
        }
      `}</style>
      <Row className="g-4">
        <Col lg={6}>
          {/* Product Image Gallery */}
          <div className="product-gallery">
            {/* Main Image Display */}
            <div
              className="position-relative rounded-4 overflow-hidden shadow-sm mb-3 image-container"
              style={{ height: "450px", backgroundColor: "#f8f9fa" }}
            >
              {vegetable.images &&
              vegetable.images.length > 0 &&
              vegetable.images[selectedImageIndex] ? (
                <Image
                  src={vegetable.images[selectedImageIndex]}
                  alt={`${vegetable.name} - Image ${selectedImageIndex + 1}`}
                  fill
                  style={{ objectFit: "cover" }}
                  className="rounded-4"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority={selectedImageIndex === 0}
                />
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100 bg-light rounded-4">
                  <div className="text-center text-muted">
                    <i className="ti-image display-1"></i>
                    <p className="mt-2">No image available</p>
                  </div>
                </div>
              )}

              {/* Image Counter Badge */}
              {vegetable.images && vegetable.images.length > 1 && (
                <div
                  className="position-absolute top-0 end-0 m-3 px-2 py-1 rounded-pill text-white"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    fontSize: "0.85rem",
                  }}
                >
                  {selectedImageIndex + 1} / {vegetable.images.length}
                </div>
              )}

              {/* Navigation Arrows */}
              {vegetable.images && vegetable.images.length > 1 && (
                <>
                  <button
                    className="btn btn-link position-absolute top-50 start-0 translate-middle-y ms-2 text-white p-2 nav-arrow"
                    onClick={() =>
                      setSelectedImageIndex((prev) =>
                        prev > 0 ? prev - 1 : vegetable.images.length - 1
                      )
                    }
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                      borderRadius: "50%",
                      width: "40px",
                      height: "40px",
                      textDecoration: "none",
                    }}
                  >
                    <i className="ti-arrow-left"></i>
                  </button>
                  <button
                    className="btn btn-link position-absolute top-50 end-0 translate-middle-y me-2 text-white p-2 nav-arrow"
                    onClick={() =>
                      setSelectedImageIndex((prev) =>
                        prev < vegetable.images.length - 1 ? prev + 1 : 0
                      )
                    }
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                      borderRadius: "50%",
                      width: "40px",
                      height: "40px",
                      textDecoration: "none",
                    }}
                  >
                    <i className="ti-arrow-right"></i>
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Navigation */}
            {vegetable.images && vegetable.images.length > 1 && (
              <div className="d-flex gap-2 flex-wrap justify-content-center">
                {vegetable.images.map((image, index) => (
                  <div
                    key={index}
                    className={`position-relative rounded-2 overflow-hidden cursor-pointer ${
                      selectedImageIndex === index ? "ring-2 ring-success" : ""
                    }`}
                    style={{
                      width: "70px",
                      height: "70px",
                      border:
                        selectedImageIndex === index
                          ? "2px solid #28a745"
                          : "2px solid transparent",
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <Image
                      src={image}
                      alt={`${vegetable.name} thumbnail ${index + 1}`}
                      fill
                      style={{ objectFit: "cover" }}
                      className="rounded-2"
                      sizes="70px"
                    />
                    {/* Overlay for non-selected images */}
                    {selectedImageIndex !== index && (
                      <div
                        className="position-absolute top-0 start-0 w-100 h-100 rounded-2"
                        style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
                      ></div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Image Dots Indicator */}
            {vegetable.images &&
              vegetable.images.length > 1 &&
              vegetable.images.length <= 5 && (
                <div className="d-flex justify-content-center mt-3 gap-2">
                  {vegetable.images.map((_, index) => (
                    <button
                      key={index}
                      className="btn p-0 border-0"
                      onClick={() => setSelectedImageIndex(index)}
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor:
                          selectedImageIndex === index ? "#28a745" : "#dee2e6",
                        transition: "all 0.2s ease",
                      }}
                    ></button>
                  ))}
                </div>
              )}
          </div>
        </Col>

        <Col lg={6}>
          <div className="sticky-lg-top">
            {/* Title and Price */}
            <div className="d-flex justify-content-between align-items-start mb-3">
              <h1 className="mb-0 fw-bold">{vegetable.name}</h1>
              <Badge bg="success" className="fs-5 px-3 py-2">
                ₹{vegetable.price}/kg
              </Badge>
            </div>

            {/* Description */}
            <p className="text-muted lead mb-4">{vegetable.description}</p>

            {/* Quick Info Cards */}
            <Row className="g-3 mb-4">
              <Col sm={6}>
                <Card className="border-0 bg-light h-100">
                  <Card.Body className="d-flex align-items-center">
                    <i className="ti-location-pin fs-4 me-3 text-success"></i>
                    <div>
                      <div className="text-muted small">Location</div>
                      <div className="fw-semibold">{vegetable.location}</div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col sm={6}>
                <Card className="border-0 bg-light h-100">
                  <Card.Body className="d-flex align-items-center">
                    <i className="ti-package fs-4 me-3 text-success"></i>
                    <div>
                      <div className="text-muted small">Available Quantity</div>
                      <div className="fw-semibold">{vegetable.quantity} kg</div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col sm={6}>
                <Card className="border-0 bg-light h-100">
                  <Card.Body className="d-flex align-items-center">
                    <i className="ti-tag fs-4 me-3 text-success"></i>
                    <div>
                      <div className="text-muted small">Category</div>
                      <div className="fw-semibold text-capitalize">
                        {vegetable.category}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col sm={6}>
                <Card className="border-0 bg-light h-100">
                  <Card.Body className="d-flex align-items-center">
                    <i className="ti-home fs-4 me-3 text-success"></i>
                    <div>
                      <div className="text-muted small">Source</div>
                      <div className="fw-semibold">
                        {vegetable.sourceType === "farm"
                          ? "Farm"
                          : "Home Garden"}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Seller Information */}
            <Card className="border-0 bg-light mb-4">
              <Card.Body>
                <h5 className="mb-4">Seller Information</h5>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <UserAvatar user={vegetable.owner} size={48} />
                    </div>
                    <div>
                      <div className="fw-semibold">
                        {vegetable.owner?.name || "Anonymous Seller"}
                      </div>
                      <div className="text-muted small">
                        <i className="ti-check-box text-success me-1"></i>
                        Verified Seller
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="success"
                    size="lg"
                    onClick={handleWhatsAppClick}
                    className="px-4"
                  >
                    <i className="ti-comment me-2"></i>
                    Contact Seller
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {/* Add to Cart Section */}
            <Card className="border-0 bg-light mb-4">
              <Card.Body>
                <div className="d-flex align-items-center mb-3">
                  <Form.Control
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const newQuantity = Math.max(
                        1,
                        parseInt(e.target.value) || 1
                      );
                      setQuantity(Math.min(newQuantity, maxQuantity));
                    }}
                    min="1"
                    max={maxQuantity}
                    style={{ width: "100px" }}
                    className="me-3"
                    title={undefined}
                  />
                  <div className="text-muted">{vegetable.unit || "kg"}</div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="text-muted">Subtotal</div>
                  <div className="fs-4 fw-bold">
                    ₹{vegetable.price * quantity}
                  </div>
                </div>
                <div className="d-grid">
                  <Button
                    variant={hasSimilarFreeItemInCart ? "secondary" : "success"}
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={hasSimilarFreeItemInCart}
                    title={
                      hasSimilarFreeItemInCart
                        ? `You already have a similar free item (${similarFreeItemCheck.conflictingItem?.name}) in your cart`
                        : undefined
                    }
                  >
                    <i
                      className={
                        hasSimilarFreeItemInCart
                          ? "ti-ban me-2"
                          : "ti-shopping-cart me-2"
                      }
                    ></i>
                    {hasSimilarFreeItemInCart
                      ? "Similar Item Already in Cart"
                      : isFree
                      ? "🎁 Claim Free Item"
                      : "Add to Cart"}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
