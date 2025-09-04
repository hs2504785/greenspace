"use client";

import { useState, useEffect } from "react";
import {
  Navbar,
  Nav,
  Container,
  Button,
  Dropdown,
  OverlayTrigger,
  Tooltip,
  Offcanvas,
} from "react-bootstrap";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import ProfileDropdown from "@/components/common/ProfileDropdown";
import { useCart } from "@/context/CartContext";
import SearchInput from "@/components/common/SearchInput";
import useUserRole from "@/hooks/useUserRole";
import GoogleLoginModal from "@/components/auth/GoogleLoginModal";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { data: session, status } = useSession();
  const { items } = useCart();
  const pathname = usePathname();
  const { isAdmin, isSuperAdmin, loading: roleLoading } = useUserRole();

  // Function to check if a nav item is active
  const isActive = (path) => {
    if (path === "/") {
      return pathname === "/" || pathname.startsWith("/?");
    }
    return pathname.startsWith(path);
  };

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close menu when link is clicked
  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  // Handle login modal
  const handleShowLogin = () => {
    setShowLoginModal(true);
  };

  const handleCloseLogin = () => {
    setShowLoginModal(false);
  };

  // Handle invalid sessions - removed to prevent infinite loop
  // useEffect(() => {
  //   // If we have a session but no user data, it's an invalid session
  //   if (session && !session.user && status !== "loading") {
  //     console.log("🔧 Detected invalid session, signing out...");
  //     signOut({ redirect: false });
  //   }
  // }, [session, status]);

  // Handle search functionality
  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
  };

  const handleSearchSubmit = (query) => {
    // Trigger search event based on current page
    if (pathname === "/prebooking-marketplace") {
      window.dispatchEvent(
        new CustomEvent("prebooking-search", { detail: { query } })
      );
    } else if (pathname === "/" || pathname.startsWith("/?")) {
      window.dispatchEvent(
        new CustomEvent("vegetable-search", { detail: { query } })
      );
    }
  };

  const handleSearchClear = () => {
    setSearchValue("");
    // Trigger clear search
    if (pathname === "/prebooking-marketplace") {
      window.dispatchEvent(
        new CustomEvent("prebooking-search", { detail: { query: "" } })
      );
    } else if (pathname === "/" || pathname.startsWith("/?")) {
      window.dispatchEvent(
        new CustomEvent("vegetable-search", { detail: { query: "" } })
      );
    }
  };

  return (
    <>
      <Navbar className="navbar-sticky">
        <Container>
          {/* Mobile Layout: Hamburger, Logo, User Section */}
          <div className="d-flex align-items-center w-100">
            {/* Hamburger - always visible on all screen sizes, positioned first */}
            <button
              className="navbar-toggler me-2"
              type="button"
              onClick={toggleMenu}
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>

            <Navbar.Brand
              as={Link}
              href="/"
              className="brand-container flex-grow-1"
            >
              <img
                src="/images/logo.svg"
                width="50"
                height="50"
                className="d-inline-block align-top me-2 brand-logo"
                alt="Arya Natural Farms Logo"
              />
              <div className="brand-text d-flex flex-column">
                {/* Full name for all screen sizes */}
                <span className="brand-name">Arya Natural Farms</span>
                {/* Full tagline for all screen sizes */}
                <span className="brand-tagline">Fresh • Natural • Local</span>
              </div>
            </Navbar.Brand>

            {/* Search Input - desktop and large tablets */}
            {(pathname === "/" ||
              pathname.startsWith("/?") ||
              pathname === "/prebooking-marketplace") && (
              <div
                className="d-none d-lg-flex me-3 flex-grow-1"
                style={{ maxWidth: "500px" }}
              >
                <SearchInput
                  value={searchValue}
                  onChange={handleSearchChange}
                  onSubmit={handleSearchSubmit}
                  onClear={handleSearchClear}
                  placeholder={
                    pathname === "/prebooking-marketplace"
                      ? "Search pre-booking products..."
                      : "Search vegetables..."
                  }
                  className="w-100"
                  size="sm"
                />
              </div>
            )}

            {/* Mobile User Section - positioned at the end */}
            <div className="d-lg-none">
              {status === "loading" ? (
                <div
                  className="spinner-border spinner-border-sm text-success"
                  role="status"
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : session?.user ? (
                <ProfileDropdown user={session.user} />
              ) : (
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={handleShowLogin}
                  style={{ whiteSpace: "nowrap", minWidth: "70px" }}
                >
                  Sign in
                </Button>
              )}
            </div>
          </div>

          {/* Filter and Cart buttons - always visible on desktop */}
          <div className="d-none d-lg-flex align-items-center ms-auto">
            {/* Filter button - context-aware for different pages */}
            {/* To add filter support for new pages: 
                1. Add pathname condition below
                2. Add tooltip text and event name in getFilterConfig()
                3. Add event listener in the target page component */}
            {(() => {
              const getFilterConfig = () => {
                if (pathname === "/prebooking-marketplace") {
                  return {
                    tooltip: "Filter pre-booking products",
                    event: "toggle-prebooking-filters",
                  };
                } else if (pathname === "/" || pathname.startsWith("/?")) {
                  return {
                    tooltip: "Filter & Sort vegetables",
                    event: "toggle-vegetable-filters",
                  };
                } else if (
                  pathname === "/farm-dashboard" ||
                  pathname === "/farm-layout-fullscreen"
                ) {
                  return {
                    tooltip: "Farm layout options",
                    event: "toggle-farm-filters",
                  };
                }
                return null;
              };

              const filterConfig = getFilterConfig();
              if (!filterConfig) return null;

              return (
                <OverlayTrigger
                  placement="bottom"
                  overlay={
                    <Tooltip id="filter-tooltip">
                      {filterConfig.tooltip}
                    </Tooltip>
                  }
                >
                  <div
                    className="text-decoration-none me-3 d-flex align-items-center cursor-pointer"
                    onClick={() =>
                      window.dispatchEvent(new CustomEvent(filterConfig.event))
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <i
                      className="ti-filter text-success"
                      style={{ fontSize: "1.4rem" }}
                    ></i>
                  </div>
                </OverlayTrigger>
              );
            })()}

            {/* Cart button */}
            <OverlayTrigger
              placement="bottom"
              overlay={
                <Tooltip id="cart-tooltip">
                  Shopping Cart
                  {items.length > 0 ? ` (${items.length} items)` : ""}
                </Tooltip>
              }
            >
              <div
                className="text-decoration-none me-3 d-flex align-items-center cursor-pointer"
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("toggle-cart"))
                }
                style={{ cursor: "pointer" }}
              >
                <div className="position-relative">
                  <i
                    className="ti-shopping-cart text-success"
                    style={{ fontSize: "1.5rem" }}
                  ></i>
                  {items.length > 0 && (
                    <div
                      className="position-absolute bg-success text-white rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        top: "-10px",
                        right: "-10px",
                        width: "18px",
                        height: "18px",
                        fontSize: "0.7rem",
                        fontWeight: "600",
                      }}
                    >
                      {items.length}
                    </div>
                  )}
                </div>
              </div>
            </OverlayTrigger>
          </div>

          {/* Desktop User Authentication - appears after cart */}
          <div className="d-none d-lg-flex align-items-center ms-3">
            {status === "loading" ? (
              <div
                className="spinner-border spinner-border-sm text-success"
                role="status"
              >
                <span className="visually-hidden">Loading...</span>
              </div>
            ) : session?.user ? (
              <ProfileDropdown user={session.user} />
            ) : (
              <Button
                variant="outline-success"
                onClick={handleShowLogin}
                style={{ whiteSpace: "nowrap", minWidth: "80px" }}
              >
                Sign in
              </Button>
            )}
          </div>
        </Container>
      </Navbar>

      {/* Mobile Search section - shown below header on smaller screens */}
      {(pathname === "/" ||
        pathname.startsWith("/?") ||
        pathname === "/prebooking-marketplace") && (
        <div className="search-section d-lg-none">
          <Container>
            <div className="py-3">
              {/* Mobile Search Section - shown below header on mobile */}
              <div className="w-100">
                <div className="d-flex align-items-center gap-2">
                  {/* Search input takes most space */}
                  <div className="flex-grow-1">
                    <SearchInput
                      value={searchValue}
                      onChange={handleSearchChange}
                      onSubmit={handleSearchSubmit}
                      onClear={handleSearchClear}
                      placeholder={
                        pathname === "/prebooking-marketplace"
                          ? "Search pre-booking products..."
                          : "Search vegetables..."
                      }
                      className="w-100"
                    />
                  </div>

                  {/* Filter and Cart buttons moved to search section on mobile */}
                  <div className="d-flex align-items-center gap-2">
                    {/* Filter button */}
                    {(() => {
                      const getFilterConfig = () => {
                        if (pathname === "/prebooking-marketplace") {
                          return {
                            tooltip: "Filter pre-booking products",
                            event: "toggle-prebooking-filters",
                          };
                        } else if (
                          pathname === "/" ||
                          pathname.startsWith("/?")
                        ) {
                          return {
                            tooltip: "Filter & Sort vegetables",
                            event: "toggle-vegetable-filters",
                          };
                        } else if (
                          pathname === "/farm-dashboard" ||
                          pathname === "/farm-layout-fullscreen"
                        ) {
                          return {
                            tooltip: "Farm layout options",
                            event: "toggle-farm-filters",
                          };
                        }
                        return null;
                      };

                      const filterConfig = getFilterConfig();
                      if (!filterConfig) return null;

                      return (
                        <OverlayTrigger
                          placement="bottom"
                          overlay={
                            <Tooltip id="filter-tooltip-mobile">
                              {filterConfig.tooltip}
                            </Tooltip>
                          }
                        >
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() =>
                              window.dispatchEvent(
                                new CustomEvent(filterConfig.event)
                              )
                            }
                            className="p-2"
                          >
                            <i
                              className="ti-filter"
                              style={{ fontSize: "1rem" }}
                            ></i>
                          </Button>
                        </OverlayTrigger>
                      );
                    })()}

                    {/* Cart button */}
                    <OverlayTrigger
                      placement="bottom"
                      overlay={
                        <Tooltip id="cart-tooltip-mobile">
                          Shopping Cart
                          {items.length > 0 ? ` (${items.length} items)` : ""}
                        </Tooltip>
                      }
                    >
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() =>
                          window.dispatchEvent(new CustomEvent("toggle-cart"))
                        }
                        className="p-2 position-relative"
                      >
                        <i
                          className="ti-shopping-cart"
                          style={{ fontSize: "1rem" }}
                        ></i>
                        {items.length > 0 && (
                          <div
                            className="position-absolute bg-success text-white rounded-circle d-flex align-items-center justify-content-center"
                            style={{
                              top: "-8px",
                              right: "-8px",
                              width: "16px",
                              height: "16px",
                              fontSize: "0.6rem",
                              fontWeight: "600",
                            }}
                          >
                            {items.length}
                          </div>
                        )}
                      </Button>
                    </OverlayTrigger>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </div>
      )}

      {/* Navigation Menu using Bootstrap Offcanvas - available on all screens */}
      <Offcanvas
        show={isMenuOpen}
        onHide={() => setIsMenuOpen(false)}
        placement="start"
        style={{ width: "260px", maxWidth: "65vw" }}
      >
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title>Arya Natural Farms</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Nav className="flex-column">
            <Nav.Link
              as={Link}
              href="/?showFreeOnly=true"
              className={`mobile-nav-link fair-share-link ${
                pathname.includes("showFreeOnly=true") ? "active-nav-item" : ""
              }`}
              onClick={handleLinkClick}
            >
              <i className="ti-heart me-2 text-success"></i>
              Fair Share
            </Nav.Link>
            <Nav.Link
              as={Link}
              href="/"
              className={`mobile-nav-link ${
                isActive("/") && !pathname.includes("showFreeOnly")
                  ? "active-nav-item"
                  : ""
              }`}
              onClick={handleLinkClick}
            >
              <i className="ti-apple me-2 text-success"></i>
              Fresh Vegetables
            </Nav.Link>
            <Nav.Link
              as={Link}
              href="/prebooking-marketplace"
              className={`mobile-nav-link ${
                isActive("/prebooking-marketplace") ? "active-nav-item" : ""
              }`}
              onClick={handleLinkClick}
            >
              <i className="ti-calendar me-2 text-info"></i>
              Pre-Booking
            </Nav.Link>
            <Nav.Link
              as={Link}
              href="/users"
              className={`mobile-nav-link ${
                isActive("/users") ? "active-nav-item" : ""
              }`}
              onClick={handleLinkClick}
            >
              <i className="ti-user me-2 text-primary"></i>
              Community
            </Nav.Link>
            <Nav.Link
              as={Link}
              href="/why-join-us"
              className={`mobile-nav-link ${
                isActive("/why-join-us") ? "active-nav-item" : ""
              }`}
              onClick={handleLinkClick}
            >
              <i className="ti-star me-2 text-warning"></i>
              Why Join Us
            </Nav.Link>

            {session?.user && (
              <>
                <div className="mobile-nav-divider mt-2 mb-1">
                  <small className="text-muted px-3">MY ACTIVITY</small>
                </div>
                <Nav.Link
                  as={Link}
                  href="/my-prebookings"
                  className={`mobile-nav-link ${
                    isActive("/my-prebookings") ? "active-nav-item" : ""
                  }`}
                  onClick={handleLinkClick}
                >
                  <i className="ti-bookmark me-2 text-success"></i>
                  My Pre-Bookings
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  href="/orders"
                  className={`mobile-nav-link ${
                    isActive("/orders") ? "active-nav-item" : ""
                  }`}
                  onClick={handleLinkClick}
                >
                  <i className="ti-package me-2 text-warning"></i>
                  My Orders
                </Nav.Link>
              </>
            )}
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Google Login Modal */}
      <GoogleLoginModal show={showLoginModal} onHide={handleCloseLogin} />
    </>
  );
}
