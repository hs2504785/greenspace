"use client";

import { Card, Button, Form } from "react-bootstrap";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import ImagePlaceholder from "../common/ImagePlaceholder";
import UserAvatar from "../common/UserAvatar";
import { useCart } from "@/context/CartContext";
import { useSession } from "next-auth/react";
import { checkCartForSimilarFreeItems } from "@/utils/freeItemValidation";
import toastService from "@/utils/toastService";
import {
  isMapLink,
  getLocationDisplayText,
  openMapLink,
} from "@/utils/locationUtils";

// Helper function to validate if a string is a valid URL
const isValidUrl = (str) => {
  if (!str || typeof str !== "string") return false;
  return str.startsWith("http://") || str.startsWith("https://");
};

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
  return Object.values(grouped)
    .map((variants) => variants.medium || variants.large || variants.thumbnail)
    .filter(Boolean);
};

// Helper function to get the right image variant
const getImageVariant = (images, variant = "medium") => {
  if (!images || images.length === 0) return "";

  // First, look for the specific variant pattern (_variant.webp)
  const targetVariant = images.find((img) => {
    if (typeof img !== "string") return false;
    const pattern = new RegExp(`_${variant}\\.webp$`);
    return pattern.test(img) && isValidUrl(img);
  });

  if (targetVariant) {
    return targetVariant;
  }

  // Fallback: if looking for medium, any image with _medium in the name
  if (variant === "medium") {
    const mediumImage = images.find(
      (img) =>
        typeof img === "string" && img.includes("_medium") && isValidUrl(img)
    );
    if (mediumImage) {
      return mediumImage;
    }
  }

  // Final fallback: use the first valid URL
  const firstValidImage = images.find(
    (img) => typeof img === "string" && isValidUrl(img)
  );
  return firstValidImage || "";
};

