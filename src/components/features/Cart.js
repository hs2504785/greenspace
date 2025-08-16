"use client";

import { useState, useEffect } from "react";
import { Offcanvas, Button, ListGroup, Form } from "react-bootstrap";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useSession } from "next-auth/react";
import UserAvatar from "../common/UserAvatar";
import toastService from "@/utils/toastService";
import CheckoutForm from "./orders/CheckoutForm";
import GuestOrderForm from "../common/GuestOrderForm";
import {
  generateGuestOrderMessage,
  generateAuthenticatedOrderMessage,
} from "@/utils/whatsapp";

export default function Cart() {
  const [show, setShow] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestOrderLoading, setGuestOrderLoading] = useState(false);

  const {
    items,
    total,
    currentSeller,
    error,
    updateQuantity,
    removeFromCart,
    clearCart,
    clearError,
  } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleToggleCart = () => setShow((prev) => !prev);
      window.addEventListener("toggle-cart", handleToggleCart);
      return () => window.removeEventListener("toggle-cart", handleToggleCart);
    }
  }, []);

  // Show cart errors as toast messages
  useEffect(() => {
    if (error) {
      toastService.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleWhatsAppOrder = () => {
    console.log("Current Seller:", currentSeller);
    console.log("WhatsApp number:", currentSeller?.whatsapp_number);

    if (!currentSeller?.whatsapp_number) {
      toastService.error("WhatsApp number not available for this seller");
      return;
    }

    // Check if user is authenticated
    if (!session) {
      // Show guest form for anonymous users
      setShowGuestForm(true);
      return;
    }

    // For authenticated users, proceed directly
    sendWhatsAppMessage();
  };

  const sendWhatsAppMessage = (guestDetails = null) => {
    // Remove any non-digit characters from the number
    const whatsappNumber = currentSeller.whatsapp_number.replace(/\D/g, "");

    // Generate appropriate message based on user type
    let fullMessage;
    if (guestDetails) {
      fullMessage = generateGuestOrderMessage(
        items,
        total,
        guestDetails,
        currentSeller
      );
    } else if (session?.user) {
      fullMessage = generateAuthenticatedOrderMessage(
        items,
        total,
        session.user
      );
    } else {
      // Fallback for edge cases
      fullMessage = `🛒 *New Order Request*\n\n${items
        .map(
          (item) =>
            `*${item.name}* - ${item.quantity} ${item.unit || "kg"} - ₹${
              item.total
            }`
        )
        .join(
          "\n"
        )}\n\n*Total: ₹${total}*\n\n_Please contact customer for delivery details._`;
    }

    // Use the cleaned WhatsApp number
    window.open(
      `https://api.whatsapp.com/send/?phone=${whatsappNumber}&text=${encodeURIComponent(
        fullMessage
      )}&type=phone_number&app_absent=0`,
      "_blank"
    );
    toastService.success("Opening WhatsApp to place your order");
    handleClose();
  };

  const handleGuestOrderSubmit = async (guestDetails) => {
    setGuestOrderLoading(true);

    try {
      // Create guest order record for seller's reference
      const guestOrderData = {
        guestDetails,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          unit: item.unit,
        })),
        total,
        seller: currentSeller,
        timestamp: new Date().toISOString(),
      };

      // Save guest order (we'll create this API endpoint)
      const response = await fetch("/api/orders/guest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(guestOrderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save guest order");
      }

      // Show warning if database storage failed but allow WhatsApp order
      if (result.warning) {
        console.warn("Guest order warning:", result.warning);
        toastService.warning(result.warning);
      } else {
        toastService.success("Order details saved successfully");
      }

      // Send WhatsApp message with guest details
      sendWhatsAppMessage(guestDetails);
      setShowGuestForm(false);

      // Clear cart and redirect to guest order page
      clearCart();
      handleClose();

      // Redirect to guest order page if we have an order ID
      if (result.guestOrder?.id) {
        router.push(`/orders/guest/${result.guestOrder.id}`);
      }
    } catch (error) {
      console.error("Error saving guest order:", error);
      // Still proceed with WhatsApp message even if saving fails
      toastService.warning(
        "Proceeding with WhatsApp order. Order details might not be saved."
      );
      sendWhatsAppMessage(guestDetails);
      setShowGuestForm(false);

      // Clear cart and close even if order saving fails
      clearCart();
      handleClose();

      // Show a message to the user about the situation
      setTimeout(() => {
        toastService.info(
          "Your order was sent via WhatsApp, but order tracking may not be available.",
          { duration: 5000 }
        );
      }, 1000);
    } finally {
      setGuestOrderLoading(false);
    }
  };

  const handleRemoveItem = (id, name) => {
    removeFromCart(id);
    toast(`Removed ${name} from cart`, {
      icon: "🗑️",
    });
  };

  const handleClearCart = () => {
    clearCart();
    toast("Cart cleared", {
      icon: "🗑️",
    });
    handleClose();
  };

  return (
    <>
      <Offcanvas show={show} onHide={handleClose} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Shopping Cart</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {currentSeller && (
            <div className="mb-3 p-3 bg-light rounded">
              <div className="d-flex align-items-center">
                <UserAvatar user={currentSeller} size={32} className="me-2" />
                <div>
                  <div className="fw-semibold">{currentSeller.name}</div>
                  <div className="text-muted small">
                    Your cart items are from this seller
                  </div>
                </div>
              </div>
            </div>
          )}

          {items.length > 0 ? (
            <>
              <ListGroup variant="flush">
                {items.map((item) => (
                  <ListGroup.Item key={item.id} className="py-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="fw-semibold">{item.name}</div>
                      <Button
                        variant="link"
                        className="text-danger p-0"
                        onClick={() => handleRemoveItem(item.id, item.name)}
                      >
                        <i className="ti-close"></i>
                      </Button>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <Form.Control
                        type="number"
                        min="1"
                        max={item.availableQuantity || 1}
                        value={item.quantity}
                        onChange={(e) => {
                          const newQuantity = parseInt(e.target.value);
                          const maxAllowed = item.availableQuantity || 1;

                          if (isNaN(newQuantity) || newQuantity < 1) {
                            return;
                          }

                          if (newQuantity > maxAllowed) {
                            toastService.error(
                              `Maximum ${maxAllowed} ${
                                item.unit || "kg"
                              } available for this item`
                            );
                            return;
                          }

                          clearError(); // Clear any previous errors
                          updateQuantity(item.id, newQuantity);
                        }}
                        style={{ width: "80px" }}
                        title={
                          item.price === 0
                            ? undefined
                            : `Maximum ${item.availableQuantity || 1} ${
                                item.unit || "kg"
                              } available`
                        }
                      />
                      <div className="text-end">
                        <div>
                          {item.price === 0 ? (
                            <span className="text-success fw-semibold">
                              🎁 FREE
                            </span>
                          ) : (
                            `₹${item.price}/${item.unit || "kg"}`
                          )}
                        </div>
                        <div className="fw-bold">₹{item.total}</div>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>

              <div className="border-top mt-3 pt-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="fs-5">Total</div>
                  <div className="fs-4 fw-bold">₹{total}</div>
                </div>

                <div className="d-grid gap-2">
                  <Button
                    variant="success"
                    size="lg"
                    onClick={() => {
                      if (!session) {
                        toastService.error("Please sign in to place an order");
                        router.push("/login");
                        return;
                      }
                      setShowCheckout(true);
                    }}
                  >
                    <i className="ti-shopping-cart-full me-2"></i>
                    Proceed to Checkout
                  </Button>
                  <Button
                    variant="outline-success"
                    onClick={handleWhatsAppOrder}
                  >
                    <i className="ti-comment me-2"></i>
                    Order via WhatsApp
                  </Button>
                  <Button variant="outline-danger" onClick={handleClearCart}>
                    Clear Cart
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-muted py-5">
              <i className="ti-shopping-cart display-1 mb-3"></i>
              <p>Your cart is empty</p>
            </div>
          )}
        </Offcanvas.Body>
      </Offcanvas>

      <CheckoutForm
        show={showCheckout}
        onHide={() => setShowCheckout(false)}
        cartItems={items}
        seller={currentSeller}
        total={total}
        onSuccess={(order) => {
          clearCart();
          setShow(false); // Close the cart Offcanvas
          setShowCheckout(false); // Close the checkout modal
          router.push(`/orders/${order.id}`);
        }}
      />

      <GuestOrderForm
        show={showGuestForm}
        onHide={() => setShowGuestForm(false)}
        onSubmit={handleGuestOrderSubmit}
        loading={guestOrderLoading}
      />
    </>
  );
}
