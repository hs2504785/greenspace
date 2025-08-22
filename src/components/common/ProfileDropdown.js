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

      <Dropdown.Menu className="shadow-sm">
        <Dropdown.Item as={Link} href="/profile">
          <i className="ti ti-user me-2"></i>
          Profile
        </Dropdown.Item>
        {/* Notifications for all users */}
        <Dropdown.Item as={Link} href="/notifications">
          <i className="ti ti-bell me-2"></i>
          Notifications
        </Dropdown.Item>
        <Dropdown.Item as={Link} href="/my-prebookings">
          <i className="ti ti-calendar-plus me-2"></i>
          My Pre-Bookings
        </Dropdown.Item>
        {!loading && (isSeller || isAdmin) && (
          <>
            <Dropdown.Item as={Link} href="/products-management">
              <i className="ti ti-package me-2"></i>
              My Products
            </Dropdown.Item>
            <Dropdown.Item as={Link} href="/seller-dashboard">
              <i className="ti ti-shopping-cart me-2"></i>
              Orders Dashboard
            </Dropdown.Item>
            <Dropdown.Item as={Link} href="/payment-verification">
              <i className="ti ti-credit-card me-2"></i>
              Payment Verification
            </Dropdown.Item>
            <Dropdown.Item as={Link} href="/prebooking-dashboard">
              <i className="ti ti-calendar-clock me-2"></i>
              Pre-Booking Dashboard
            </Dropdown.Item>
          </>
        )}
        {isAdmin && (
          <>
            <Dropdown.Divider />
            <Dropdown.Item as={Link} href="/admin/seller-requests">
              <i className="ti ti-user me-2"></i>
              Seller Requests
            </Dropdown.Item>
          </>
        )}
        {isSuperAdmin && (
          <>
            <Dropdown.Divider />
            <Dropdown.Item as={Link} href="/admin/users">
              <i className="ti ti-users me-2"></i>
              Manage Users
            </Dropdown.Item>
          </>
        )}
        <Dropdown.Divider />
        <Dropdown.Item onClick={() => signOut()} className="text-danger">
          <i className="ti ti-power-off me-2"></i>
          Sign out
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}
