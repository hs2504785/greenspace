"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Alert,
  Button,
} from "react-bootstrap";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import GuestOrderDetails from "@/components/features/orders/GuestOrderDetails";
import OrderStatusBadge from "@/components/common/OrderStatusBadge";
import InfoNotice from "@/components/common/InfoNotice";
import toastService from "@/utils/toastService";

export default function GuestOrderPage() {
  const params = useParams();
  const router = useRouter();
  const [guestOrder, setGuestOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (params.id) {
      fetchGuestOrder(params.id);
    }
  }, [params.id]);

  const fetchGuestOrder = async (orderId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/guest/${orderId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch guest order: ${response.status}`);
      }

      const data = await response.json();
      setGuestOrder(data.guestOrder);
    } catch (error) {
      console.error("Error fetching guest order:", error);
      setError(error.message);
      toastService.error("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  // Status badge is now handled by OrderStatusBadge component

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 mb-0">Loading order details...</p>
        </div>
      </Container>
    );
  }

  if (error || !guestOrder) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Alert variant="danger">
              <Alert.Heading>Order Not Found</Alert.Heading>
              <p className="mb-3">
                {error ||
                  "The guest order you're looking for could not be found."}
              </p>
              <div>
                <Link href="/" className="btn btn-primary">
                  Continue Shopping
                </Link>
              </div>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h2 className="mb-1">Guest Order #{guestOrder.id.slice(-8)}</h2>
              <p className="text-muted mb-0">
                Order Date:{" "}
                {new Date(guestOrder.created_at).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="text-end">
              <OrderStatusBadge
                status={guestOrder.status}
                isGuestOrder={true}
              />
            </div>
          </div>
        </Col>
      </Row>

      {/* Order Status Info */}
      {guestOrder.status === "whatsapp_sent" && (
        <Row className="mb-4">
          <Col>
            <InfoNotice
              variant="info"
              title="Order Sent to Seller"
              icon="ti-brand-whatsapp"
            >
              Your order has been sent to the seller via WhatsApp. They will
              contact you shortly to confirm delivery details and payment
              method.
            </InfoNotice>
          </Col>
        </Row>
      )}

      {/* Order Details */}
      <Row>
        <Col>
          <GuestOrderDetails guestOrder={guestOrder} />
        </Col>
      </Row>

      {/* Action Buttons */}
      <Row className="mt-4">
        <Col className="d-flex gap-2">
          <Link href="/" className="btn btn-primary">
            <i className="ti-shopping-cart me-1"></i>
            Continue Shopping
          </Link>
          {guestOrder.seller?.whatsapp_number && (
            <Button
              variant="success"
              onClick={() => {
                const phone = guestOrder.seller.whatsapp_number.replace(
                  /\D/g,
                  ""
                );
                const message = `Hi! I'd like to check the status of my guest order #${guestOrder.id.slice(
                  -8
                )}`;
                window.open(
                  `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
                  "_blank"
                );
              }}
            >
              <i className="ti-brand-whatsapp me-1"></i>
              Contact Seller
            </Button>
          )}
        </Col>
      </Row>
    </Container>
  );
}
