"use client";

import React from "react";
import { Dropdown } from "react-bootstrap";
import Link from "next/link";
import { signOut } from "next-auth/react";
import UserAvatar from "./UserAvatar";
import useUserRole from "@/hooks/useUserRole";
import useSellerRequestStatus from "@/hooks/useSellerRequestStatus";
import { getUserDisplayInfo, getRoleBadge } from "@/utils/userDisplayUtils";

const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
  <div
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    style={{ cursor: "pointer" }}
    className="d-flex align-items-center gap-2"
  >
    {children}
  </div>
));

CustomToggle.displayName = "CustomToggle";

export default function ProfileDropdown({ user }) {
  const { isSeller, isAdmin, isSuperAdmin, loading } = useUserRole();
  const {
    sellerRequest,
    loading: requestLoading,
    hasPendingRequest,
    isRejected,
  } = useSellerRequestStatus();

  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const [showDropdown, setShowDropdown] = React.useState(false);

  // Get display information using utility functions
  const displayInfo = getUserDisplayInfo(user, { maxEmailLength: 18 });
  const roleBadge = getRoleBadge({ isSeller, isAdmin, isSuperAdmin, loading });

  const handleSignOut = async () => {
    if (isSigningOut) return; // Prevent multiple signout calls

    try {
      setIsSigningOut(true);
      setShowDropdown(false); // Close dropdown before signing out
      await signOut({ callbackUrl: "/login", redirect: true });
    } catch (error) {
      console.error("Signout error:", error);
      setIsSigningOut(false);
    }
  };

  const handleDropdownItemClick = () => {
    setShowDropdown(false);
  };
  return (
    <Dropdown
      align="end"
      drop="down"
      show={showDropdown}
      onToggle={setShowDropdown}
    >
      <Dropdown.Toggle as={CustomToggle}>
        <UserAvatar user={user} size={36} />
        <div
          className="d-flex flex-column me-1 user-name"
          style={{ lineHeight: "1.2", minWidth: 0 }}
        >
          <div className="d-flex align-items-center gap-1">
            <strong style={{ fontSize: "0.95rem", whiteSpace: "nowrap" }}>
              {displayInfo.name}
            </strong>
            {roleBadge && (
              <span
                className={`badge bg-${roleBadge.color} rounded-pill`}
                style={{ fontSize: "0.6rem", padding: "2px 6px" }}
              >
                {roleBadge.text}
              </span>
            )}
          </div>
          {displayInfo.subtitle && (
            <small
              className="text-muted"
              style={{
                fontSize: "0.75rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "140px",
              }}
              title={user?.email} // Show full email on hover
            >
              {displayInfo.subtitle}
            </small>
          )}
        </div>
      </Dropdown.Toggle>

      <Dropdown.Menu
        className="shadow-sm profile-dropdown-menu"
        style={{
          minWidth: "220px",
          maxHeight: "80vh",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {/* Personal Section */}
        <div className="px-3 py-2 border-bottom bg-light">
          <small className="text-muted fw-semibold">PERSONAL</small>
        </div>
        <Dropdown.Item
          as={Link}
          href="/profile"
          onClick={handleDropdownItemClick}
        >
          <i className="ti ti-user me-2 text-primary"></i>
          Profile
        </Dropdown.Item>
        <Dropdown.Item
          as={Link}
          href="/notifications"
          onClick={handleDropdownItemClick}
        >
          <i className="ti ti-bell me-2 text-info"></i>
          Notifications
        </Dropdown.Item>

        {/* Seller Request Status */}
        {!loading && !isSeller && !isAdmin && (
          <>
            <div className="px-3 py-2 border-bottom bg-light mt-2">
              <small className="text-muted fw-semibold">
                BUSINESS OPPORTUNITY
              </small>
            </div>

            {/* Show different states based on seller request status */}
            {requestLoading ? (
              // Loading State
              <div
                className="py-3 border border-info border-opacity-25 rounded mx-2 mb-2"
                style={{ backgroundColor: "rgba(13, 202, 240, 0.05)" }}
              >
                <div className="d-flex align-items-center px-3">
                  <span
                    className="me-3 text-info d-inline-flex align-items-center justify-content-center"
                    style={{
                      fontSize: "1.2rem",
                      width: "20px",
                      height: "20px",
                      fontWeight: "bold",
                    }}
                  >
                    ⏳
                  </span>
                  <div>
                    <div className="fw-semibold text-info">
                      Checking Status...
                    </div>
                    <small
                      className="d-block text-muted"
                      style={{ fontSize: "0.75rem", marginTop: "2px" }}
                    >
                      Loading seller request status
                    </small>
                  </div>
                </div>
              </div>
            ) : hasPendingRequest ? (
              // Pending Request State
              <div
                className="py-3 border border-warning border-opacity-25 rounded mx-2 mb-2"
                style={{ backgroundColor: "rgba(255, 193, 7, 0.05)" }}
              >
                <div className="d-flex align-items-center px-3">
                  <span
                    className="me-3 text-warning d-inline-flex align-items-center justify-content-center"
                    style={{
                      fontSize: "1.2rem",
                      width: "20px",
                      height: "20px",
                      fontWeight: "bold",
                    }}
                  >
                    ⏳
                  </span>
                  <div>
                    <div className="fw-semibold text-warning">
                      Request Pending
                    </div>
                    <small
                      className="d-block text-muted"
                      style={{ fontSize: "0.75rem", marginTop: "2px" }}
                    >
                      Your seller application is under review
                    </small>
                  </div>
                </div>
              </div>
            ) : isRejected ? (
              // Rejected Request State - Allow reapplication
              <Dropdown.Item
                as={Link}
                href="/become-seller"
                className="py-3 border border-danger border-opacity-25 rounded mx-2 mb-2"
                style={{ backgroundColor: "rgba(220, 53, 69, 0.05)" }}
                onClick={handleDropdownItemClick}
              >
                <div className="d-flex align-items-center">
                  <span
                    className="me-3 text-danger d-inline-flex align-items-center justify-content-center"
                    style={{
                      fontSize: "1.2rem",
                      width: "20px",
                      height: "20px",
                      fontWeight: "bold",
                    }}
                  >
                    🔄
                  </span>
                  <div>
                    <div className="fw-semibold text-danger">
                      Reapply as Seller
                    </div>
                    <small
                      className="d-block text-muted"
                      style={{ fontSize: "0.75rem", marginTop: "2px" }}
                    >
                      Previous application was declined
                    </small>
                  </div>
                </div>
              </Dropdown.Item>
            ) : (
              // No Request State - Show Become Seller
              <Dropdown.Item
                as={Link}
                href="/become-seller"
                className="py-3 border border-success border-opacity-25 rounded mx-2 mb-2"
                style={{ backgroundColor: "rgba(25, 135, 84, 0.05)" }}
                onClick={handleDropdownItemClick}
              >
                <div className="d-flex align-items-center">
                  <span
                    className="me-3 text-success d-inline-flex align-items-center justify-content-center"
                    style={{
                      fontSize: "1.2rem",
                      width: "20px",
                      height: "20px",
                      fontWeight: "bold",
                    }}
                  >
                    🌱
                  </span>
                  <div>
                    <div className="fw-semibold text-success">
                      Become a Seller
                    </div>
                    <small
                      className="d-block text-muted"
                      style={{ fontSize: "0.75rem", marginTop: "2px" }}
                    >
                      Start selling your natural produce today
                    </small>
                  </div>
                </div>
              </Dropdown.Item>
            )}
          </>
        )}

        {/* Business Section - for Sellers/Admins */}
        {!loading && (isSeller || isAdmin) && (
          <>
            <div className="px-3 py-2 border-bottom bg-light mt-2">
              <small className="text-muted fw-semibold">BUSINESS</small>
            </div>
            <Dropdown.Item
              as={Link}
              href="/products-management"
              onClick={handleDropdownItemClick}
            >
              <i className="ti-package me-2 text-warning"></i>
              My Products
            </Dropdown.Item>
            <Dropdown.Item
              as={Link}
              href="/seller-dashboard"
              onClick={handleDropdownItemClick}
            >
              <i className="ti-dashboard me-2 text-success"></i>
              Orders Dashboard
            </Dropdown.Item>
            <Dropdown.Item
              as={Link}
              href="/prebooking-dashboard"
              onClick={handleDropdownItemClick}
            >
              <i className="ti-calendar me-2 text-info"></i>
              Pre-Booking Dashboard
            </Dropdown.Item>
            <Dropdown.Item
              as={Link}
              href="/payment-verification"
              onClick={handleDropdownItemClick}
            >
              <i className="ti-credit-card me-2 text-primary"></i>
              Payment Verification
            </Dropdown.Item>
          </>
        )}

        {/* Admin Section */}
        {(isAdmin || isSuperAdmin) && (
          <>
            <div className="px-3 py-2 border-bottom bg-light mt-2">
              <small className="text-muted fw-semibold">ADMINISTRATION</small>
            </div>
            <Dropdown.Item
              as={Link}
              href="/admin"
              onClick={handleDropdownItemClick}
            >
              <i className="ti-dashboard me-2 text-danger"></i>
              Admin Dashboard
            </Dropdown.Item>
            <Dropdown.Item
              as={Link}
              href="/farm-dashboard"
              onClick={handleDropdownItemClick}
            >
              <i className="ti-layout-grid3 me-2 text-success"></i>
              Farm Dashboard
            </Dropdown.Item>
            <Dropdown.Item
              as={Link}
              href="/tree-management"
              onClick={handleDropdownItemClick}
            >
              <i className="ti-palette me-2 text-warning"></i>
              Tree Management
            </Dropdown.Item>
            {/* Seller Requests */}
            {(isAdmin || isSuperAdmin) && (
              <Dropdown.Item
                as={Link}
                href="/admin/seller-requests"
                onClick={handleDropdownItemClick}
              >
                <i className="ti-check me-2 text-warning"></i>
                Seller Requests
              </Dropdown.Item>
            )}
            {isSuperAdmin && (
              <Dropdown.Item
                as={Link}
                href="/admin/users"
                onClick={handleDropdownItemClick}
              >
                <i className="ti-settings me-2 text-danger"></i>
                Manage Users
              </Dropdown.Item>
            )}
          </>
        )}

        {/* Account Section */}
        <Dropdown.Divider />
        <Dropdown.Item
          onClick={handleSignOut}
          className="text-danger"
          disabled={isSigningOut}
        >
          <i className="ti-power-off me-2"></i>
          {isSigningOut ? "Signing out..." : "Sign out"}
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}
