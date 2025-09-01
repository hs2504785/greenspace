"use client";

import { useState, useEffect } from "react";
import { Card, Badge, ProgressBar, Alert, Button } from "react-bootstrap";
import { useSession } from "next-auth/react";

export default function ListingLimitsCard({ className = "" }) {
  const { data: session } = useSession();
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetchLimits();
    }
  }, [session]);

  const fetchLimits = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/users/listing-limits");
      if (!response.ok) throw new Error("Failed to fetch limits");

      const result = await response.json();
      setLimits(result.data);
    } catch (error) {
      console.error("Error fetching listing limits:", error);
      setError("Failed to load listing information");
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  if (loading) {
    return (
      <Card className={className}>
        <Card.Body className="text-center py-4">
          <div
            className="spinner-border spinner-border-sm text-primary"
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted small mt-2 mb-0">Loading limits...</p>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <Card.Body>
          <Alert variant="warning" className="mb-0">
            <small>{error}</small>
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  if (!limits) return null;

  const usagePercentage =
    limits.maxAllowed === Infinity
      ? 0
      : (limits.totalProducts / limits.maxAllowed) * 100;

  const getProgressVariant = () => {
    if (usagePercentage >= 90) return "danger";
    if (usagePercentage >= 70) return "warning";
    return "success";
  };

  const getRoleDisplayName = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
      case "superadmin":
        return "Admin";
      case "verified_seller":
      case "seller":
        return "Verified Seller";
      case "premium":
        return "Premium";
      default:
        return "Basic";
    }
  };

  return (
    <Card className={className}>
      <Card.Header className="bg-light">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">
            <i className="ti ti-package me-2"></i>
            Listing Usage
          </h6>
          <Badge bg="primary" className="small">
            {getRoleDisplayName(limits.userRole)}
          </Badge>
        </div>
      </Card.Header>
      <Card.Body>
        {/* Usage Summary */}
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="small text-muted">Products Used</span>
            <span className="fw-bold">
              {limits.totalProducts} /{" "}
              {limits.maxAllowed === Infinity ? "∞" : limits.maxAllowed}
            </span>
          </div>

          {limits.maxAllowed !== Infinity && (
            <ProgressBar
              now={usagePercentage}
              variant={getProgressVariant()}
              className="mb-2"
              style={{ height: "6px" }}
            />
          )}

          <div className="row text-center">
            <div className="col-6">
              <div className="small text-muted">Regular</div>
              <div className="fw-bold text-primary">
                {limits.regularProducts}
              </div>
            </div>
            <div className="col-6">
              <div className="small text-muted">Pre-booking</div>
              <div className="fw-bold text-info">
                {limits.prebookingProducts}
              </div>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {!limits.canCreateMore && limits.maxAllowed !== Infinity && (
          <Alert variant="warning" className="small mb-3">
            <i className="ti ti-alert-triangle me-1"></i>
            You've reached your listing limit. Remove old products or upgrade
            your account.
          </Alert>
        )}

        {limits.remaining > 0 &&
          limits.remaining <= 3 &&
          limits.maxAllowed !== Infinity && (
            <Alert variant="info" className="small mb-3">
              <i className="ti ti-info-circle me-1"></i>
              Only {limits.remaining} listing{limits.remaining !== 1 ? "s" : ""}{" "}
              remaining.
            </Alert>
          )}

        {/* Account Limits Info */}
        <div className="small text-muted">
          <div className="d-flex justify-content-between">
            <span>Max Images per Product:</span>
            <span>{limits.limits.MAX_IMAGES_PER_PRODUCT}</span>
          </div>
          <div className="d-flex justify-content-between">
            <span>Max Image Size:</span>
            <span>{limits.limits.MAX_IMAGE_SIZE_MB}MB</span>
          </div>
          <div className="d-flex justify-content-between">
            <span>Max Description:</span>
            <span>{limits.limits.MAX_DESCRIPTION_LENGTH} chars</span>
          </div>
        </div>

        {/* Upgrade Suggestion for Basic Users */}
        {limits.userRole === "user" && usagePercentage > 50 && (
          <div className="mt-3 pt-3 border-top">
            <div className="text-center">
              <p className="small text-muted mb-2">
                Need more listings? Upgrade to get higher limits!
              </p>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => {
                  // Future: Link to upgrade page
                  alert("Upgrade feature coming soon!");
                }}
              >
                <i className="ti ti-arrow-up me-1"></i>
                Upgrade Account
              </Button>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
