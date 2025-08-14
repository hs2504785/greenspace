"use client";

import { Card, Button, Form } from "react-bootstrap";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import ImagePlaceholder from "../common/ImagePlaceholder";
import { useCart } from "@/context/CartContext";

export default function VegetableCard({
  id,
  name,
  images,
  price,
  owner,
  owner_id,
  location,
  quantity,
  unit = "kg", // default unit is kg
}) {
  const [imageError, setImageError] = useState(false);
  const { addToCart, items, updateQuantity, removeFromCart } = useCart();
  const imageUrl = images?.[0] || "";

  // Check if item is already in cart
  const cartItem = items.find((item) => item.id === id);
  const [itemQuantity, setItemQuantity] = useState(cartItem?.quantity || 1);

  const isOutOfStock = !quantity || quantity <= 0;
  const maxQuantity = unit === "kg" ? quantity : Math.floor(quantity);

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= maxQuantity) {
      setItemQuantity(value);
    }
  };

  const handleQuantityUpdate = (newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(id);
      setItemQuantity(1); // Reset to 1 for next time
    } else if (newQuantity <= maxQuantity) {
      setItemQuantity(newQuantity);
      if (cartItem) {
        updateQuantity(id, newQuantity);
      }
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault(); // Prevent link navigation
    if (!cartItem) {
      addToCart({
        id,
        name,
        price,
        quantity: 1,
        unit,
        image: imageUrl,
        owner: {
          id: owner?.id || owner_id,
          name: owner?.name || "Seller",
          location: owner?.location || location,
          whatsapp_number: owner?.whatsapp_number,
        },
      });
    }
  };

  return (
    <Card className="border-0 bg-white">
      <Link href={`/vegetables/${id}`} className="text-decoration-none">
        <div style={{ position: "relative", height: "160px" }}>
          {imageError || !imageUrl ? (
            <ImagePlaceholder />
          ) : (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              style={{ objectFit: "contain" }}
              onError={() => setImageError(true)}
              priority={false}
              loading="lazy"
            />
          )}
        </div>
      </Link>

      <div className="px-3 pb-3 pt-2">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h3 className="h5 mb-1">{name}</h3>
            <div
              className="d-flex align-items-center justify-content-between"
              style={{ fontSize: "0.85rem" }}
            >
              <div
                className="text-muted text-truncate"
                style={{ maxWidth: "45%" }}
              >
                <i className="ti-user me-1"></i>
                {owner?.name || "Seller"}
              </div>
              <div
                className="text-muted text-truncate"
                style={{ maxWidth: "45%" }}
              >
                <i className="ti-location-pin me-1"></i>
                {location}
              </div>
            </div>
          </div>
          <div
            className="px-2 py-1 rounded ms-2"
            style={{
              backgroundColor: "#f8f9fa",
              color: "#198754",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            ₹{Number(price).toFixed(2)}
          </div>
        </div>

        <div className="text-muted mb-2" style={{ fontSize: "0.85rem" }}>
          {maxQuantity} {unit} • {unit === "kg" ? "500 g" : "1 Pc"}
        </div>

        <div>
          {isOutOfStock ? (
            <Button variant="outline-danger" disabled className="w-100">
              Out of Stock
            </Button>
          ) : cartItem ? (
            <div className="d-flex align-items-center gap-2">
              <div className="d-flex border rounded-1">
                <Button
                  variant="white"
                  className="border-0 px-3"
                  onClick={(e) => {
                    e.preventDefault();
                    handleQuantityUpdate(itemQuantity - 1);
                  }}
                >
                  −
                </Button>
                <div className="px-3 d-flex align-items-center border-start border-end">
                  {itemQuantity}
                </div>
                <Button
                  variant="white"
                  className="border-0 px-3"
                  onClick={(e) => {
                    e.preventDefault();
                    handleQuantityUpdate(itemQuantity + 1);
                  }}
                >
                  +
                </Button>
              </div>
            </div>
          ) : (
            <Button
              className="w-100 rounded-pill text-white border-0"
              style={{ backgroundColor: "#44b700" }}
              onClick={handleAddToCart}
            >
              Add
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
