"use client";

import { Card, Badge, Button } from "react-bootstrap";
import Link from "next/link";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import UserAvatar from "@/components/common/UserAvatar";

const ORDER_STATUS_STYLES = {
  pending: { bg: "warning", icon: "ti-timer" },
  confirmed: { bg: "info", icon: "ti-check" },
  processing: { bg: "primary", icon: "ti-reload" },
  shipped: { bg: "success", icon: "ti-truck" },
  delivered: { bg: "success", icon: "ti-package" },
  cancelled: { bg: "danger", icon: "ti-close" },
};

export default function OrderList({ orders = [], loading, error }) {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Card body className="text-center text-danger">
        <i className="ti-alert me-2"></i>
        {error}
      </Card>
    );
  }

  if (!orders.length) {
    return (
      <Card body className="text-center">
        <i className="ti-package display-4 text-muted mb-3"></i>
        <p className="mb-0">
          No orders found. Start shopping to place your first order!
        </p>
      </Card>
    );
  }

  return (
    <div className="d-flex flex-column gap-3">
      {orders.map((order) => (
        <Card key={order.id}>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <div>
              <small className="text-muted">Order #</small>
              <strong>{order.id}</strong>
            </div>
            <Badge
              bg={ORDER_STATUS_STYLES[order.status]?.bg || "secondary"}
              className="d-flex align-items-center"
            >
              <i
                className={`${ORDER_STATUS_STYLES[order.status]?.icon} me-1`}
              ></i>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
          </Card.Header>
          <Card.Body>
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h6 className="mb-1">Items ({order.items?.length || 0})</h6>
                <div className="text-muted small">
                  {order.items
                    ?.map((item) => item.vegetable?.name || "Unknown Product")
                    .join(", ")}
                </div>
              </div>
              <div className="text-end">
                <h6 className="mb-1">Total Amount</h6>
                <div className="text-success">
                  ₹{order.total_amount?.toFixed(2) || "0.00"}
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <UserAvatar
                  user={order.seller || {}}
                  size={24}
                  className="me-2"
                />
                <span className="text-muted small">
                  Sold by{" "}
                  <strong>{order.seller?.name || "Unknown Seller"}</strong>
                </span>
              </div>
              <Button
                as={Link}
                href={`/orders/${order.id}`}
                variant="outline-primary"
                size="sm"
              >
                <i className="ti-eye me-1"></i>
                View Details
              </Button>
            </div>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}
