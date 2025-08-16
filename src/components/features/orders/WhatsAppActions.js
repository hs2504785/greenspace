"use client";

import { Button, Dropdown, ButtonGroup } from "react-bootstrap";
import {
  openWhatsApp,
  generateOrderStatusMessage,
  generateBuyerMessage,
  generateExistingOrderMessage,
} from "@/utils/whatsapp";

export default function WhatsAppActions({ order, userRole = "buyer" }) {
  const getCustomerPhoneNumber = () => {
    // For mobile users, use their phone number; for Google users, use contact number from order
    return (
      order.user?.phone_number ||
      order.user?.whatsapp_number ||
      order.contact_number
    );
  };

  const getSellerPhoneNumber = () => {
    return order.seller?.whatsapp_number || order.seller?.phone_number;
  };

  const handleSendStatusUpdate = (status) => {
    const phoneNumber = getCustomerPhoneNumber();
    if (!phoneNumber) {
      alert("Customer phone number not available");
      return;
    }

    const message = generateOrderStatusMessage(order, status);
    openWhatsApp(phoneNumber, message);
  };

  const handleCustomMessage = () => {
    const phoneNumber =
      userRole === "seller" ? getCustomerPhoneNumber() : getSellerPhoneNumber();

    if (!phoneNumber) {
      const recipient = userRole === "seller" ? "customer" : "seller";
      alert(`${recipient} phone number not available`);
      return;
    }

    const message =
      userRole === "seller"
        ? `Hi! Regarding your order #${order.id}, `
        : generateExistingOrderMessage(order);

    openWhatsApp(phoneNumber, message);
  };

  const handleOrderInquiry = (type) => {
    const phoneNumber = getSellerPhoneNumber();
    if (!phoneNumber) {
      alert("Seller WhatsApp number not available");
      return;
    }

    const message = generateBuyerMessage(order, type);
    openWhatsApp(phoneNumber, message);
  };

  // For sellers
  if (userRole === "seller") {
    return (
      <Dropdown as={ButtonGroup}>
        <Button
          variant="outline-success"
          size="sm"
          onClick={() => handleCustomMessage()}
          className="d-flex align-items-center"
        >
          <i className="ti-comment me-1"></i>
          WhatsApp Customer
        </Button>

        <Dropdown.Toggle
          split
          variant="outline-success"
          size="sm"
          id="whatsapp-dropdown"
        />

        <Dropdown.Menu>
          <Dropdown.Header>Send Status Update</Dropdown.Header>
          <Dropdown.Item
            onClick={() => handleSendStatusUpdate("confirmed")}
            className="d-flex align-items-center"
          >
            <i className="ti-check text-success me-2"></i>
            Order Confirmed
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => handleSendStatusUpdate("processing")}
            className="d-flex align-items-center"
          >
            <i className="ti-package text-warning me-2"></i>
            Processing Order
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => handleSendStatusUpdate("shipped")}
            className="d-flex align-items-center"
          >
            <i className="ti-truck text-info me-2"></i>
            Order Shipped
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => handleSendStatusUpdate("delivered")}
            className="d-flex align-items-center"
          >
            <i className="ti-check-box text-success me-2"></i>
            Order Delivered
          </Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item
            onClick={() => handleSendStatusUpdate("cancelled")}
            className="d-flex align-items-center"
          >
            <i className="ti-close text-danger me-2"></i>
            Order Cancelled
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    );
  }

  // For buyers
  const sellerPhone = getSellerPhoneNumber();
  if (!sellerPhone) {
    return null; // Don't show if seller doesn't have WhatsApp
  }

  return (
    <Dropdown as={ButtonGroup}>
      <Button
        variant="outline-success"
        size="sm"
        onClick={() => handleCustomMessage()}
        className="d-flex align-items-center"
      >
        <i className="ti-comment me-1"></i>
        WhatsApp Seller
      </Button>

      <Dropdown.Toggle
        split
        variant="outline-success"
        size="sm"
        id="buyer-whatsapp-dropdown"
      />

      <Dropdown.Menu>
        <Dropdown.Header>Quick Messages</Dropdown.Header>
        <Dropdown.Item
          onClick={() => handleCustomMessage()}
          className="d-flex align-items-center"
        >
          <i className="ti-clipboard text-primary me-2"></i>
          Share Order Details
        </Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item
          onClick={() => handleOrderInquiry("status")}
          className="d-flex align-items-center"
        >
          <i className="ti-info-alt text-info me-2"></i>
          Check Order Status
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => handleOrderInquiry("delivery")}
          className="d-flex align-items-center"
        >
          <i className="ti-location-pin text-warning me-2"></i>
          Update Delivery Details
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => handleOrderInquiry("issue")}
          className="d-flex align-items-center"
        >
          <i className="ti-alert text-danger me-2"></i>
          Report an Issue
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}
