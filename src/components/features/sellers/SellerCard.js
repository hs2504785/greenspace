/**
 * SellerCard Component
 * Displays seller information in a card format with distance and contact options
 */

import React from "react";
import Link from "next/link";

const SellerCard = ({
  seller,
  showDistance = true,
  showProducts = true,
  onContactClick = null,
  className = "",
}) => {
  const formatDistance = (distanceKm) => {
    if (!distanceKm) return null;
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    }
    return `${distanceKm}km`;
  };

  const handleWhatsAppContact = (whatsappNumber, sellerName) => {
    const message = encodeURIComponent(
      `Hi ${sellerName}, I found your fresh produce on Greenspace and I'm interested in your products. Can we discuss?`
    );
    const whatsappUrl = `https://wa.me/91${whatsappNumber.replace(
      /\D/g,
      ""
    )}?text=${message}`;
    window.open(whatsappUrl, "_blank");

    if (onContactClick) {
      onContactClick("whatsapp", seller);
    }
  };

  const handlePhoneContact = (phoneNumber) => {
    window.open(`tel:${phoneNumber}`, "_self");

    if (onContactClick) {
      onContactClick("phone", seller);
    }
  };

  return (
    <div className={`card seller-card h-100 ${className}`}>
      <div className="card-body d-flex flex-column">
        {/* Header with seller info and distance */}
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="flex-grow-1">
            <h5 className="card-title mb-1 fw-bold text-success">
              {seller.seller_name || seller.name}
            </h5>

            <div className="d-flex flex-wrap gap-2 mb-2">
              {showDistance && seller.distance_km && (
                <span className="badge bg-primary">
                  <i className="ti-location-pin me-1"></i>
                  {formatDistance(seller.distance_km)}
                </span>
              )}

              {showProducts &&
                (seller.product_count || seller.product_count === 0) && (
                  <span className="badge bg-success">
                    <i className="ti-package me-1"></i>
                    {seller.product_count}{" "}
                    {seller.product_count === 1 ? "Product" : "Products"}
                  </span>
                )}
            </div>

            {/* Location information */}
            <div className="text-muted small mb-2">
              <i className="ti-map-alt me-1"></i>
              {seller.seller_city || seller.city ? (
                <>
                  {seller.seller_city || seller.city}
                  {(seller.seller_address || seller.address) &&
                    `, ${
                      (seller.seller_address || seller.address).split(",")[0]
                    }`}
                </>
              ) : (
                seller.seller_address ||
                seller.address ||
                "Location not specified"
              )}
            </div>
          </div>
        </div>

        {/* Contact buttons */}
        <div className="mt-auto">
          <div className="d-flex gap-2 mb-3">
            {(seller.seller_whatsapp || seller.whatsapp_number) && (
              <button
                className="btn btn-success btn-sm flex-fill"
                onClick={() =>
                  handleWhatsAppContact(
                    seller.seller_whatsapp || seller.whatsapp_number,
                    seller.seller_name || seller.name
                  )
                }
                title="Contact via WhatsApp"
              >
                <i className="ti-brand-whatsapp me-1"></i>
                WhatsApp
              </button>
            )}

            {(seller.seller_phone || seller.phone) && (
              <button
                className="btn btn-outline-primary btn-sm flex-fill"
                onClick={() =>
                  handlePhoneContact(seller.seller_phone || seller.phone)
                }
                title="Call seller"
              >
                <i className="ti-phone me-1"></i>
                Call
              </button>
            )}
          </div>

          {/* View products button */}
          <Link
            href={`/sellers/${seller.seller_id || seller.id}`}
            className="btn btn-primary w-100"
          >
            <i className="ti-eye me-1"></i>
            View Products
          </Link>
        </div>
      </div>

      {/* Optional seller rating/reviews section - placeholder for future implementation */}
      {seller.rating && (
        <div className="card-footer bg-light">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <span className="text-warning me-1">
                {"★".repeat(Math.floor(seller.rating))}
                {"☆".repeat(5 - Math.floor(seller.rating))}
              </span>
              <span className="small text-muted">
                ({seller.review_count || 0} reviews)
              </span>
            </div>
            <small className="text-muted">
              Member since {new Date(seller.created_at).getFullYear()}
            </small>
          </div>
        </div>
      )}
    </div>
  );
};

// Skeleton loader component for loading state
export const SellerCardSkeleton = ({ count = 3 }) => {
  return (
    <>
      {Array(count)
        .fill(0)
        .map((_, index) => (
          <div key={index} className="card seller-card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="flex-grow-1">
                  <div className="placeholder-glow">
                    <div className="placeholder col-6 mb-2"></div>
                    <div className="d-flex gap-2 mb-2">
                      <div className="placeholder col-3"></div>
                      <div className="placeholder col-4"></div>
                    </div>
                    <div className="placeholder col-8"></div>
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                <div className="d-flex gap-2 mb-3">
                  <div className="placeholder-glow flex-fill">
                    <div className="placeholder btn btn-sm w-100"></div>
                  </div>
                  <div className="placeholder-glow flex-fill">
                    <div className="placeholder btn btn-sm w-100"></div>
                  </div>
                </div>
                <div className="placeholder-glow">
                  <div className="placeholder btn w-100"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
    </>
  );
};

export default SellerCard;
