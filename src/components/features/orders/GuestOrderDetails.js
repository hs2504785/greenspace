"use client";

import { Card, Table, Badge, Button } from "react-bootstrap";
import UserAvatar from "@/components/common/UserAvatar";
import LocationLink from "@/components/common/LocationLink";
import InfoNotice from "@/components/common/InfoNotice";

export default function GuestOrderDetails({ guestOrder }) {
  if (!guestOrder) {
    return (
      <div className="text-center py-4">
        <i className="ti-package text-muted" style={{ fontSize: "3rem" }}></i>
        <p className="mt-3 mb-0">Guest order details not available</p>
      </div>
    );
  }

  const formatOrderItems = (items) => {
    if (!items || !Array.isArray(items)) return [];
    return items;
  };

  const contactSeller = () => {
    const phone =
      guestOrder.seller?.whatsapp_number || guestOrder.seller?.phone;
    if (phone) {
      const message = `Hi! I'm checking on my guest order #${guestOrder.id.slice(
        -8
      )}`;
      window.open(
        `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(
          message
        )}`,
        "_blank"
      );
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Guest Order Banner */}
      <InfoNotice variant="help" title="Guest Order" icon="ti-user">
        Order placed without account. Details saved securely.
      </InfoNotice>

      {/* Order Items */}
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
              {formatOrderItems(guestOrder.order_items).map((item, index) => (
                <tr key={item.id || index}>
                  <td>{item.name || "Unknown Product"}</td>
                  <td>
                    {item.price === 0 ? (
                      <Badge bg="success">FREE</Badge>
                    ) : (
                      `₹${item.price?.toFixed(2) || "0.00"}${
                        item.unit ? `/${item.unit}` : ""
                      }`
                    )}
                  </td>
                  <td>
                    {item.quantity || 0} {item.unit || "kg"}
                  </td>
                  <td className="text-end">
                    ₹{item.total?.toFixed(2) || "0.00"}
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan="3" className="text-end border-0">
                  <strong>Total Amount:</strong>
                </td>
                <td className="text-end border-0">
                  <strong>
                    ₹{guestOrder.total_amount?.toFixed(2) || "0.00"}
                  </strong>
                </td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <div className="row">
        {/* Customer Information */}
        <div className="col-md-6">
          <Card>
            <Card.Header>
              <i className="ti-user me-2"></i>
              Customer Information
            </Card.Header>
            <Card.Body>
              <h6>Name</h6>
              <p className="mb-3">{guestOrder.guest_name}</p>

              <h6>Phone Number</h6>
              <p className="mb-3">
                <a
                  href={`tel:${guestOrder.guest_phone}`}
                  className="text-decoration-none"
                >
                  <i className="ti-phone me-1"></i>
                  {guestOrder.guest_phone}
                </a>
              </p>

              {guestOrder.guest_email && (
                <>
                  <h6>Email</h6>
                  <p className="mb-3">
                    <a
                      href={`mailto:${guestOrder.guest_email}`}
                      className="text-decoration-none"
                    >
                      <i className="ti-email me-1"></i>
                      {guestOrder.guest_email}
                    </a>
                  </p>
                </>
              )}

              <h6>Delivery Address</h6>
              <div className="mb-0">
                <LocationLink
                  location={guestOrder.guest_address}
                  fallbackRoute="/users"
                  className="d-block"
                />
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Seller Information */}
        <div className="col-md-6">
          <Card>
            <Card.Header>
              <i className="ti-store me-2"></i>
              Seller Information
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <UserAvatar
                  user={guestOrder.seller || {}}
                  size={48}
                  className="me-3"
                />
                <div>
                  <h6 className="mb-1">
                    {guestOrder.seller?.name || "Unknown Seller"}
                  </h6>
                  <div className="mb-0">
                    <LocationLink
                      location={guestOrder.seller?.location}
                      fallbackRoute={`/users/${guestOrder.seller?.id}/listings`}
                      className="d-block"
                    />
                  </div>
                </div>
              </div>

              {guestOrder.seller?.whatsapp_number && (
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={contactSeller}
                  className="d-flex align-items-center"
                >
                  <i className="ti-brand-whatsapp me-2"></i>
                  Contact Seller
                </Button>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}
