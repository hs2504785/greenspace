"use client";

import { Container, Row, Col, Card } from "react-bootstrap";
import { useParams } from "next/navigation";
import OrderDetails from "@/components/features/orders/OrderDetails";
import OrderTimeline from "@/components/features/orders/OrderTimeline";
import { useOrder } from "@/hooks/useOrder";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function OrderDetailsPage() {
  const params = useParams();
  console.log("Order ID from params:", params.id); // For debugging

  const { order, loading, error } = useOrder(params.id);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <LoadingSpinner />
      </Container>
    );
  }

  if (error || !order) {
    return (
      <Container className="py-5">
        <Card body className="text-center text-danger">
          <i className="ti-alert me-2"></i>
          {error || "Order not found"}
        </Card>
      </Container>
    );
  }

  return (
    <Container className="pb-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="mb-0">
              <i className="ti-package me-2"></i>
              Order #{order.id}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
        </Col>
      </Row>

      <Row>
        <Col lg={8} className="mb-4">
          <OrderDetails order={order} />
        </Col>
        <Col lg={4}>
          <OrderTimeline order={order} />
        </Col>
      </Row>
    </Container>
  );
}

function OrderStatusBadge({ status }) {
  const styles = {
    pending: { bg: "warning", icon: "ti-timer", text: "Pending Payment" },
    pending_payment: {
      bg: "warning",
      icon: "ti-credit-card",
      text: "Payment Pending",
    },
    payment_received: {
      bg: "success",
      icon: "ti-check",
      text: "Payment Received",
    },
    confirmed: { bg: "info", icon: "ti-check", text: "Confirmed" },
    processing: { bg: "primary", icon: "ti-reload", text: "Processing" },
    shipped: { bg: "secondary", icon: "ti-truck", text: "Shipped" },
    delivered: { bg: "success", icon: "ti-package", text: "Delivered" },
    cancelled: { bg: "danger", icon: "ti-close", text: "Cancelled" },
  };

  const style = styles[status] || {
    bg: "secondary",
    icon: "ti-help",
    text: status,
  };

  return (
    <div className={`badge bg-${style.bg} fs-6 d-flex align-items-center`}>
      <i className={`${style.icon} me-1`}></i>
      {style.text}
    </div>
  );
}
