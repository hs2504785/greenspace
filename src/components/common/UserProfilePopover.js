"use client";

import React, { useState, useEffect } from "react";
import { OverlayTrigger, Popover, Spinner } from "react-bootstrap";
import UserAvatar from "./UserAvatar";

const UserProfilePopover = ({ user, children, placement = "auto" }) => {
  const [contactInfo, setContactInfo] = useState(null);
  const [loading, setLoading] = useState(true); // Start loading immediately
  const [error, setError] = useState(null);

  // Load contact info when component mounts (on hover)
  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const response = await fetch(`/api/users/${user.id}/contact`);
        if (!response.ok) {
          throw new Error("Failed to fetch contact information");
        }
        const data = await response.json();
        setContactInfo(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching contact info:", err);
        setError("Failed to load contact information");
        setContactInfo(null);
      } finally {
        setLoading(false);
      }
    };

    // Reset states when user changes
    setLoading(true);
    setError(null);
    setContactInfo(null);

    fetchContactInfo();
  }, [user.id]);

  const popoverContent = (
    <Popover id={`user-popover-${user.id}`} className="shadow">
      <Popover.Header className="d-flex align-items-center border-0">
        <UserAvatar user={user} size={40} className="me-2 flex-shrink-0" />
        <div className="flex-grow-1">
          <div className="d-flex align-items-center">
            <div className="fw-bold me-2">{user.name}</div>
            {/* Contact indicators */}
            {!loading && contactInfo && (
              <div className="d-flex gap-1">
                {contactInfo.email && (
                  <i
                    className="ti ti-mail text-primary small"
                    title="Email available"
                  ></i>
                )}
                {contactInfo.whatsapp_number && (
                  <i
                    className="ti ti-brand-whatsapp text-success small"
                    title="WhatsApp available"
                  ></i>
                )}
                {contactInfo.phone && (
                  <i
                    className="ti ti-phone text-info small"
                    title="Phone available"
                  ></i>
                )}
              </div>
            )}
          </div>
          <small className="text-muted">Community Member</small>
        </div>
      </Popover.Header>
      <Popover.Body className="py-2">
        {/* Contact Information */}
        <div className="mb-2">
          <small className="text-muted d-block mb-2">
            <i className="ti ti-address-book me-1"></i>
            Contact Information
          </small>

          {loading && (
            <div className="text-center py-3">
              <Spinner size="sm" className="me-2" />
              <small className="text-muted">Loading contact info...</small>
            </div>
          )}

          {error && (
            <div className="text-center py-3">
              <small className="text-danger">
                <i className="ti ti-exclamation-triangle me-1"></i>
                Failed to load contact information
              </small>
            </div>
          )}

          {!loading && !error && (
            <div className="ps-3">
              {contactInfo?.email && (
                <div className="mb-2">
                  <i className="ti ti-mail me-2 text-primary"></i>
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="text-decoration-none small"
                  >
                    {contactInfo.email}
                  </a>
                </div>
              )}

              {contactInfo?.whatsapp_number && (
                <div className="mb-2">
                  <i className="ti ti-brand-whatsapp me-2 text-success"></i>
                  <a
                    href={`https://wa.me/91${contactInfo.whatsapp_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-decoration-none small"
                  >
                    +91 {contactInfo.whatsapp_number}
                  </a>
                </div>
              )}

              {contactInfo?.phone && (
                <div className="mb-2">
                  <i className="ti ti-phone me-2 text-info"></i>
                  <a
                    href={`tel:+91${contactInfo.phone}`}
                    className="text-decoration-none small"
                  >
                    +91 {contactInfo.phone}
                  </a>
                </div>
              )}

              {contactInfo &&
                !contactInfo.email &&
                !contactInfo.whatsapp_number &&
                !contactInfo.phone && (
                  <small className="text-muted d-flex align-items-center">
                    <i className="ti ti-shield-check me-2"></i>
                    Contact info not shared publicly
                  </small>
                )}
            </div>
          )}
        </div>
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger
      trigger="click"
      placement={placement}
      overlay={popoverContent}
      rootClose
    >
      <div style={{ cursor: "pointer" }}>{children}</div>
    </OverlayTrigger>
  );
};

export default UserProfilePopover;
