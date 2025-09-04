"use client";

import { Card, Button, Form, Badge, Row, Col, Spinner } from "react-bootstrap";
import { useState } from "react";
import { useSession } from "next-auth/react";
import UserAvatar from "../../common/UserAvatar";
import toastService from "@/utils/toastService";
import PreBookingService from "@/services/PreBookingService";

export default function PreBookingCard({
  vegetableName,
  category,
  estimatedPrice = 0,
  estimatedAvailability = "In 2-3 weeks",
  sellerId,
  sellerName = "Local Farmer",
  sellerLocation = "Unknown",
  sellerAvatar = null,
  currentDemand = 0,
  unit = "kg",
  onPreBook,
  className = "",
  size = "normal", // "normal" or "compact"
}) {
  const [quantity, setQuantity] = useState(1);
  const [targetDate, setTargetDate] = useState("");
  const [userNotes, setUserNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  // Calculate minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  // Calculate maximum date (6 months from now)
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 6);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  const handlePreBook = async () => {
    if (!session) {
      toastService.error("Please login to make a prebooking");
      return;
    }

    if (!targetDate) {
      toastService.error("Please select when you need the vegetables");
      return;
    }

    try {
      setLoading(true);

      // Check for existing prebooking
      const existing = await PreBookingService.checkExistingPreBooking(
        session.user.id,
        sellerId,
        vegetableName
      );

      if (existing) {
        toastService.error(
          `You already have a ${existing.status} prebooking for ${vegetableName} with this seller`
        );
        return;
      }

      const preBookingData = {
        user_id: session.user.id,
        seller_id: sellerId,
        vegetable_name: vegetableName,
        category,
        quantity,
        unit: unit,
        estimated_price: estimatedPrice,
        target_date: targetDate,
        user_notes: userNotes.trim() || null,
        seller_confidence_level: 90, // Default confidence
        fulfillment_probability: 80.0, // Default probability
      };

      const result = await PreBookingService.createPreBooking(preBookingData);

      if (result) {
        toastService.success(
          `Pre-booked ${quantity}${unit} ${vegetableName} for ${targetDate}!`,
          {
            icon: "🌱",
          }
        );

        // Reset form
        setQuantity(1);
        setTargetDate("");
        setUserNotes("");

        // Call parent callback if provided
        if (onPreBook) {
          onPreBook(result);
        }
      }
    } catch (error) {
      console.error("Error creating prebooking:", error);
      toastService.error("Failed to create prebooking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getDemandBadge = () => {
    if (currentDemand >= 20)
      return { bg: "danger", text: "🔥 High Demand", count: currentDemand };
    if (currentDemand >= 5)
      return { bg: "warning", text: "⭐ Popular", count: currentDemand };
    if (currentDemand >= 1)
      return { bg: "info", text: "🌱 Requested", count: currentDemand };
    return { bg: "outline-secondary", text: "✨ New Request", count: 0 };
  };

  const demandBadge = getDemandBadge();
  const estimatedTotal = (estimatedPrice * quantity).toFixed(2);
  const isCompact = size === "compact";

  return (
    <Card className={`border-0 shadow-sm h-100 ${className}`}>
      <Card.Body className={isCompact ? "p-3" : "p-4"}>
        {/* Header with vegetable name and demand */}
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="flex-grow-1 me-2">
            <h5 className={`mb-1 ${isCompact ? "fs-6" : ""}`}>
              {vegetableName}
            </h5>
            <Badge bg="outline-secondary" className="mb-2 small">
              {category}
            </Badge>
          </div>
          <Badge
            bg={demandBadge.bg}
            className="text-wrap text-center"
            style={{ minWidth: "80px" }}
          >
            <div className="small">{demandBadge.text}</div>
            {demandBadge.count > 0 && (
              <div className="fw-bold">{demandBadge.count} orders</div>
            )}
          </Badge>
        </div>

        {/* Seller info */}
        <div className="d-flex align-items-center mb-3">
          <UserAvatar
            user={{ name: sellerName, avatar_url: sellerAvatar }}
            size={24}
            className="me-2 flex-shrink-0"
          />
          <div className="min-w-0 flex-grow-1">
            <div className="small fw-medium text-truncate">{sellerName}</div>
            <div className="text-muted small text-truncate">
              <i className="ti-location-pin me-1"></i>
              {sellerLocation}
            </div>
          </div>
        </div>

        {/* Price and availability info */}
        <Row className="g-2 mb-3">
          <Col xs={6}>
            <div className="text-center p-2 bg-light rounded">
              <div className="small text-muted">Est. Price</div>
              <div className="fw-bold text-success">
                {estimatedPrice > 0 ? `₹${estimatedPrice}/kg` : "Price TBD"}
              </div>
            </div>
          </Col>
          <Col xs={6}>
            <div className="text-center p-2 bg-light rounded">
              <div className="small text-muted">Available</div>
              <div className="small fw-medium">{estimatedAvailability}</div>
            </div>
          </Col>
        </Row>

        {/* Prebooking form */}
        <Form>
          {/* Quantity selector */}
          <Row className="g-2 mb-3">
            <Col xs={6}>
              <Form.Label className="small text-muted mb-1">
                Quantity
              </Form.Label>
              <div className="d-flex border rounded">
                <Button
                  variant="outline-light"
                  size="sm"
                  className="border-0 px-2"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  −
                </Button>
                <div className="px-3 py-1 d-flex align-items-center border-start border-end bg-white">
                  <span className="small">
                    {quantity}
                    {unit}
                  </span>
                </div>
                <Button
                  variant="outline-light"
                  size="sm"
                  className="border-0 px-2"
                  disabled={quantity >= 50}
                  onClick={() => setQuantity(Math.min(50, quantity + 1))}
                >
                  +
                </Button>
              </div>
            </Col>
            <Col xs={6}>
              <Form.Label className="small text-muted mb-1">Total</Form.Label>
              <div className="p-2 bg-success bg-opacity-10 rounded text-center">
                <div className="small fw-bold text-success">
                  {estimatedPrice > 0 ? `₹${estimatedTotal}` : "TBD"}
                </div>
              </div>
            </Col>
          </Row>

          {/* Target date */}
          <Form.Group className="mb-3">
            <Form.Label className="small text-muted mb-1">
              When do you need it?
            </Form.Label>
            <Form.Control
              type="date"
              size="sm"
              min={minDate}
              max={maxDateStr}
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="border-secondary"
            />
          </Form.Group>

          {/* Optional notes */}
          {!isCompact && (
            <Form.Group className="mb-3">
              <Form.Label className="small text-muted mb-1">
                Special requirements (optional)
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                size="sm"
                placeholder="e.g., organic only, specific variety..."
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                maxLength={200}
                className="border-secondary"
              />
              <Form.Text className="text-muted small">
                {userNotes.length}/200 characters
              </Form.Text>
            </Form.Group>
          )}

          {/* Submit button */}
          <div className="d-grid">
            <Button
              variant="success"
              size={isCompact ? "sm" : ""}
              className="rounded-pill fw-medium"
              disabled={!targetDate || !session || loading}
              onClick={handlePreBook}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Processing...
                </>
              ) : (
                <>
                  🌱 Pre-Book {quantity}
                  {unit}
                  {estimatedPrice > 0 && ` for ₹${estimatedTotal}`}
                </>
              )}
            </Button>
          </div>

          {!session && (
            <div className="text-center mt-2">
              <small className="text-muted">
                <i className="ti-info-circle me-1"></i>
                Please login to make prebookings
              </small>
            </div>
          )}
        </Form>

        {/* Additional info for high demand items */}
        {currentDemand >= 20 && (
          <div className="mt-3 p-2 bg-warning bg-opacity-10 rounded">
            <small className="text-warning-emphasis">
              <i className="ti-alert-triangle me-1"></i>
              <strong>High demand!</strong> This item has {currentDemand}{" "}
              prebookings. Consider booking early to secure your order.
            </small>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
