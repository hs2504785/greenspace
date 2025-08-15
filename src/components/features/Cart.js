"use client";

import { useState, useEffect } from "react";
import { Offcanvas, Button, ListGroup, Form } from "react-bootstrap";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useSession } from "next-auth/react";
import UserAvatar from "../common/UserAvatar";
import toast from "react-hot-toast";
import CheckoutForm from "./orders/CheckoutForm";

export default function Cart() {
  const [show, setShow] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

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
      toast.error(error, {
        duration: 4000,
      });
      clearError();
    }
  }, [error, clearError]);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleWhatsAppOrder = () => {
    console.log("Current Seller:", currentSeller);
    console.log("WhatsApp number:", currentSeller?.whatsapp_number);

    if (!currentSeller?.whatsapp_number) {
      toast.error("WhatsApp number not available for this seller");
      return;
    }

    // Remove any non-digit characters from the number
    const whatsappNumber = currentSeller.whatsapp_number.replace(/\D/g, "");

    // Format each item with bold product name
    const message = items
      .map(
        (item) =>
          `*${item.name}*\n` +
          `   • Quantity: ${item.quantity} ${item.unit || "kg"}\n` +
          `   • Price: ${
            item.price === 0 ? "FREE" : `₹${item.price}/${item.unit || "kg"}`
          }\n` +
          `   • Subtotal: ₹${item.total}`
      )
      .join("\n\n");

    // Add a divider line and total with bold
    const divider = "------------------------";
    const totalMessage = `\n${divider}\n*Total Amount: ₹${total}*`;

    // Compose the full message
    const fullMessage = `${message}${totalMessage}`;

    // Use the cleaned WhatsApp number
    window.open(
      `https://api.whatsapp.com/send/?phone=${whatsappNumber}&text=${encodeURIComponent(
        fullMessage
      )}&type=phone_number&app_absent=0`,
      "_blank"
    );
    toast.success("Opening WhatsApp to place your order");
    handleClose();
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
                            toast.error(
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
                        toast.error("Please sign in to place an order");
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
    </>
  );
}