export default function VegetableCard({
  id,
  name,
  images,
  price,
  owner,
  owner_id,
  location,
  quantity,
  unit = "kg", // default unit is kg
  category = "Vegetable",
}) {
  const [imageError, setImageError] = useState(false);
  const { addToCart, items, updateQuantity, removeFromCart } = useCart();
  const { data: session } = useSession();

  // Get unique logical images (group variants)
  const uniqueImages = groupImageVariants(images);
  const imageUrl = getImageVariant(images, "medium") || "";

  // Safety check for valid imageUrl - must be a proper URL
  const hasValidImage =
    imageUrl && imageUrl.trim() !== "" && imageUrl.startsWith("http");

  // Check if item is free (price = 0)
  const isFree = Number(price) === 0;

  // Check if item is already in cart
  const cartItem = items.find((item) => item.id === id);
  const [itemQuantity, setItemQuantity] = useState(cartItem?.quantity || 1);

  // For free items, check if there are similar items in cart
  const similarFreeItemCheck = isFree
    ? checkCartForSimilarFreeItems(items, name)
    : { hasConflict: false };
  const hasSimilarFreeItemInCart =
    similarFreeItemCheck.hasConflict &&
    similarFreeItemCheck.conflictingItem.id !== id;

  const isOutOfStock = !quantity || quantity <= 0;
  const maxQuantity = unit === "kg" ? quantity : Math.floor(quantity);

  // Use the actual available quantity for both free and paid items
  const effectiveMaxQuantity = maxQuantity;

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= effectiveMaxQuantity) {
      setItemQuantity(value);
    }
  };

  const handleQuantityUpdate = (newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(id);
      setItemQuantity(1); // Reset to 1 for next time
    } else if (newQuantity <= effectiveMaxQuantity) {
      setItemQuantity(newQuantity);
      if (cartItem) {
        updateQuantity(id, newQuantity);
      }
    }
  };

  // Check if increment button should be disabled (only when reaching available quantity)
  const isIncrementDisabled = cartItem && itemQuantity >= effectiveMaxQuantity;

  // Check if add button should be disabled
  const isAddButtonDisabled = isFree && hasSimilarFreeItemInCart;

  const handleAddToCart = async (e) => {
    e.preventDefault(); // Prevent link navigation
    if (!cartItem) {
      try {
        const result = await addToCart(
          {
            id,
            name,
            price,
            quantity: 1,
            unit,
            availableQuantity: maxQuantity,
            image: imageUrl,
            owner: {
              id: owner?.id || owner_id,
              name: owner?.name || "Seller",
              location: owner?.location || location,
              whatsapp_number: owner?.whatsapp_number,
            },
          },
          1,
          session?.user?.id
        );

        if (result.success) {
          toastService.success(`Added ${name} to cart!`, {
            icon: isFree ? "🎁" : "🛒",
          });
        } else if (result.error) {
          toastService.error(result.error);
        }
      } catch (error) {
        console.error("Error adding to cart:", error);
        toastService.error("Failed to add item to cart. Please try again.");
      }
    }
  };

  // Additional safety check - if anything goes wrong, show placeholder
  const renderImage = () => {
    try {
      if (imageError || !hasValidImage) {
        return <ImagePlaceholder />;
      }

      return (
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          style={{ objectFit: "cover" }}
          onError={(e) => {
            console.error(`❌ Image error for "${name}":`, imageUrl, e);
            setImageError(true);
          }}
          priority={false}
          loading="lazy"
        />
      );
    } catch (error) {
      console.error(`❌ Image rendering error for "${name}":`, error);
      return <ImagePlaceholder />;
    }
  };

  return (
    <Card className="border-0 bg-white">
      <Link href={`/vegetables/${id}`} className="text-decoration-none">
        <div
          style={{ position: "relative", height: "160px" }}
          className="rounded-3 overflow-hidden"
        >
          {renderImage()}

          {/* Multiple Images Indicator */}
          {uniqueImages && uniqueImages.length > 1 && (
            <div
              className="position-absolute bottom-0 end-0 m-2 px-2 py-1 rounded-pill text-white d-flex align-items-center"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                fontSize: "0.75rem",
                backdropFilter: "blur(4px)",
              }}
            >
              <i className="ti-image me-1" style={{ fontSize: "0.7rem" }}></i>
              {uniqueImages.length}
            </div>
          )}
        </div>
      </Link>

      <div className="px-3 pb-3 pt-2">
        {/* First line: Product name + Price */}
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h3
            className="h4 mb-0 text-truncate fw-semibold flex-grow-1 me-2"
            style={{ fontSize: "1.1rem", lineHeight: "1.3" }}
          >
            {name}
          </h3>
          <div
            className="px-2 py-1 rounded text-center"
            style={{
              backgroundColor: isFree ? "#d1e7dd" : "#f8f9fa",
              color: "#198754",
              fontWeight: 500,
              fontSize: "0.85rem",
              width: "70px",
              flexShrink: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {isFree ? "FREE" : `₹${Number(price).toFixed(2)}`}
          </div>
        </div>

        {/* Second line: Seller name + Location (full width) */}
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div
            className="d-flex align-items-center text-muted flex-grow-1 me-2"
            style={{ fontSize: "0.85rem" }}
          >
            <UserAvatar user={owner} size={20} className="me-2 flex-shrink-0" />
            <span className="text-truncate" style={{ maxWidth: "120px" }}>
              {owner?.name || "Seller"}
            </span>
          </div>
          <div
            className="d-flex align-items-center text-muted"
            style={{ fontSize: "0.8rem" }}
          >
            {location && isMapLink(location) ? (
              <Button
                variant="link"
                size="sm"
                className="p-0 text-decoration-none text-success fw-medium d-flex align-items-center"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openMapLink(location);
                }}
                style={{ fontSize: "0.8rem" }}
              >
                <i
                  className="ti-location-pin me-1"
                  style={{ fontSize: "0.75rem" }}
                ></i>
                <span className="text-truncate" style={{ maxWidth: "110px" }}>
                  {getLocationDisplayText(location, false)}
                </span>
              </Button>
            ) : (
              <>
                <i
                  className="ti-location-pin me-1"
                  style={{ fontSize: "0.75rem" }}
                ></i>
                <span className="text-truncate" style={{ maxWidth: "110px" }}>
                  {location}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="text-muted mb-2" style={{ fontSize: "0.85rem" }}>
          <i className="ti-package me-1"></i>
          {maxQuantity} {unit || "kg"} available
        </div>

        <div>
          {isOutOfStock ? (
            <Button variant="outline-danger" disabled className="w-100">
              <i className="ti-package-off me-2"></i>
              Out of Stock
            </Button>
          ) : cartItem ? (
            <div className="d-flex align-items-center gap-2">
              <div className="d-flex border rounded-1">
                <Button
                  variant="white"
                  className="border-0 px-3"
                  onClick={(e) => {
                    e.preventDefault();
                    handleQuantityUpdate(itemQuantity - 1);
                  }}
                >
                  −
                </Button>
                <div className="px-3 d-flex align-items-center border-start border-end">
                  {itemQuantity}
                </div>
                <Button
                  variant="white"
                  className="border-0 px-3"
                  disabled={isIncrementDisabled}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!isIncrementDisabled) {
                      handleQuantityUpdate(itemQuantity + 1);
                    }
                  }}
                  title={
                    isIncrementDisabled
                      ? "Maximum available quantity reached"
                      : "Increase quantity"
                  }
                >
                  +
                </Button>
              </div>
            </div>
          ) : (
            <Button
              className="w-100 rounded-pill text-white border-0"
              style={{
                backgroundColor: isAddButtonDisabled ? "#6c757d" : "#44b700",
                cursor: isAddButtonDisabled ? "not-allowed" : "pointer",
              }}
              disabled={isAddButtonDisabled}
              onClick={handleAddToCart}
              title={
                isAddButtonDisabled
                  ? `You already have a similar free item (${similarFreeItemCheck.conflictingItem?.name}) in your cart`
                  : undefined
              }
            >
              {isAddButtonDisabled
                ? "🚫 Similar item in cart"
                : isFree
                ? "🎁 Claim Free"
                : "Add"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
