"use client";

import { Modal, Button, Form, Row, Col, Alert, Spinner } from "react-bootstrap";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import UserAvatar from "../../common/UserAvatar";
import toastService from "@/utils/toastService";
import PreBookingService from "@/services/PreBookingService";

export default function PreBookingModal({
  show,
  onHide,
  vegetable = null, // { id, name, category, owner, owner_id, location }
  onSuccess = null,
}) {
  const [quantity, setQuantity] = useState(1);
  const [targetDate, setTargetDate] = useState("");
  const [userNotes, setUserNotes] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingPreBooking, setExistingPreBooking] = useState(null);
  const { data: session } = useSession();

  // Calculate date constraints
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 6);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (show) {
      setQuantity(1);
      setTargetDate("");
      setUserNotes("");
      setEstimatedPrice("");
      setExistingPreBooking(null);

      // Check for existing prebooking if user is logged in
      if (session && vegetable) {
        checkExistingPreBooking();
      }
    }
  }, [show, session, vegetable]);

  const checkExistingPreBooking = async () => {
    if (!session || !vegetable) return;

    try {
      const existing = await PreBookingService.checkExistingPreBooking(
        session.user.id,
        vegetable.owner_id || vegetable.owner?.id,
        vegetable.name
      );

      if (existing) {
        setExistingPreBooking(existing);
      }
    } catch (error) {
      console.error("Error checking existing prebooking:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!session) {
      toastService.error("Please login to make a prebooking");
      return;
    }

    if (!targetDate) {
      toastService.error("Please select when you need the vegetables");
      return;
    }

    if (existingPreBooking) {
      toastService.error(
        `You already have a ${existingPreBooking.status} prebooking for ${vegetable.name}`
      );
      return;
    }

    try {
      setLoading(true);

      const preBookingData = {
        user_id: session.user.id,
        seller_id: vegetable.owner_id || vegetable.owner?.id,
        vegetable_name: vegetable.name,
        category: vegetable.category,
        quantity,
        unit: "kg",
        estimated_price: estimatedPrice ? parseFloat(estimatedPrice) : null,
        target_date: targetDate,
        user_notes: userNotes.trim() || null,
        seller_confidence_level: 85, // Lower confidence for out-of-stock items
        fulfillment_probability: 70.0,
      };

      const result = await PreBookingService.createPreBooking(preBookingData);

      if (result) {
        toastService.success(
          `Pre-booked ${quantity}kg ${vegetable.name} for ${targetDate}! The seller will contact you soon.`,
          { icon: "🌱", duration: 5000 }
        );

        // Call success callback
        if (onSuccess) {
          onSuccess(result);
        }

        // Close modal
        onHide();
      }
    } catch (error) {
      console.error("Error creating prebooking:", error);
      toastService.error("Failed to create prebooking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onHide();
    }
  };

  if (!vegetable) return null;

  const owner = vegetable.owner || {
    name: "Seller",
    location: vegetable.location,
  };
  const estimatedTotal = estimatedPrice
    ? (parseFloat(estimatedPrice) * quantity).toFixed(2)
    : "TBD";

  return (
    <Modal show={show} onHide={handleClose} size="md" centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fs-5 text-success">
          🌱 Pre-Book Vegetables
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="pt-2">
        {/* Vegetable info */}
        <div className="mb-4 p-3 bg-light rounded">
          <div className="d-flex align-items-start">
            <div className="flex-grow-1">
              <h6 className="mb-1">{vegetable.name}</h6>
              <div className="small text-muted d-flex align-items-center">
                <UserAvatar user={owner} size={16} className="me-1" />
                <span className="me-2">{owner.name}</span>
                {owner.location && (
                  <>
                    <span className="text-muted me-1">•</span>
                    <i
                      className="ti-location-pin me-1"
                      style={{ fontSize: "0.75rem" }}
                    ></i>
                    <span>{owner.location}</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="badge bg-warning text-dark">Out of Stock</div>
            </div>
          </div>
        </div>

        {/* Existing prebooking warning */}
        {existingPreBooking && (
          <Alert variant="warning" className="mb-3">
            <i className="ti-alert-triangle me-2"></i>
            You already have a <strong>{existingPreBooking.status}</strong>{" "}
            prebooking for {vegetable.name} with this seller.
          </Alert>
        )}

        {/* Prebooking form */}
        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            {/* Quantity and estimated price */}
            <Col xs={6}>
              <Form.Group>
                <Form.Label className="small fw-medium">
                  Quantity (kg)
                </Form.Label>
                <div className="d-flex border rounded">
                  <Button
                    type="button"
                    variant="outline-light"
                    size="sm"
                    className="border-0 px-2"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    −
                  </Button>
                  <div className="px-3 py-1 d-flex align-items-center border-start border-end bg-white flex-grow-1 justify-content-center">
                    <span>{quantity}</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline-light"
                    size="sm"
                    className="border-0 px-2"
                    disabled={quantity >= 50}
                    onClick={() => setQuantity(Math.min(50, quantity + 1))}
                  >
                    +
                  </Button>
                </div>
              </Form.Group>
            </Col>

            <Col xs={6}>
              <Form.Group>
                <Form.Label className="small fw-medium">
                  Expected Price/kg{" "}
                  <span className="text-muted">(optional)</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="0.50"
                  placeholder="₹0.00"
                  value={estimatedPrice}
                  onChange={(e) => setEstimatedPrice(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Total estimate */}
          {estimatedPrice && (
            <div className="mt-2 p-2 bg-success bg-opacity-10 rounded text-center">
              <small className="text-success fw-medium">
                Estimated Total: ₹{estimatedTotal}
              </small>
            </div>
          )}

          {/* Target date */}
          <Form.Group className="mt-3">
            <Form.Label className="small fw-medium">
              When do you need it? *
            </Form.Label>
            <Form.Control
              type="date"
              min={minDate}
              max={maxDateStr}
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
            />
            <Form.Text className="text-muted">
              Minimum: tomorrow, Maximum: 6 months from now
            </Form.Text>
          </Form.Group>

          {/* Special notes */}
          <Form.Group className="mt-3">
            <Form.Label className="small fw-medium">
              Special requirements{" "}
              <span className="text-muted">(optional)</span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Any specific variety, organic requirements, or other preferences..."
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              maxLength={300}
            />
            <Form.Text className="text-muted">
              {userNotes.length}/300 characters
            </Form.Text>
          </Form.Group>

          {/* Login reminder */}
          {!session && (
            <Alert variant="info" className="mt-3 mb-0">
              <i className="ti-info-circle me-2"></i>
              Please login to submit a prebooking request.
            </Alert>
          )}
        </Form>

        {/* Info about prebooking */}
        <div className="mt-3 p-3 bg-info bg-opacity-10 rounded">
          <h6 className="small fw-medium text-info-emphasis mb-2">
            <i className="ti-info-circle me-1"></i>
            How prebooking works:
          </h6>
          <ul className="small text-info-emphasis mb-0 ps-3">
            <li>Your request will be sent to the farmer/seller</li>
            <li>They'll confirm availability and final pricing</li>
            <li>You'll be notified when your vegetables are ready</li>
            <li>Payment is made upon delivery or pickup</li>
          </ul>
        </div>
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0">
        <Button
          variant="outline-secondary"
          onClick={handleClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="success"
          onClick={handleSubmit}
          disabled={!session || !targetDate || loading || existingPreBooking}
        >
          {loading ? (
            <>
              <Spinner size="sm" className="me-2" />
              Submitting...
            </>
          ) : (
            <>🌱 Submit Pre-booking</>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
