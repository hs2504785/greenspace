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
    <Card className="border-0 bg-white">
      {/* Prebooking Badge */}
      <div className="position-absolute top-0 start-0 z-1">
        <Badge bg="primary" className="m-2 px-2 py-1">
          🌱 Pre-Order
        </Badge>
      </div>

      <Link href={`/vegetables/${id}`} className="text-decoration-none">
        <div
          style={{ position: "relative", height: "160px" }}
          className="rounded-3 overflow-hidden"
        >
          {renderImage()}

          {/* Availability Timeline - Moved to tooltip */}
          {daysUntilAvailable && (
            <OverlayTrigger
              placement="top"
              overlay={
                <Tooltip>
                  Available in {daysUntilAvailable}
                  {estimated_available_date && (
                    <div>
                      Target:{" "}
                      {new Date(estimated_available_date).toLocaleDateString()}
                    </div>
                  )}
                </Tooltip>
              }
            >
              <div
                className="position-absolute bottom-0 end-0 m-2 rounded-circle bg-white bg-opacity-90 d-flex align-items-center justify-content-center"
                style={{ width: "36px", height: "36px", cursor: "pointer" }}
              >
                <i className="ti-calendar text-success"></i>
              </div>
            </OverlayTrigger>
          )}
        </div>
      </Link>

      <div className="px-3 pb-3 pt-2">
        {/* Header with name and price */}
        <div className="d-flex align-items-start justify-content-between mb-2">
          <div className="flex-grow-1 me-2 min-w-0">
            <h3 className="h6 mb-1 text-truncate">{name}</h3>
            <div className="d-flex align-items-center text-muted small">
              <UserAvatar
                user={owner}
                size={16}
                className="me-1 flex-shrink-0"
              />
              <span className="text-truncate" style={{ maxWidth: "120px" }}>
                {owner?.name || "Seller"}
              </span>
            </div>
          </div>
          <div className="text-end flex-shrink-0">
            <div
              className="fw-bold text-success"
              style={{ fontSize: "0.9rem" }}
            >
              ₹{Number(price).toFixed(2)}/kg
            </div>
            <div className="small text-muted">{harvest_season}</div>
          </div>
        </div>

        {/* Quantity Selector and Pre-book Button */}
        <div className="d-flex gap-2 align-items-center">
          <div className="d-flex border rounded flex-shrink-0">
            <Button
              variant="white"
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
              variant="white"
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

          <Button
            variant="success"
            size="sm"
            className="flex-grow-1 rounded-pill"
            disabled={!session || loading}
            onClick={handlePreBook}
          >
            {loading ? (
              <>
                <Spinner size="sm" className="me-1" />
                Booking...
              </>
            ) : (
              <>Pre-Book ₹{(price * quantity).toFixed(2)}</>
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
    </Card>
  );
}
