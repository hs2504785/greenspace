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
  return (
    <Dropdown align="end">
      <Dropdown.Toggle as={CustomToggle}>
        <UserAvatar user={user} size={36} />
        <div
          className="d-flex flex-column me-1 user-name"
          style={{ lineHeight: "1.2" }}
        >
          <small className="text-muted" style={{ fontSize: "0.75rem" }}>
            Welcome,
          </small>
          <strong style={{ fontSize: "0.95rem" }}>
            {user?.name?.split(" ")[0]}
          </strong>
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

        {/* Become Seller Option - HIDDEN for now */}
        {false && !loading && !isSeller && !isAdmin && (
          <>
            <div className="px-3 py-2 border-bottom bg-light mt-2">
              <small className="text-muted fw-semibold">
                BUSINESS OPPORTUNITY
              </small>
            </div>
            <Dropdown.Item as={Link} href="/become-seller">
              <i className="ti-store me-2 text-success"></i>
              Become a Seller
              <small
                className="d-block text-muted"
                style={{ fontSize: "0.75rem", marginTop: "2px" }}
              >
                Join our natural farming community
              </small>
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
            {isAdmin && (
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
        <Dropdown.Item onClick={() => signOut()} className="text-danger">
          <i className="ti-power-off me-2"></i>
          Sign out
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}
