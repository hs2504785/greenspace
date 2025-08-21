"use client";

import { useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import OrderList from "@/components/features/orders/OrderList";
import OrderFilters from "@/components/features/orders/OrderFilters";
import { useOrders } from "@/hooks/useOrders";

export default function OrdersPage() {
  const {
    orders,
    loading,
    error,
    filters,
    updateFilters,
    totalCount,
    refresh,
  } = useOrders();

  // Listen for order creation events to refresh orders list
  useEffect(() => {
    const handleOrderCreated = () => {
      console.log("🔄 New order created, refreshing orders list...");
      refresh();
    };

    const handleOrderCompleted = () => {
      console.log("🔄 Order completed, refreshing orders list...");
      refresh();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("order-created", handleOrderCreated);
      window.addEventListener("order-completed", handleOrderCompleted);
      window.addEventListener("ai-order-created", handleOrderCreated);

      return () => {
        window.removeEventListener("order-created", handleOrderCreated);
        window.removeEventListener("order-completed", handleOrderCompleted);
        window.removeEventListener("ai-order-created", handleOrderCreated);
      };
    }
  }, [refresh]);

  return (
    <Container className="pb-4">
      <Row className="mb-4">
        <Col>
          <h1 className="mb-3">
            <i className="ti-package me-2"></i>
            Orders & Deliveries
          </h1>
          <p className="text-muted">
            Track and manage your orders. You have placed {totalCount} order
            {totalCount !== 1 ? "s" : ""}.
          </p>
        </Col>
      </Row>

      <Row>
        <Col lg={3} className="mb-4 mb-lg-0">
          <OrderFilters filters={filters} onFilterChange={updateFilters} />
        </Col>
        <Col lg={9}>
          <OrderList orders={orders} loading={loading} error={error} />
        </Col>
      </Row>
    </Container>
  );
}
