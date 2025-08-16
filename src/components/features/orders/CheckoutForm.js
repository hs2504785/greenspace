"use client";

import { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import { useSession } from "next-auth/react";
import toastService from "@/utils/toastService";
import OrderService from "@/services/OrderService";

export default function CheckoutForm({
  show,
  onHide,
  cartItems,
  seller,
  total,
  onSuccess,
}) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    deliveryAddress: "",
    contactNumber: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!session?.user?.id) {
        throw new Error("User session invalid. Please login again.");
      }

      console.log("Session state:", {
        isAuthenticated: !!session,
        user: session?.user,
        id: session?.user?.id,
      });

      const orderData = {
        userId: session.user.id,
        sellerId: seller?.id,
        items: cartItems.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        total,
        deliveryAddress: formData.deliveryAddress,
        contactNumber: formData.contactNumber,
      };

      console.log("Submitting order:", orderData);

      const order = await OrderService.createOrder(orderData);

      toastService.presets.orderSuccess();
      onSuccess(order);
      onHide();
    } catch (error) {
      console.error("Error placing order:", error);
      toastService.presets.orderError();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="ti-shopping-cart me-2"></i>
          Complete Your Order
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="mb-4">
            <h6>Order Summary</h6>
            <div className="table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th className="text-end">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td className="text-end">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan="2" className="text-end">
                      <strong>Total:</strong>
                    </td>
                    <td className="text-end">
                      <strong>₹{total.toFixed(2)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-4">
            <h6>Seller Information</h6>
            <p className="mb-0">
              <strong>{seller?.name || "Unknown Seller"}</strong>
              <br />
              <small className="text-muted">
                {seller?.location || "Location not available"}
              </small>
            </p>
          </div>

          <div>
            <h6>Delivery Details</h6>
            <Form.Group className="mb-3">
              <Form.Label>Delivery Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="deliveryAddress"
                value={formData.deliveryAddress}
                onChange={handleInputChange}
                required
                placeholder="Enter your complete delivery address"
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Contact Number</Form.Label>
              <Form.Control
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
                required
                placeholder="Enter your contact number"
                pattern="[0-9]{10}"
                title="Please enter a valid 10-digit phone number"
              />
              <Form.Text className="text-muted">
                This number will be used for delivery updates
              </Form.Text>
            </Form.Group>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-1"
                  role="status"
                  aria-hidden="true"
                ></span>
                Placing Order...
              </>
            ) : (
              <>
                <i className="ti-check me-1"></i>
                Place Order
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
