"use client";

import { Card, Table } from "react-bootstrap";
import UserAvatar from "@/components/common/UserAvatar";
import WhatsAppActions from "./WhatsAppActions";

export default function OrderDetails({ order }) {
  if (!order) {
    return (
      <div className="text-center py-4">
        <i className="ti-package text-muted" style={{ fontSize: "3rem" }}></i>
        <p className="mt-3 mb-0">Order details not available</p>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-4">
      <Card>
        <Card.Header>
          <i className="ti-package me-2"></i>
          Order Items
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive className="mb-0">
            <thead>
              <tr>
                <th>Item</th>
                <th>Price</th>
                <th>Quantity</th>
                <th className="text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item) => (
                <tr key={item.id}>
                  <td>{item.vegetable?.name || "Unknown Product"}</td>
                  <td>₹{item.price_per_unit?.toFixed(2) || "0.00"}</td>
                  <td>{item.quantity || 0}</td>
                  <td className="text-end">
                    ₹{item.total_price?.toFixed(2) || "0.00"}
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan="3" className="text-end border-0">
                  <strong>Total Amount:</strong>
                </td>
                <td className="text-end border-0">
                  <strong>₹{order.total_amount?.toFixed(2) || "0.00"}</strong>
                </td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <div className="row">
        <div className="col-md-6">
          <Card>
            <Card.Header>
              <i className="ti-location-pin me-2"></i>
              Delivery Details
            </Card.Header>
            <Card.Body>
              <h6>Delivery Address</h6>
              <p className="mb-3">{order.delivery_address}</p>

              <h6>Contact Number</h6>
              <p className="mb-0">{order.contact_number}</p>
            </Card.Body>
          </Card>
        </div>

        <div className="col-md-6">
          <Card>
            <Card.Header>
              <i className="ti-user me-2"></i>
              Seller Information
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <UserAvatar
                  user={order.seller || {}}
                  size={48}
                  className="me-3"
                />
                <div>
                  <h6 className="mb-1">
                    {order.seller?.name || "Unknown Seller"}
                  </h6>
                  <p className="mb-0 text-muted">
                    {order.seller?.location || "Location not available"}
                  </p>
                </div>
              </div>

              <WhatsAppActions order={order} userRole="buyer" />
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}
