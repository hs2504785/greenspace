"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Button,
  Alert,
  Card,
  Badge,
  Spinner,
} from "react-bootstrap";
import { useSession } from "next-auth/react";
import toastService from "@/utils/toastService";
import OrderService from "@/services/OrderService";
import UpiQrPayment from "@/components/features/payments/UpiQrPayment";
import LocationAutoDetect from "@/components/common/LocationAutoDetect";
import UserAvatar from "@/components/common/UserAvatar";

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
  const [checkoutStep, setCheckoutStep] = useState("details"); // "details" or "payment"
  const [createdOrder, setCreatedOrder] = useState(null);
  const [showUpiPayment, setShowUpiPayment] = useState(false);
  const [formData, setFormData] = useState({
    deliveryAddress: "",
    contactNumber: "",
    guestName: "",
  });

  // Auto-fill user data when component mounts or session changes
  useEffect(() => {
    const fetchAndFillUserData = async () => {
      if (session?.user && show) {
        // Try to get fresh profile data from API
        try {
          const response = await fetch("/api/users/profile");
          if (response.ok) {
            const data = await response.json();

            setFormData((prev) => ({
              deliveryAddress:
                prev.deliveryAddress ||
                data.user?.location ||
                session.user.location ||
                "",
              contactNumber:
                prev.contactNumber ||
                data.user?.whatsapp_number ||
                session.user.phone ||
                session.user.whatsappNumber ||
                session.user.whatsapp_number ||
                "",
            }));
          } else {
            // Fallback to session data
            setFormData((prev) => ({
              deliveryAddress:
                prev.deliveryAddress || session.user.location || "",
              contactNumber:
                prev.contactNumber ||
                session.user.phone ||
                session.user.whatsappNumber ||
                session.user.whatsapp_number ||
                "",
            }));
          }
        } catch (error) {
          console.error("Error fetching profile data:", error);
          // Fallback to session data
          setFormData((prev) => ({
            deliveryAddress:
              prev.deliveryAddress || session.user.location || "",
            contactNumber:
              prev.contactNumber ||
              session.user.phone ||
              session.user.whatsappNumber ||
              session.user.whatsapp_number ||
              "",
          }));
        }
      }
    };

    fetchAndFillUserData();
  }, [session, show]);

  // Check if form is complete for enabling payment buttons
  const isFormComplete = () => {
    const basicFieldsComplete =
      formData.deliveryAddress.trim() !== "" &&
      formData.contactNumber.trim() !== "" &&
      /^[0-9]{10}$/.test(formData.contactNumber.replace(/\s+/g, ""));

    // For guest users, also require name
    if (!session?.user?.id) {
      return basicFieldsComplete && formData.guestName.trim() !== "";
    }

    return basicFieldsComplete;
  };

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
      console.log("Session state:", {
        isAuthenticated: !!session,
        user: session?.user,
        id: session?.user?.id,
      });

      let order;

      if (session?.user?.id) {
        // Authenticated user flow
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

        console.log("Submitting authenticated order:", orderData);
        order = await OrderService.createOrder(orderData);
        toastService.success(
          "Order placed successfully! Redirecting to order details..."
        );
      } else {
        // Guest user flow
        const guestOrderData = {
          guestDetails: {
            name: formData.guestName,
            phone: formData.contactNumber,
            email: "", // Optional for guest
            address: formData.deliveryAddress,
          },
          items: cartItems.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
            unit: item.unit || "kg",
          })),
          total,
          seller: seller,
          timestamp: new Date().toISOString(),
        };

        console.log("Submitting guest order:", guestOrderData);

        const response = await fetch("/api/orders/guest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(guestOrderData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to create guest order");
        }

        order = result.guestOrder;
        toastService.success(
          "Order placed successfully! Order details sent via WhatsApp."
        );
      }

      // Dispatch event to refresh orders lists
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("order-created"));
      }

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
      // Check if we already have a created order, if so, just proceed to payment
      if (createdOrder) {
        setCheckoutStep("payment");
        setLoading(false);
        return;
      }

      let order;

      if (session?.user?.id) {
        // Authenticated user flow
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

        order = await OrderService.createOrder(orderData);
      } else {
        // Guest user flow
        const guestOrderData = {
          guestDetails: {
            name: formData.guestName,
            phone: formData.contactNumber,
            email: "", // Optional for guest
            address: formData.deliveryAddress,
          },
          items: cartItems.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
            unit: item.unit || "kg",
          })),
          total,
          seller: seller,
          timestamp: new Date().toISOString(),
        };

        const response = await fetch("/api/orders/guest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(guestOrderData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to create guest order");
        }

        order = result.guestOrder;
      }

      setCreatedOrder(order);
      setCheckoutStep("payment");
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

  const handlePlaceOrderOnly = async () => {
    setLoading(true);
    try {
      let order;

      if (session?.user?.id) {
        // Authenticated user flow
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

        order = await OrderService.createOrder(orderData);
        toastService.success(
          total === 0
            ? "Fair share item claimed successfully!"
            : "Order placed successfully! You can pay anytime from order details."
        );
      } else {
        // Guest user flow
        const guestOrderData = {
          guestDetails: {
            name: formData.guestName,
            phone: formData.contactNumber,
            email: "", // Optional for guest
            address: formData.deliveryAddress,
          },
          items: cartItems.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
            unit: item.unit || "kg",
          })),
          total,
          seller: seller,
          timestamp: new Date().toISOString(),
        };

        const response = await fetch("/api/orders/guest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(guestOrderData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to create guest order");
        }

        order = result.guestOrder;
        toastService.success(
          "Order placed successfully! Order details sent via WhatsApp."
        );
      }

      // Dispatch event to refresh orders lists
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("order-created"));
      }

      onSuccess(order);
      onHide();
      resetState();
    } catch (error) {
      console.error("Error placing order:", error);
      toastService.presets.orderError();
    } finally {
      setLoading(false);
    }
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
      setFormData({ deliveryAddress: "", contactNumber: "", guestName: "" });
    }, 100);
  };

  const handleModalHide = () => {
    onHide();
    // Only reset state if order was not successfully completed
    if (checkoutStep === "details" || !createdOrder) {
      resetState();
    }
  };

  return (
    <>
      <Modal
        show={show}
        onHide={handleModalHide}
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

              {/* Guest Name Field - Only show for non-authenticated users */}
              {!session?.user?.id && (
                <div className="row mb-3">
                  <div className="col-12">
                    <Form.Group>
                      <Form.Label>
                        Your Name <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="guestName"
                        value={formData.guestName}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter your full name"
                        isInvalid={
                          formData.guestName.trim() === "" &&
                          formData.contactNumber.trim() !== ""
                        }
                        isValid={formData.guestName.trim() !== ""}
                      />
                      <Form.Control.Feedback type="invalid">
                        Please enter your name
                      </Form.Control.Feedback>
                      <Form.Control.Feedback type="valid">
                        Name looks good!
                      </Form.Control.Feedback>
                    </Form.Group>
                  </div>
                </div>
              )}

              <div className="row">
                <div className="col-md-8">
                  <LocationAutoDetect
                    name="deliveryAddress"
                    value={formData.deliveryAddress}
                    onChange={handleInputChange}
                    placeholder="Enter delivery address or click 'Detect' to auto-fill"
                    required
                    label="Quick Delivery Address"
                    showRequiredIndicator
                    className="mb-3"
                  />
                </div>
                <div className="col-md-4">
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Contact Number <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="tel"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleInputChange}
                      required
                      placeholder="10-digit number"
                      pattern="[0-9]{10}"
                      isInvalid={
                        formData.contactNumber.trim() !== "" &&
                        !/^[0-9]{10}$/.test(
                          formData.contactNumber.replace(/\s+/g, "")
                        )
                      }
                      isValid={
                        formData.contactNumber.trim() !== "" &&
                        /^[0-9]{10}$/.test(
                          formData.contactNumber.replace(/\s+/g, "")
                        )
                      }
                    />
                    {formData.contactNumber.trim() !== "" && (
                      <>
                        <Form.Control.Feedback type="invalid">
                          Please enter a valid 10-digit phone number
                        </Form.Control.Feedback>
                        <Form.Control.Feedback type="valid">
                          Contact number looks good!
                        </Form.Control.Feedback>
                      </>
                    )}
                  </Form.Group>
                </div>
              </div>

              <div className="mt-4">
                <h6 className="mb-3 text-primary">
                  {total === 0
                    ? "Complete Your Order"
                    : "Choose Your Checkout Option"}
                </h6>

                <div className="row g-3">
                  {/* Option 1: Place Order Only */}
                  <div className="col-12">
                    <Card
                      className={`border-0 shadow-sm ${
                        isFormComplete()
                          ? "hover-shadow cursor-pointer"
                          : "opacity-50"
                      }`}
                      onClick={
                        isFormComplete() ? handlePlaceOrderOnly : undefined
                      }
                      style={{
                        cursor: isFormComplete() ? "pointer" : "not-allowed",
                      }}
                    >
                      <Card.Body className="p-3">
                        <div className="d-flex align-items-center">
                          <div className="me-3">
                            <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                              <i className="ti-package text-primary"></i>
                            </div>
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-1">
                              {total === 0
                                ? "Place Order Now"
                                : "Place Order Now - Pay Later"}
                            </h6>
                            <p className="text-muted mb-0 small">
                              {total === 0
                                ? "Claim your fair share item now"
                                : "Place your order now and pay conveniently later"}
                            </p>
                          </div>
                          <div className="ms-2">
                            <Badge
                              bg="primary"
                              className="bg-opacity-10 text-primary"
                            >
                              Recommended
                            </Badge>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>

                  {/* Option 2: Proceed to Payment - Hide for free items */}
                  {total > 0 && (
                    <div className="col-12">
                      <Card
                        className={`border-0 shadow-sm ${
                          isFormComplete()
                            ? "hover-shadow cursor-pointer"
                            : "opacity-50"
                        }`}
                        onClick={
                          isFormComplete() ? handleProceedToPayment : undefined
                        }
                        style={{
                          cursor: isFormComplete() ? "pointer" : "not-allowed",
                        }}
                      >
                        <Card.Body className="p-3">
                          <div className="d-flex align-items-center">
                            <div className="me-3">
                              <div className="bg-success bg-opacity-10 rounded-circle p-2">
                                <i className="ti-credit-card text-success"></i>
                              </div>
                            </div>
                            <div className="flex-grow-1">
                              <h6 className="mb-1">Pay Now</h6>
                              <p className="text-muted mb-0 small">
                                Proceed to payment immediately
                              </p>
                            </div>
                            {loading && (
                              <div className="ms-2">
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                  role="status"
                                  aria-hidden="true"
                                />
                              </div>
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  )}
                </div>
              </div>

              {/* Seller Information - Moved to bottom */}
              <div className="mt-4 pt-3 border-top">
                <h6 className="mb-3 text-muted">About Your Seller</h6>
                <Card className="border-0 bg-light">
                  <Card.Body className="p-3">
                    <div className="d-flex align-items-center">
                      <div className="me-3">
                        <UserAvatar
                          user={{
                            name: seller?.name,
                            image: seller?.avatar_url,
                          }}
                          size={48}
                        />
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-semibold mb-1 d-flex align-items-center">
                          {seller?.name || "Unknown Seller"}
                          <Badge bg="success" className="ms-2 small">
                            <i className="ti-check me-1"></i>
                            Verified
                          </Badge>
                        </div>
                        <div className="text-muted small d-flex align-items-center">
                          <i className="ti-leaf me-1"></i>
                          Natural Farming Specialist
                        </div>
                        {seller?.business_name && (
                          <div className="text-muted small">
                            <i className="ti-building me-1"></i>
                            {seller.business_name}
                          </div>
                        )}
                        {seller?.average_rating && (
                          <div className="text-muted small d-flex align-items-center">
                            <i className="ti-star-filled text-warning me-1"></i>
                            {seller.average_rating.toFixed(1)} rating
                          </div>
                        )}
                      </div>
                      <div className="ms-2">
                        {seller?.location && (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => {
                              let mapUrl;
                              if (seller.location.startsWith("http")) {
                                // If it's already a URL, use it directly
                                mapUrl = seller.location;
                              } else {
                                // If it's text, create a Google Maps search URL
                                mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                  seller.location
                                )}`;
                              }
                              window.open(mapUrl, "_blank");
                            }}
                            className="d-flex align-items-center"
                          >
                            <i className="ti-map-pin me-1"></i>
                            View on Map
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </Modal.Body>
          </Form>
        ) : (
          <div>
            <Modal.Body>
              {createdOrder && (
                <>
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

                    {/* Primary Payment Options */}
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <Card
                          className="border-success h-100 shadow-sm"
                          style={{ cursor: "pointer" }}
                          onClick={handleUpiPayment}
                        >
                          <Card.Body className="text-center p-4">
                            <div className="d-flex justify-content-center align-items-center mb-3">
                              <img
                                src="/images/gpay.svg"
                                alt="Google Pay"
                                width="32"
                                height="32"
                                className="me-2"
                              />
                              <img
                                src="/images/bhim.svg"
                                alt="BHIM UPI"
                                width="32"
                                height="32"
                                className="me-2"
                              />
                              <i
                                className="ti-qrcode text-success"
                                style={{ fontSize: "2rem" }}
                              ></i>
                            </div>
                            <h6 className="text-success mb-2">UPI Payment</h6>
                            <p className="text-muted small mb-2">
                              GPay, BHIM, PhonePe & QR code
                            </p>
                            <Badge bg="success" className="mt-1">
                              Instant & Complete
                            </Badge>
                          </Card.Body>
                        </Card>
                      </div>

                      <div className="col-md-6">
                        <Card
                          className="border-warning h-100 shadow-sm"
                          style={{ cursor: "pointer" }}
                          onClick={handleCodPayment}
                        >
                          <Card.Body className="text-center p-4">
                            <i
                              className="ti-truck text-warning mb-3"
                              style={{ fontSize: "2.5rem" }}
                            ></i>
                            <h6 className="text-warning mb-2">
                              Cash on Delivery
                            </h6>
                            <p className="text-muted small mb-2">
                              Pay cash when order arrives
                            </p>
                            <Badge bg="warning" className="mt-1">
                              Order Complete
                            </Badge>
                          </Card.Body>
                        </Card>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="outline-secondary"
                onClick={handleBackToDetails}
                className="text-decoration-none border-0"
              >
                <i className="ti-arrow-left me-1"></i>
                Back to Details
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
