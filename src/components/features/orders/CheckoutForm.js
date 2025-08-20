"use client";

import { useState } from "react";
import { Modal, Form, Button, Alert, Card, Badge } from "react-bootstrap";
import { useSession } from "next-auth/react";
import toastService from "@/utils/toastService";
import OrderService from "@/services/OrderService";
import UpiQrPayment from "@/components/features/payments/UpiQrPayment";

export default function CheckoutForm({
  show,
  onHide,
  cartItems,
  seller,
  total,
  onSuccess,
}) {
  console.log("🚨 CHECKOUT COMPONENT - Props received:", {
    show,
    cartItems,
    seller,
    total,
    totalType: typeof total,
    cartItemsLength: cartItems?.length,
  });
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState("details"); // "details" or "payment"
  const [createdOrder, setCreatedOrder] = useState(null);
  const [showUpiPayment, setShowUpiPayment] = useState(false);
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

      toastService.success(
        "Order placed successfully! Redirecting to order details..."
      );
      onSuccess(order);
      onHide();
    } catch (error) {
      console.error("Error placing order:", error);
      toastService.presets.orderError();
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!session?.user?.id) {
        throw new Error("User session invalid. Please login again.");
      }

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

      const order = await OrderService.createOrder(orderData);
      setCreatedOrder(order);
      setCheckoutStep("payment");

      toastService.success("Order created! Choose your payment method below.");
    } catch (error) {
      console.error("Error creating order:", error);
      toastService.presets.orderError();
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentComplete = (paymentResult) => {
    toastService.success("Payment completed successfully!");
    onSuccess(createdOrder);
    onHide();
    resetState();
  };

  const handleUpiPayment = () => {
    if (!createdOrder) {
      toastService.error("Order not created yet. Please try again.");
      return;
    }

    console.log("🚀 CheckoutForm - handleUpiPayment called:", {
      createdOrder,
      total,
      seller,
      orderDataForUpi: {
        ...createdOrder,
        total_amount: total,
        seller_id: seller?.id,
      },
    });

    setShowUpiPayment(true);
  };

  const handlePlaceOrderOnly = () => {
    if (!createdOrder) {
      toastService.error("Order not created yet. Please try again.");
      return;
    }
    toastService.success(
      "Order placed successfully! You can pay anytime from order details."
    );
    onSuccess(createdOrder);
    onHide();
    resetState();
  };

  const handleCodPayment = () => {
    if (!createdOrder) {
      toastService.error("Order not created yet. Please try again.");
      return;
    }
    toastService.success("Order placed with Cash on Delivery!");
    onSuccess(createdOrder);
    onHide();
    resetState();
  };

  const handleBackToDetails = () => {
    setCheckoutStep("details");
  };

  const resetState = () => {
    setTimeout(() => {
      setCheckoutStep("details");
      setCreatedOrder(null);
      setShowUpiPayment(false);
      setFormData({ deliveryAddress: "", contactNumber: "" });
    }, 100);
  };

  return (
    <>
      <Modal
        show={show}
        onHide={onHide}
        size="lg"
        className={
          showUpiPayment ? "checkout-modal-background" : "checkout-modal"
        }
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="ti-shopping-cart me-2"></i>
            {checkoutStep === "details"
              ? "Complete Your Order"
              : "Choose Payment Method"}
          </Modal.Title>
        </Modal.Header>

        {checkoutStep === "details" ? (
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

              <div className="row">
                <div className="col-md-8">
                  <Form.Group className="mb-3">
                    <Form.Label>Quick Delivery Address</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="deliveryAddress"
                      value={formData.deliveryAddress}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter delivery address (e.g., House no, Street, Area)"
                    />
                  </Form.Group>
                </div>
                <div className="col-md-4">
                  <Form.Group className="mb-3">
                    <Form.Label>Contact Number</Form.Label>
                    <Form.Control
                      type="tel"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleInputChange}
                      required
                      placeholder="10-digit number"
                      pattern="[0-9]{10}"
                    />
                  </Form.Group>
                </div>
              </div>

              <Alert variant="info" className="mb-0 mt-2">
                <i className="ti-info-alt me-2"></i>
                <small>
                  <strong>Two Options:</strong> Place order and pay later from
                  order details, or proceed to payment immediately.
                </small>
              </Alert>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={onHide} disabled={loading}>
                Cancel
              </Button>
              <Button variant="success" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-1"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Creating Order...
                  </>
                ) : (
                  <>
                    <i className="ti-check me-1"></i>
                    Place Order
                  </>
                )}
              </Button>
              <Button
                variant="primary"
                onClick={handleProceedToPayment}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-1"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Creating Order...
                  </>
                ) : (
                  <>
                    <i className="ti-arrow-right me-1"></i>
                    Proceed to Payment
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Form>
        ) : (
          <div>
            <Modal.Body>
              {createdOrder && (
                <>
                  <Alert variant="success" className="mb-4">
                    <i className="ti-check me-2"></i>
                    <strong>Order Created Successfully!</strong>
                    <br />
                    Order ID: <code>#{createdOrder.id.slice(-8)}</code>
                  </Alert>

                  <div className="mb-4">
                    <h6>Payment Summary</h6>
                    <Card className="border-primary">
                      <Card.Body>
                        <div className="row">
                          <div className="col-md-8">
                            <div>
                              <strong>Order ID:</strong> #
                              {createdOrder.id.slice(-8)}
                            </div>
                            <div>
                              <strong>Seller:</strong> {seller?.name}
                            </div>
                          </div>
                          <div className="col-md-4 text-md-end">
                            <div className="fs-4 text-success fw-bold">
                              ₹{total.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>

                  <div className="mb-4">
                    <h6>Choose How to Proceed</h6>

                    {/* Quick Place Order Option */}
                    <div className="mb-3">
                      <Card
                        className="border-primary"
                        style={{ cursor: "pointer" }}
                        onClick={handlePlaceOrderOnly}
                      >
                        <Card.Body>
                          <div className="row align-items-center">
                            <div className="col-md-2 text-center">
                              <i
                                className="ti-check-box text-primary"
                                style={{ fontSize: "2.5rem" }}
                              ></i>
                            </div>
                            <div className="col-md-8">
                              <h6 className="text-primary mb-1">
                                Place Order Now - Pay Later
                              </h6>
                              <p className="text-muted small mb-1">
                                Secure your order instantly. Pay when convenient
                                from order details.
                              </p>
                              <small className="text-primary">
                                <i className="ti-info-alt me-1"></i>
                                Quick checkout without payment hassle
                              </small>
                            </div>
                            <div className="col-md-2 text-center">
                              <Badge bg="primary">Quick & Easy</Badge>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>

                    {/* Direct Payment Options */}
                    <div className="text-center mb-3">
                      <small className="text-muted">
                        Or complete payment now:
                      </small>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <Card
                          className="border-success h-100"
                          style={{ cursor: "pointer" }}
                          onClick={handleUpiPayment}
                        >
                          <Card.Body className="text-center">
                            <i
                              className="ti-mobile text-success mb-3"
                              style={{ fontSize: "2.5rem" }}
                            ></i>
                            <h6 className="text-success">Pay with UPI</h6>
                            <p className="text-muted small mb-0">
                              Complete order with QR code payment
                            </p>
                            <Badge bg="success" className="mt-2">
                              Instant & Complete
                            </Badge>
                          </Card.Body>
                        </Card>
                      </div>

                      <div className="col-md-6">
                        <Card
                          className="border-warning h-100"
                          style={{ cursor: "pointer" }}
                          onClick={handleCodPayment}
                        >
                          <Card.Body className="text-center">
                            <i
                              className="ti-truck text-warning mb-3"
                              style={{ fontSize: "2.5rem" }}
                            ></i>
                            <h6 className="text-warning">Cash on Delivery</h6>
                            <p className="text-muted small mb-0">
                              Pay cash when order arrives
                            </p>
                            <Badge bg="warning" className="mt-2">
                              Order Complete
                            </Badge>
                          </Card.Body>
                        </Card>
                      </div>
                    </div>
                  </div>

                  <Alert variant="info" className="mb-0">
                    <i className="ti-info-alt me-2"></i>
                    <strong>Flexible Options:</strong> Place order now and pay
                    later for quick onboarding, or complete payment immediately
                    with UPI/COD for instant confirmation.
                  </Alert>
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" onClick={handleBackToDetails}>
                <i className="ti-arrow-left me-1"></i>
                Back to Details
              </Button>
              <Button variant="secondary" onClick={onHide}>
                Cancel
              </Button>
            </Modal.Footer>
          </div>
        )}
      </Modal>

      {/* UPI QR Payment Modal - Only show when main modal is also showing */}
      {createdOrder &&
        show &&
        (() => {
          console.log("🚨🚨🚨 CHECKOUT - UPI MODAL RENDER CHECK:", {
            createdOrder: !!createdOrder,
            showUpiPayment,
            mainModalShow: show,
            createdOrderId: createdOrder?.id,
            createdOrderTotal: createdOrder?.total_amount,
            createdOrderSellerId: createdOrder?.seller_id,
            willRenderUpiModal: show && createdOrder && showUpiPayment,
          });
          return true;
        })() && (
          <UpiQrPayment
            show={showUpiPayment}
            onHide={() => setShowUpiPayment(false)}
            orderData={(() => {
              console.log(
                "🚨🚨🚨 CHECKOUT SUPER DEBUG v4.0 - Building orderData for UPI component:",
                {
                  createdOrder,
                  total,
                  totalType: typeof total,
                  seller,
                  createdOrderTotalAmount: createdOrder?.total_amount,
                  passedTotal: total,
                  cartItems,
                  cartTotal: "calculated_below",
                }
              );

              // SUPER VISIBLE ALERT FOR DEBUGGING
              if (typeof window !== "undefined") {
                console.log(
                  "🔥🔥🔥 CHECKOUT ALERT: Building UPI data with total:",
                  total
                );
              }

              // Calculate the correct total from cart items as a fallback
              const calculatedTotal = cartItems.reduce((sum, item) => {
                const itemPrice =
                  item.price_per_unit || item.price || item.total_price;
                const itemQuantity = item.quantity || 1;
                const itemTotal = item.total_price || itemPrice * itemQuantity;

                console.log("🔍 CHECKOUT Cart item calculation:", {
                  item,
                  itemPrice,
                  itemQuantity,
                  itemTotal,
                });

                return sum + (itemTotal || 0);
              }, 0);

              console.log("🔍 CHECKOUT Amount calculation results:", {
                originalTotal: total,
                calculatedTotal,
                correctAmount: total || calculatedTotal,
              });

              const correctAmount = total || calculatedTotal;

              const finalOrderData = {
                ...createdOrder,
                total_amount: correctAmount, // Use the correct amount
                total: correctAmount, // Also set 'total' for compatibility
                seller_id: seller?.id,
              };

              console.log(
                "🔍 CHECKOUT - Final orderData being passed:",
                finalOrderData
              );
              return finalOrderData;
            })()}
            orderType="regular"
            onPaymentComplete={handlePaymentComplete}
          />
        )}
    </>
  );
}
