"use client";

import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Form,
} from "react-bootstrap";
import useUserRole from "@/hooks/useUserRole";
import { useSellerOrders } from "@/hooks/useSellerOrders";
import SellerGuard from "@/components/common/SellerGuard";
import SearchInput from "@/components/common/SearchInput";
import ClearFiltersButton from "@/components/common/ClearFiltersButton";
import LocationLink from "@/components/common/LocationLink";
import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useDebounce } from "@/hooks/useDebounce";
// Using native JavaScript date formatting instead of date-fns

function SellerOrderCard({ order, onUpdateStatus }) {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "warning";
      case "whatsapp_sent":
        return "primary";
      case "payment_received":
        return "success";
      case "confirmed":
        return "info";
      case "processing":
        return "primary";
      case "shipped":
        return "secondary";
      case "delivered":
        return "success";
      case "cancelled":
        return "danger";
      default:
        return "secondary";
    }
  };

  const handleStatusChange = (newStatus) => {
    onUpdateStatus(order.id, newStatus);
  };

  return (
    <Card className="mb-3 border-0 shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h6 className="mb-0">Order #{order.id.slice(-8)}</h6>
              {order.isGuestOrder && (
                <Badge bg="info" className="small">
                  <i className="ti-user me-1"></i>
                  Guest
                </Badge>
              )}
            </div>
            <small className="text-muted">
              {new Date(order.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              })}{" "}
              at{" "}
              {new Date(order.created_at).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </small>
          </div>
          <Badge bg={getStatusColor(order.status)} className="text-capitalize">
            {order.status}
          </Badge>
        </div>

        {/* User profile on left, Address & WhatsApp on right */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="d-flex align-items-center">
            <div
              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
              style={{ width: "28px", height: "28px", fontSize: "12px" }}
            >
              {order.buyer?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <strong className="mb-0">
                {order.buyer?.name || "Unknown Customer"}
              </strong>
              <div className="text-muted small">{order.buyer?.email}</div>
            </div>
          </div>

          {/* Address and WhatsApp button together on right */}
          <div className="text-end">
            {order.delivery_address && (
              <div className="small text-muted mb-1">
                <i className="ti-location-pin me-1"></i>
                <LocationLink
                  location={order.delivery_address}
                  fallbackRoute="/users"
                  variant="link"
                  size="sm"
                  className="text-muted"
                  style={{ fontSize: "0.875rem" }}
                />
              </div>
            )}
            {(order.buyer?.whatsapp_number || order.buyer?.phone_number) && (
              <Button
                size="sm"
                variant="outline-success"
                href={`https://wa.me/${(
                  order.buyer.whatsapp_number || order.buyer.phone_number
                ).replace(/[^0-9]/g, "")}?text=Hello! Your ${
                  order.isGuestOrder ? "guest " : ""
                }order #${order.id.slice(-8)} status update...`}
                target="_blank"
                className="py-1 px-2"
              >
                <i className="ti-brand-whatsapp me-1"></i>
                WhatsApp
              </Button>
            )}
          </div>
        </div>

        {/* Items section below on left with total amount on right */}
        <div className="d-flex justify-content-between align-items-center mb-1">
          <strong className="text-muted small">
            ITEMS ({order.items?.length || 0})
          </strong>
          <strong className="text-success">₹{order.total_amount}</strong>
        </div>

        {/* Compact items list */}
        <div className="mb-2">
          {order.items?.map((item, index) => (
            <div
              key={index}
              className="d-flex justify-content-between align-items-center"
            >
              <small>{item.vegetable?.name || "Unknown Item"}</small>
              <small className="text-muted">
                {item.quantity} × ₹{item.price_per_unit} = ₹{item.total_price}
              </small>
            </div>
          ))}
        </div>

        <div className="d-flex gap-2">
          {/* Show confirm/cancel buttons for pending, whatsapp_sent, and payment_received statuses */}
          {(order.status === "pending" ||
            order.status === "whatsapp_sent" ||
            order.status === "payment_received") && (
            <>
              <Button
                size="sm"
                variant="success"
                onClick={() => handleStatusChange("confirmed")}
              >
                Confirm Order
              </Button>
              <Button
                size="sm"
                variant="outline-danger"
                onClick={() => handleStatusChange("cancelled")}
              >
                Cancel
              </Button>
            </>
          )}
          {order.status === "confirmed" && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleStatusChange("processing")}
            >
              Start Processing
            </Button>
          )}
          {order.status === "processing" && (
            <Button
              size="sm"
              variant="success"
              onClick={() => handleStatusChange("shipped")}
            >
              Mark Shipped
            </Button>
          )}
          {order.status === "shipped" && (
            <Button
              size="sm"
              variant="success"
              onClick={() => handleStatusChange("delivered")}
            >
              Mark Delivered
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

function SellerDashboardContent() {
  const {
    orders: allOrders,
    loading,
    filters,
    updateFilters,
    updateOrderStatus,
    refreshOrders,
  } = useSellerOrders();

  // Listen for order creation events to refresh seller orders list
  useEffect(() => {
    const handleOrderCreated = () => {
      console.log("🔄 New order created, refreshing seller orders list...");
      refreshOrders();
    };

    const handleOrderCompleted = () => {
      console.log("🔄 Order completed, refreshing seller orders list...");
      refreshOrders();
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
  }, [refreshOrders]);

  const [searchValue, setSearchValue] = useState("");
  const debouncedSearch = useDebounce(searchValue, 300);
  const searchInputRef = useRef(null);

  // Client-side search filtering to prevent parent re-renders and focus loss
  const filteredOrders = useMemo(() => {
    if (!debouncedSearch) return allOrders;

    const query = debouncedSearch.toLowerCase();
    return allOrders.filter((order) => {
      const idMatch = order.id.toLowerCase().includes(query);
      const nameMatch = order.buyer?.name?.toLowerCase().includes(query);
      const itemMatch = order.items?.some((item) =>
        item.vegetable?.name?.toLowerCase().includes(query)
      );

      return idMatch || nameMatch || itemMatch;
    });
  }, [allOrders, debouncedSearch]);

  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchValue(query);
  }, []);

  const handleSearchSubmit = useCallback((query) => {
    setSearchValue(query);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchValue("");
  }, []);

  const statusCounts = filteredOrders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    acc.total = (acc.total || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <Container className="pb-4">
        <div className="text-center">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading your orders...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="pb-3 py-mb-3">
      <div className="mb-4">
        <Row className="g-3 align-items-center">
          <Col>
            <div className="d-flex align-items-center">
              <i
                className="ti-package me-3 text-success"
                style={{ fontSize: "2rem" }}
              ></i>
              <div>
                <h1 className="h3 mb-1 lh-1">Seller Dashboard</h1>
                <p className="text-muted mb-0 small">
                  Manage orders from your customers
                </p>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <div className="h2 text-primary mb-1">
                {statusCounts.total || 0}
              </div>
              <div className="text-muted">Total Orders</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <div className="h2 text-warning mb-1">
                {(statusCounts.pending || 0) +
                  (statusCounts.whatsapp_sent || 0)}
              </div>
              <div className="text-muted">Needs Action</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <div className="h2 text-info mb-1">
                {statusCounts.confirmed || 0}
              </div>
              <div className="text-muted">Confirmed</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <div className="h2 text-success mb-1">
                {statusCounts.delivered || 0}
              </div>
              <div className="text-muted">Delivered</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search and Filter Controls */}
      <div className="mb-4">
        <Row className="g-3 align-items-end">
          <Col xs={12} lg={5}>
            <Form.Group className="mb-0">
              <Form.Label className="small fw-medium text-muted mb-2">
                Search Orders
              </Form.Label>
              <SearchInput
                ref={searchInputRef}
                value={searchValue}
                onChange={handleSearchChange}
                onSubmit={handleSearchSubmit}
                onClear={handleSearchClear}
                placeholder="Search orders by order ID, customer name, or item..."
              />
            </Form.Group>
          </Col>
          <Col xs={12} sm={6} lg={2}>
            <Form.Group className="mb-0">
              <Form.Label className="small fw-medium text-muted mb-2">
                Filter by Status
              </Form.Label>
              <Form.Select
                value={filters.status}
                onChange={(e) => updateFilters({ status: e.target.value })}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="whatsapp_sent">WhatsApp Sent</option>
                <option value="payment_received">Payment Received</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col xs={12} sm={6} lg={2}>
            <Form.Group className="mb-0">
              <Form.Label className="small fw-medium text-muted mb-2">
                Filter by Time
              </Form.Label>
              <Form.Select
                value={filters.period}
                onChange={(e) => updateFilters({ period: e.target.value })}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="3months">Last 3 Months</option>
                <option value="year">This Year</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col xs={12} lg={3}>
            <ClearFiltersButton
              onClick={() => {
                handleSearchClear();
                updateFilters({ status: "all", period: "all" });
              }}
            />
          </Col>
        </Row>
      </div>

      {/* Orders List */}
      <Row>
        <Col>
          {filteredOrders.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center py-5">
                <i
                  className="ti-package"
                  style={{ fontSize: "3rem", color: "#dee2e6" }}
                ></i>
                <h4 className="mt-3 mb-2">No Orders Found</h4>
                <p className="text-muted">
                  {filters.status !== "all" || debouncedSearch
                    ? "No orders match your current filters."
                    : "You haven't received any orders yet."}
                </p>
              </Card.Body>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <SellerOrderCard
                key={order.id}
                order={order}
                onUpdateStatus={updateOrderStatus}
              />
            ))
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default function SellerDashboardPage() {
  return (
    <SellerGuard>
      <SellerDashboardContent />
    </SellerGuard>
  );
}
