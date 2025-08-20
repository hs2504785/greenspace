"use client";

import { useState, useEffect } from "react";
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

// Helper function removed - using direct logic below for better debugging

export default function VegetableDetails({ vegetable }) {
  const router = useRouter();
  const { addToCart, items } = useCart();
  const { data: session } = useSession();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Helper function to group image variants into logical images
  const groupImageVariants = (images) => {
    if (!images || images.length === 0) return [];

    // Group images by their base filename
    const grouped = {};

    for (const imageUrl of images) {
      if (typeof imageUrl !== "string") continue;

      // Extract base filename (before _variant.webp)
      const match = imageUrl.match(/(.+?)_(?:thumbnail|medium|large)\.webp$/);
      if (match) {
        const baseName = match[1];

        if (!grouped[baseName]) {
          grouped[baseName] = {
            thumbnail: null,
            medium: null,
            large: null,
          };
        }

        if (imageUrl.includes("_thumbnail.webp")) {
          grouped[baseName].thumbnail = imageUrl;
        } else if (imageUrl.includes("_medium.webp")) {
          grouped[baseName].medium = imageUrl;
        } else if (imageUrl.includes("_large.webp")) {
          grouped[baseName].large = imageUrl;
        }
      } else {
        // Non-optimized image (original format)
        const uniqueKey = imageUrl;
        grouped[uniqueKey] = {
          thumbnail: null,
          medium: imageUrl, // Use as medium
          large: null,
        };
      }
    }

    // Convert to array of representative images (use medium as the main image)
    const result = Object.values(grouped)
      .map(
        (variants) => variants.medium || variants.large || variants.thumbnail
      )
      .filter(Boolean);

    return result;
  };

  // Get unique logical images
  const uniqueImages = groupImageVariants(vegetable.images);

  // Debug: Log the image arrays
  console.log("🔍 DEBUG - Original images:", vegetable.images);
  console.log("🔍 DEBUG - Unique images:", uniqueImages);
  console.log("🔍 DEBUG - Selected index:", selectedImageIndex);

  // Helper function to check if a string is a valid URL
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Helper function to render location with link if it's a URL
  const renderLocation = (location) => {
    if (isValidUrl(location)) {
      return (
        <a
          href={location}
          target="_blank"
          rel="noopener noreferrer"
          className="fw-semibold text-decoration-none text-primary"
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "block",
            maxWidth: "100%",
          }}
          title={location}
        >
          {location}
        </a>
      );
    } else {
      return (
        <div
          className="fw-semibold"
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "100%",
          }}
          title={location}
        >
          {location}
        </div>
      );
    }
  };

  // Check if item is free and similar items in cart
  const isFree = Number(vegetable?.price) === 0;
  const similarFreeItemCheck = isFree
    ? checkCartForSimilarFreeItems(items, vegetable?.name || "")
    : { hasConflict: false };
  const hasSimilarFreeItemInCart = similarFreeItemCheck.hasConflict;

  // Check if item is out of stock
  const isOutOfStock = !vegetable?.quantity || vegetable.quantity <= 0;

  // Use the actual available quantity for both free and paid items
  const maxQuantity = vegetable?.quantity || 1;

  // Check current quantity in cart
  const cartItem = items.find((item) => item.id === vegetable.id);
  const currentCartQuantity = cartItem?.quantity || 0;

  // Check if adding the selected quantity would exceed availability
  const wouldExceedStock = currentCartQuantity + quantity > maxQuantity;

  // Remaining quantity that can be added to cart
  const remainingQuantity = Math.max(0, maxQuantity - currentCartQuantity);

  // Adjust quantity when remaining quantity changes (e.g., when items added to cart)
  useEffect(() => {
    if (quantity > remainingQuantity && remainingQuantity > 0) {
      setQuantity(remainingQuantity);
    } else if (remainingQuantity <= 0 && quantity > 1) {
      setQuantity(1);
    }
  }, [remainingQuantity, quantity]);

  if (!vegetable) {
    router.push("/");
    return null;
  }

  const handleWhatsAppClick = () => {
    const whatsappNumber = vegetable.owner?.whatsapp_number;

    if (!whatsappNumber) {
      toastService.error("WhatsApp number not available for this seller.");
      return;
    }

    // Clean the WhatsApp number (remove spaces, dashes, etc.)
    const cleanedNumber = whatsappNumber.replace(/[^\d+]/g, "");

    const message = `Hi, I'm interested in buying ${vegetable.name}`;
    const whatsappUrl = `https://wa.me/${cleanedNumber}?text=${encodeURIComponent(
      message
    )}`;

    console.log("Opening WhatsApp URL:", whatsappUrl);
    window.open(whatsappUrl, "_blank");
  };

  const handleAddToCart = async () => {
    try {
      // Validate stock before adding to cart
      if (isOutOfStock) {
        toastService.error("This item is currently out of stock.");
        return;
      }

      if (wouldExceedStock) {
        toastService.error(
          `Cannot add ${quantity} ${
            vegetable.unit || "kg"
          }. Only ${remainingQuantity} ${vegetable.unit || "kg"} available${
            currentCartQuantity > 0
              ? ` (${currentCartQuantity} already in cart)`
              : ""
          }.`
        );
        return;
      }

      console.log("Adding to cart - Vegetable:", vegetable);
      console.log("Owner details:", vegetable.owner);
      console.log("WhatsApp number:", vegetable.owner?.whatsapp_number);

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
        
        /* Modern styling for the product details */
        .price-badge {
          box-shadow: 0 2px 8px rgba(111, 66, 193, 0.2) !important;
          transition: transform 0.2s ease;
        }
        .price-badge:hover {
          transform: translateY(-1px);
        }
        
        .contact-seller-btn {
          transition: all 0.2s ease;
          border-width: 2px !important;
        }
        .contact-seller-btn:hover {
          background-color: #17a2b8 !important;
          color: white !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(23, 162, 184, 0.3);
        }
        
        .seller-info-card {
          border-radius: 12px !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06) !important;
          transition: transform 0.2s ease;
        }
        .seller-info-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
        }
        
        /* Responsive price badge */
        @media (max-width: 576px) {
          .price-badge {
            font-size: 1rem !important;
            padding: 0.5rem 1rem !important;
          }
        }
        
        /* Info cards styling */
        .info-card {
          border-radius: 10px !important;
          transition: all 0.2s ease;
          box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05) !important;
        }
        .info-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
        }
        
        /* Better responsive layout for small screens */
        @media (max-width: 576px) {
          /* Stack info cards on mobile */
          .info-card .d-flex {
            flex-direction: column;
            text-align: center;
          }
          .info-card .d-flex i {
            margin: 0 0 0.5rem 0 !important;
          }
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
              {uniqueImages &&
              uniqueImages.length > 0 &&
              uniqueImages[selectedImageIndex] ? (
                <Image
                  src={(() => {
                    const currentImageUrl = uniqueImages[selectedImageIndex];

                    if (!currentImageUrl) return "";

                    // Find the large variant for the current selected image
                    const baseMatch = currentImageUrl.match(
                      /(.+?)_(?:thumbnail|medium|large)\.webp$/
                    );
                    if (baseMatch) {
                      const baseName = baseMatch[1];
                      const largeVariant = vegetable.images.find(
                        (img) => img && img.includes(`${baseName}_large.webp`)
                      );

                      if (largeVariant) {
                        return largeVariant;
                      }
                    }

                    // Smart URL construction fallback
                    if (currentImageUrl.includes("_medium.webp")) {
                      return currentImageUrl.replace(
                        "_medium.webp",
                        "_large.webp"
                      );
                    }
                    if (currentImageUrl.includes("_thumbnail.webp")) {
                      return currentImageUrl.replace(
                        "_thumbnail.webp",
                        "_large.webp"
                      );
                    }

                    // Use current image as fallback
                    return currentImageUrl;
                  })()}
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
              {uniqueImages && uniqueImages.length > 1 && (
                <div
                  className="position-absolute top-0 end-0 m-3 px-2 py-1 rounded-pill text-white"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    fontSize: "0.85rem",
                  }}
                >
                  {selectedImageIndex + 1} / {uniqueImages.length}
                </div>
              )}

              {/* Navigation Arrows */}
              {uniqueImages && uniqueImages.length > 1 && (
                <>
                  <button
                    className="btn btn-link position-absolute top-50 start-0 translate-middle-y ms-2 text-white p-2 nav-arrow"
                    onClick={() => {
                      const newIndex =
                        selectedImageIndex > 0
                          ? selectedImageIndex - 1
                          : uniqueImages.length - 1;
                      console.log(
                        `⬅️ Previous arrow clicked: ${selectedImageIndex} → ${newIndex}`
                      );
                      setSelectedImageIndex(newIndex);
                    }}
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
                    onClick={() => {
                      const newIndex =
                        selectedImageIndex < uniqueImages.length - 1
                          ? selectedImageIndex + 1
                          : 0;
                      console.log(
                        `➡️ Next arrow clicked: ${selectedImageIndex} → ${newIndex}`
                      );
                      setSelectedImageIndex(newIndex);
                    }}
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
            {uniqueImages && uniqueImages.length > 1 && (
              <div className="d-flex gap-2 flex-wrap justify-content-center">
                {uniqueImages.map((image, index) => (
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
                    onClick={() => {
                      console.log(`🖱️ Thumbnail clicked: index ${index}`);
                      setSelectedImageIndex(index);
                    }}
                  >
                    <Image
                      src={(() => {
                        // Find thumbnail variant for this unique image
                        const baseMatch = image.match(
                          /(.+?)_(?:thumbnail|medium|large)\.webp$/
                        );
                        if (baseMatch) {
                          const baseName = baseMatch[1];
                          const thumbnailVariant = vegetable.images.find(
                            (img) =>
                              img && img.includes(`${baseName}_thumbnail.webp`)
                          );

                          if (thumbnailVariant) {
                            return thumbnailVariant;
                          }
                        }

                        // Smart URL construction fallback
                        if (image.includes("_medium.webp")) {
                          return image.replace(
                            "_medium.webp",
                            "_thumbnail.webp"
                          );
                        }
                        if (image.includes("_large.webp")) {
                          return image.replace(
                            "_large.webp",
                            "_thumbnail.webp"
                          );
                        }

                        // Use the image as-is for non-optimized images
                        return image;
                      })()}
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
            {uniqueImages &&
              uniqueImages.length > 1 &&
              uniqueImages.length <= 5 && (
                <div className="d-flex justify-content-center mt-3 gap-2">
                  {uniqueImages.map((_, index) => (
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
              <Badge
                className="fs-5 px-3 py-2 price-badge"
                style={{
                  backgroundColor: "#6f42c1",
                  color: "white",
                  borderRadius: "8px",
                  fontWeight: "600",
                }}
              >
                ₹{vegetable.price}/{vegetable.unit || "kg"}
              </Badge>
            </div>

            {/* Description */}
            <div className="mb-4">
              <p className="text-muted lead mb-0 product-description ui-scroll">
                {vegetable.description}
              </p>
            </div>

            {/* Quick Info Cards */}
            <Row className="g-3 mb-4">
              <Col xs={6} lg={6}>
                <Card className="border-0 bg-light h-100 info-card">
                  <Card.Body className="d-flex align-items-center p-3">
                    <i className="ti-location-pin fs-4 me-3 text-info"></i>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="text-muted small">Location</div>
                      {renderLocation(vegetable.location)}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={6} lg={6}>
                <Card className="border-0 bg-light h-100 info-card">
                  <Card.Body className="d-flex align-items-center p-3">
                    <i
                      className={`ti-package fs-4 me-3 ${
                        isOutOfStock ? "text-danger" : "text-warning"
                      }`}
                    ></i>
                    <div>
                      <div className="text-muted small">Available Quantity</div>
                      <div
                        className={`fw-semibold ${
                          isOutOfStock ? "text-danger" : ""
                        }`}
                      >
                        {isOutOfStock ? "0" : vegetable.quantity}{" "}
                        {vegetable.unit || "kg"}
                        {isOutOfStock && (
                          <small className="text-danger d-block">
                            Out of Stock
                          </small>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={6} lg={6}>
                <Card className="border-0 bg-light h-100 info-card">
                  <Card.Body className="d-flex align-items-center p-3">
                    <i className="ti-tag fs-4 me-3 text-primary"></i>
                    <div>
                      <div className="text-muted small">Category</div>
                      <div className="fw-semibold text-capitalize">
                        {vegetable.category}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={6} lg={6}>
                <Card className="border-0 bg-light h-100 info-card">
                  <Card.Body className="d-flex align-items-center p-3">
                    <i className="ti-home fs-4 me-3 text-secondary"></i>
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
            <Card className="border-0 bg-light mb-4 seller-info-card">
              <Card.Body>
                <h5 className="mb-3">Seller Information</h5>
                <div className="row g-3">
                  <div className="col-12 col-sm-8">
                    <div className="d-flex align-items-center">
                      <div className="me-3">
                        <UserAvatar user={vegetable.owner} size={48} />
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-semibold">
                          {vegetable.owner?.name || "Anonymous Seller"}
                        </div>
                        <div className="text-muted small">
                          <i className="ti-check-box text-success me-1"></i>
                          Verified Seller
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-sm-4">
                    <div className="d-grid">
                      <Button
                        variant="outline-info"
                        size="lg"
                        onClick={handleWhatsAppClick}
                        disabled={!vegetable.owner?.whatsapp_number}
                        className="contact-seller-btn"
                        style={{
                          borderColor: "#17a2b8",
                          color: "#17a2b8",
                          fontWeight: "600",
                        }}
                        title={
                          !vegetable.owner?.whatsapp_number
                            ? "WhatsApp number not available for this seller"
                            : "Contact seller via WhatsApp"
                        }
                      >
                        <i className="ti-brand-whatsapp me-2"></i>
                        Contact Seller
                      </Button>
                    </div>
                  </div>
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
                      // Limit quantity to what's actually available considering cart
                      const maxAllowedQuantity = Math.max(1, remainingQuantity);
                      setQuantity(Math.min(newQuantity, maxAllowedQuantity));
                    }}
                    min="1"
                    max={Math.max(1, remainingQuantity)}
                    style={{ width: "100px" }}
                    className="me-3"
                    disabled={isOutOfStock || remainingQuantity <= 0}
                    title={
                      isOutOfStock
                        ? "Out of stock"
                        : remainingQuantity <= 0
                        ? `Already have maximum available quantity (${currentCartQuantity}) in cart`
                        : undefined
                    }
                  />
                  <div className="text-muted">{vegetable.unit || "kg"}</div>
                  {isOutOfStock ? (
                    <div className="text-danger small ms-2">
                      <i className="ti-alert-circle me-1"></i>
                      Currently unavailable
                    </div>
                  ) : remainingQuantity <= 0 ? (
                    <div className="text-warning small ms-2">
                      <i className="ti-info-circle me-1"></i>
                      Maximum quantity in cart ({currentCartQuantity})
                    </div>
                  ) : currentCartQuantity > 0 ? (
                    <div className="text-info small ms-2">
                      <i className="ti-shopping-cart me-1"></i>
                      {currentCartQuantity} already in cart, {remainingQuantity}{" "}
                      more available
                    </div>
                  ) : null}
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="text-muted">Subtotal</div>
                  <div className="fs-4 fw-bold">
                    ₹{vegetable.price * quantity}
                  </div>
                </div>
                <div className="d-grid">
                  <Button
                    variant={
                      isOutOfStock
                        ? "outline-danger"
                        : hasSimilarFreeItemInCart
                        ? "secondary"
                        : "success"
                    }
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={
                      isOutOfStock ||
                      hasSimilarFreeItemInCart ||
                      wouldExceedStock ||
                      remainingQuantity <= 0
                    }
                    title={
                      isOutOfStock
                        ? "This item is currently out of stock"
                        : hasSimilarFreeItemInCart
                        ? `You already have a similar free item (${similarFreeItemCheck.conflictingItem?.name}) in your cart`
                        : wouldExceedStock || remainingQuantity <= 0
                        ? `Cannot add more. Maximum available: ${maxQuantity}, Currently in cart: ${currentCartQuantity}`
                        : undefined
                    }
                  >
                    <i
                      className={
                        isOutOfStock
                          ? "ti-alert-circle me-2"
                          : hasSimilarFreeItemInCart
                          ? "ti-ban me-2"
                          : "ti-shopping-cart me-2"
                      }
                    ></i>
                    {isOutOfStock
                      ? "Out of Stock"
                      : hasSimilarFreeItemInCart
                      ? "Similar Item Already in Cart"
                      : wouldExceedStock || remainingQuantity <= 0
                      ? "Maximum Quantity in Cart"
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
