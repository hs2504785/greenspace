"use client";

import React from "react";
import { Dropdown } from "react-bootstrap";
import Link from "next/link";
import { signOut } from "next-auth/react";
import UserAvatar from "./UserAvatar";
import useUserRole from "@/hooks/useUserRole";

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
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return; // Prevent multiple signout calls

    try {
      setIsSigningOut(true);
      await signOut({ callbackUrl: "/login", redirect: true });
    } catch (error) {
      console.error("Signout error:", error);
      setIsSigningOut(false);
    }
  };
  return (
    <Dropdown align="end">
      <Dropdown.Toggle as={CustomToggle}>
        <UserAvatar user={user} size={36} />
        <div
          className="d-flex flex-column me-1 user-name"
          style={{ lineHeight: "1.2" }}
        >
          <strong style={{ fontSize: "0.95rem" }}>
            {user?.name?.split(" ")[0] || "User"}
          </strong>
          <small className="text-muted" style={{ fontSize: "0.75rem" }}>
            {user?.email}
          </small>
        </div>
      </Dropdown.Toggle>

      <Dropdown.Menu className="shadow-sm" style={{ minWidth: "220px" }}>
        {/* Personal Section */}
        <div className="px-3 py-2 border-bottom bg-light">
          <small className="text-muted fw-semibold">PERSONAL</small>
        </div>
        <Dropdown.Item as={Link} href="/profile">
          <i className="ti ti-user me-2 text-primary"></i>
          Profile
        </Dropdown.Item>
        <Dropdown.Item as={Link} href="/notifications">
          <i className="ti ti-bell me-2 text-info"></i>
          Notifications
        </Dropdown.Item>
        <Dropdown.Item as={Link} href="/my-prebookings">
          <i className="ti-bookmark me-2 text-success"></i>
          My Pre-Bookings
        </Dropdown.Item>

        {/* Become Seller Option */}
        {!loading && !isSeller && !isAdmin && (
          <>
            <div className="px-3 py-2 border-bottom bg-light mt-2">
              <small className="text-muted fw-semibold">
                BUSINESS OPPORTUNITY
              </small>
            </div>
            <Dropdown.Item
              as={Link}
              href="/become-seller"
              className="py-3 border border-success border-opacity-25 rounded mx-2 mb-2"
              style={{ backgroundColor: "rgba(25, 135, 84, 0.05)" }}
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
          </>
        )}

        {/* Business Section - for Sellers/Admins */}
        {!loading && (isSeller || isAdmin) && (
          <>
            <div className="px-3 py-2 border-bottom bg-light mt-2">
              <small className="text-muted fw-semibold">BUSINESS</small>
            </div>
            <Dropdown.Item as={Link} href="/products-management">
              <i className="ti-package me-2 text-warning"></i>
              My Products
            </Dropdown.Item>
            <Dropdown.Item as={Link} href="/seller-dashboard">
              <i className="ti-dashboard me-2 text-success"></i>
              Orders Dashboard
            </Dropdown.Item>
            <Dropdown.Item as={Link} href="/prebooking-dashboard">
              <i className="ti-calendar me-2 text-info"></i>
              Pre-Booking Dashboard
            </Dropdown.Item>
            <Dropdown.Item as={Link} href="/payment-verification">
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
            <Dropdown.Item as={Link} href="/admin">
              <i className="ti-dashboard me-2 text-danger"></i>
              Admin Dashboard
            </Dropdown.Item>
            {/* Seller Requests */}
            {(isAdmin || isSuperAdmin) && (
              <Dropdown.Item as={Link} href="/admin/seller-requests">
                <i className="ti-check me-2 text-warning"></i>
                Seller Requests
              </Dropdown.Item>
            )}
            {isSuperAdmin && (
              <Dropdown.Item as={Link} href="/admin/users">
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
