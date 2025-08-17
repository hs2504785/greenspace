"use client";

/**
 * Individual Seller Page
 * Shows detailed view of a seller with their products
 */

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import VegetableCard from "../../../components/features/VegetableCard";

const SellerPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const sellerId = params.id;

  // State management
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [error, setError] = useState(null);

  // Get user location from URL params if available
  useEffect(() => {
    const lat = searchParams.get("userLat");
    const lng = searchParams.get("userLng");

    if (lat && lng) {
      setUserLocation({
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
      });
    }
  }, [searchParams]);

  // Load seller data on mount
  useEffect(() => {
    if (sellerId) {
      loadSellerData();
    }
  }, [sellerId, userLocation]);

  // Load seller and their products
  const loadSellerData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let url = `/api/sellers/${sellerId}`;

      // Add user location for distance calculation
      if (userLocation) {
        url += `?userLatitude=${userLocation.latitude}&userLongitude=${userLocation.longitude}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setSeller(data.data.seller);
        setProducts(data.data.products);
      } else {
        throw new Error(data.error || "Failed to load seller data");
      }
    } catch (error) {
      console.error("Error loading seller:", error);
      setError(error.message);
      toast.error("Failed to load seller information");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle WhatsApp contact
  const handleWhatsAppContact = () => {
    if (!seller.whatsapp_number) return;

    const message = encodeURIComponent(
      `Hi ${seller.name}, I found your fresh produce on Greenspace and I'm interested in your products. Can we discuss?`
    );
    const whatsappUrl = `https://wa.me/91${seller.whatsapp_number.replace(
      /\D/g,
      ""
    )}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  // Handle phone call
  const handlePhoneCall = () => {
    if (!seller.phone) return;
    window.open(`tel:${seller.phone}`, "_self");
  };

  // Get unique categories from products
  const categories = [
    "all",
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];

  // Filter and sort products
  const filteredProducts = products
    .filter(
      (product) =>
        selectedCategory === "all" || product.category === selectedCategory
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price_low":
          return a.price - b.price;
        case "price_high":
          return b.price - a.price;
        case "newest":
          return new Date(b.created_at) - new Date(a.created_at);
        case "quantity":
          return b.quantity - a.quantity;
        default:
          return 0;
      }
    });

  // Format distance
  const formatDistance = (distanceKm) => {
    if (!distanceKm) return null;
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m away`;
    }
    return `${distanceKm}km away`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container py-4">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-center py-5">
              <div className="text-center">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted">Loading seller information...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !seller) {
    return (
      <div className="container py-4">
        <div className="row">
          <div className="col-12">
            <div className="text-center py-5">
              <i className="ti-alert-circle display-4 text-danger d-block mb-3"></i>
              <h4>Seller Not Found</h4>
              <p className="text-muted mb-4">
                {error ||
                  "The seller you are looking for does not exist or may have been removed."}
              </p>
              <Link href="/nearby-sellers" className="btn btn-primary">
                <i className="ti-arrow-left me-2"></i>
                Back to Nearby Sellers
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row">
        {/* Breadcrumb */}
        <div className="col-12 mb-3">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link href="/">Home</Link>
              </li>
              <li className="breadcrumb-item">
                <Link href="/nearby-sellers">Nearby Sellers</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                {seller.name}
              </li>
            </ol>
          </nav>
        </div>

        {/* Seller Information Card */}
        <div className="col-12 mb-4">
          <div className="card seller-profile-card">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <div className="d-flex align-items-start">
                    {/* Seller Avatar */}
                    <div className="seller-avatar me-3">
                      {seller.avatar_url ? (
                        <img
                          src={seller.avatar_url}
                          alt={seller.name}
                          className="rounded-circle"
                          style={{
                            width: "80px",
                            height: "80px",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          className="bg-success rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                          style={{
                            width: "80px",
                            height: "80px",
                            fontSize: "2rem",
                          }}
                        >
                          {seller.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Seller Details */}
                    <div className="flex-grow-1">
                      <h2 className="mb-2 text-success fw-bold">
                        {seller.name}
                      </h2>

                      <div className="d-flex flex-wrap gap-3 mb-2">
                        {seller.distance_km && (
                          <span className="badge bg-primary">
                            <i className="ti-location-pin me-1"></i>
                            {formatDistance(seller.distance_km)}
                          </span>
                        )}

                        <span className="badge bg-success">
                          <i className="ti-package me-1"></i>
                          {products.length}{" "}
                          {products.length === 1 ? "Product" : "Products"}
                        </span>

                        <span className="badge bg-info">
                          <i className="ti-calendar me-1"></i>
                          Member since{" "}
                          {new Date(seller.created_at).getFullYear()}
                        </span>
                      </div>

                      {/* Location */}
                      {(seller.address || seller.city) && (
                        <div className="text-muted mb-2">
                          <i className="ti-map-alt me-1"></i>
                          {seller.address || `${seller.city}, ${seller.state}`}
                        </div>
                      )}

                      {/* Email (if available) */}
                      {seller.email && (
                        <div className="text-muted">
                          <i className="ti-email me-1"></i>
                          {seller.email}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="col-md-4 text-md-end mt-3 mt-md-0">
                  <div className="d-flex flex-column gap-2">
                    {seller.whatsapp_number && (
                      <button
                        className="btn btn-success"
                        onClick={handleWhatsAppContact}
                      >
                        <i className="ti-brand-whatsapp me-2"></i>
                        WhatsApp
                      </button>
                    )}

                    {seller.phone && (
                      <button
                        className="btn btn-outline-primary"
                        onClick={handlePhoneCall}
                      >
                        <i className="ti-phone me-2"></i>
                        Call {seller.phone}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="col-12">
          {/* Section Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="mb-0">
              <i className="ti-package text-success me-2"></i>
              Available Products
            </h3>

            {products.length > 0 && (
              <div className="d-flex gap-2">
                {/* Category Filter */}
                <select
                  className="form-select form-select-sm"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{ width: "auto" }}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </option>
                  ))}
                </select>

                {/* Sort Options */}
                <select
                  className="form-select form-select-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ width: "auto" }}
                >
                  <option value="name">Sort by Name</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                  <option value="quantity">Most Available</option>
                </select>
              </div>
            )}
          </div>

          {/* Products Grid */}
          {products.length > 0 ? (
            filteredProducts.length > 0 ? (
              <div className="row g-4">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="col-md-6 col-lg-4">
                    <VegetableCard vegetable={product} showSeller={false} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <i className="ti-package display-4 text-muted d-block mb-3"></i>
                <h5>No products found in {selectedCategory} category</h5>
                <p className="text-muted">Try selecting a different category</p>
              </div>
            )
          ) : (
            <div className="text-center py-5">
              <i className="ti-package display-4 text-muted d-block mb-3"></i>
              <h4>No Products Available</h4>
              <p className="text-muted mb-4">
                This seller doesn't have any products listed currently.
              </p>
              <Link href="/nearby-sellers" className="btn btn-primary">
                <i className="ti-search me-2"></i>
                Find Other Sellers
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerPage;
