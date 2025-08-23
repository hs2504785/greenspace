"use client";

import {
  Card,
  Button,
  Badge,
  Spinner,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import ImagePlaceholder from "../../common/ImagePlaceholder";
import UserAvatar from "../../common/UserAvatar";
import toastService from "@/utils/toastService";
import PreBookingService from "@/services/PreBookingService";

// Helper function to validate if a string is a valid URL
const isValidUrl = (str) => {
  if (!str || typeof str !== "string") return false;
  return str.startsWith("http://") || str.startsWith("https://");
};

// Helper function to get image URL
const getImageUrl = (images) => {
  if (!images || images.length === 0) return "";
  // Look for medium variant first, then any valid URL
  const mediumImage = images.find(
    (img) =>
      typeof img === "string" && img.includes("_medium") && isValidUrl(img)
  );
  if (mediumImage) return mediumImage;

  return images.find((img) => typeof img === "string" && isValidUrl(img)) || "";
};

export default function PreBookingProductCard({
  id,
  name,
  images,
  price,
  owner,
  owner_id,
  location,
  category,
  estimated_available_date,
  harvest_season,
  min_order_quantity = 1,
  seller_confidence = 90,
  prebooking_notes,
  demand_level = "none",
  total_prebookings = 0,
  interested_customers = 0,
}) {
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(min_order_quantity);
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  const imageUrl = getImageUrl(images);
  const hasValidImage =
    imageUrl && imageUrl.trim() !== "" && imageUrl.startsWith("http");

  // Calculate days until available
  const getDaysUntilAvailable = () => {
    if (!estimated_available_date) return null;
    const now = new Date();
    const availableDate = new Date(estimated_available_date);
    const diffTime = availableDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Available now";
    if (diffDays === 0) return "Available today";
    if (diffDays === 1) return "Available tomorrow";
    if (diffDays <= 7) return `${diffDays} days`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks`;
    return `${Math.ceil(diffDays / 30)} months`;
  };

  const handlePreBook = async () => {
    if (!session) {
      toastService.error("Please login to make a prebooking");
      return;
    }

    if (quantity < min_order_quantity) {
      toastService.error(`Minimum order quantity is ${min_order_quantity}kg`);
      return;
    }

    try {
      setLoading(true);

      // Check for existing prebooking
      const existing = await PreBookingService.checkExistingPreBooking(
        session.user.id,
        owner?.id || owner_id,
        name
      );

      if (existing) {
        toastService.error(
          `You already have a ${existing.status} prebooking for ${name} with this seller`
        );
        return;
      }

      const preBookingData = {
        user_id: session.user.id,
        seller_id: owner?.id || owner_id,
        vegetable_name: name,
        category,
        quantity,
        unit: "kg",
        estimated_price: price,
        target_date: estimated_available_date,
        user_notes: null,
        seller_confidence_level: seller_confidence,
        fulfillment_probability: seller_confidence,
      };

      const result = await PreBookingService.createPreBooking(preBookingData);

      if (result) {
        toastService.success(
          `Pre-booked ${quantity}kg ${name}! You'll be notified when it's ready.`,
          { icon: "🌱", duration: 5000 }
        );

        // Reset quantity to minimum
        setQuantity(min_order_quantity);
      }
    } catch (error) {
      console.error("Error creating prebooking:", error);
      toastService.error("Failed to create prebooking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
          onError={() => setImageError(true)}
          priority={false}
          loading="lazy"
        />
      );
    } catch (error) {
      return <ImagePlaceholder />;
    }
  };

  const daysUntilAvailable = getDaysUntilAvailable();

  return (
    <Card
      className="border shadow rounded-3 h-100"
      style={{
        borderColor: "#e3e6f0",
        transition: "all 0.2s ease",
        "--bs-card-border-width": "1px",
      }}
    >
      <div className="position-relative">
        {/* Prebooking Badge */}
        <div className="position-absolute top-0 start-0 z-1">
          <Badge bg="primary" className="m-2 px-2 py-1 small">
            🌱 Pre-Order
          </Badge>
        </div>

        {/* Availability Badge */}
        {daysUntilAvailable && (
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip>
                Target Date:{" "}
                {estimated_available_date
                  ? new Date(estimated_available_date).toLocaleDateString()
                  : "TBD"}
              </Tooltip>
            }
          >
            <div className="position-absolute top-0 end-0 z-1">
              <Badge bg="success" className="m-2 px-2 py-1 small">
                {daysUntilAvailable}
              </Badge>
            </div>
          </OverlayTrigger>
        )}

        <Link href={`/vegetables/${id}`} className="text-decoration-none">
          <div
            style={{ position: "relative", height: "180px" }}
            className="rounded-top overflow-hidden"
          >
            {renderImage()}
          </div>
        </Link>
      </div>

      <Card.Body className="p-3 d-flex flex-column">
        {/* Header with name and category */}
        <div className="mb-2">
          <div className="d-flex align-items-center justify-content-between mb-1">
            <h5 className="mb-0 text-truncate fw-semibold">{name}</h5>
            <Badge bg="outline-secondary" className="small">
              {category}
            </Badge>
          </div>
          <div className="small text-muted">{harvest_season}</div>
        </div>

        {/* Seller info */}
        <div className="d-flex align-items-center mb-3">
          <UserAvatar user={owner} size={20} className="me-2 flex-shrink-0" />
          <div className="flex-grow-1 min-w-0">
            <div className="small fw-medium text-truncate">
              {owner?.name || "Local Farmer"}
            </div>
            {location && (
              <div className="text-muted small text-truncate">
                <i className="ti-location-pin me-1"></i>
                {location}
              </div>
            )}
          </div>
        </div>

        {/* Price and metrics */}
        <div className="row g-2 mb-3">
          <div className="col-6">
            <div className="text-center p-2 bg-light rounded">
              <div className="small text-muted">Price</div>
              <div className="fw-bold text-success">
                ₹{Number(price).toFixed(2)}/kg
              </div>
            </div>
          </div>
          <div className="col-6">
            <div className="text-center p-2 bg-light rounded">
              <div className="small text-muted">Min Order</div>
              <div className="fw-medium">{min_order_quantity}kg</div>
            </div>
          </div>
        </div>

        {/* Quantity Selector and Pre-book Button */}
        <div className="mt-auto">
          <div className="d-flex gap-2 align-items-center mb-2">
            <span className="small text-muted">Quantity:</span>
            <div className="d-flex border rounded">
              <Button
                variant="outline-light"
                size="sm"
                className="border-0 px-2"
                disabled={quantity <= min_order_quantity}
                onClick={(e) => {
                  e.preventDefault();
                  setQuantity(Math.max(min_order_quantity, quantity - 1));
                }}
              >
                −
              </Button>
              <div className="px-2 py-1 d-flex align-items-center border-start border-end bg-white small">
                {quantity}kg
              </div>
              <Button
                variant="outline-light"
                size="sm"
                className="border-0 px-2"
                disabled={quantity >= 50}
                onClick={(e) => {
                  e.preventDefault();
                  setQuantity(Math.min(50, quantity + 1));
                }}
              >
                +
              </Button>
            </div>
          </div>

          <div className="d-grid">
            <Button
              variant="success"
              size="sm"
              className="fw-medium"
              disabled={!session || loading}
              onClick={handlePreBook}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="me-1" />
                  Processing...
                </>
              ) : (
                <>
                  <i className="ti-shopping-cart me-1"></i>
                  Pre-Book for ₹{(price * quantity).toFixed(2)}
                </>
              )}
            </Button>
          </div>

          {!session && (
            <div className="text-center mt-2">
              <small className="text-muted">
                <i className="ti-info-circle me-1"></i>
                Please login to pre-book
              </small>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
