"use client";

import { useState } from "react";
import {
  Navbar,
  Nav,
  Container,
  Button,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import ProfileDropdown from "@/components/common/ProfileDropdown";
import { useCart } from "@/context/CartContext";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const { items } = useCart();
  const pathname = usePathname();

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

  return (
    <>
      <Navbar className="navbar-sticky py-0">
        <Container>
          <Navbar.Brand as={Link} href="/" className="brand-container">
            <img
              src="/images/logo.svg"
              width="50"
              height="50"
              className="d-inline-block align-top me-2 brand-logo"
              alt="Arya Natural Farms Logo"
            />
            <div className="brand-text d-flex flex-column">
              <span className="brand-name">Arya Natural Farms</span>
              <span className="brand-tagline d-none d-sm-block">
                Fresh • Natural • Local
              </span>
            </div>
          </Navbar.Brand>

          {/* Filter and Cart buttons - always visible, appears before profile on desktop */}
          <div className="d-flex align-items-center order-lg-3">
            {/* Filter button - only show on vegetables listing pages */}
            {(pathname === "/" || pathname.startsWith("/?")) && (
              <OverlayTrigger
                placement="bottom"
                overlay={
                  <Tooltip id="filter-tooltip">
                    Filter & Sort vegetables
                  </Tooltip>
                }
              >
                <div
                  className="text-decoration-none me-3 d-flex align-items-center cursor-pointer"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("toggle-vegetable-filters")
                    )
                  }
                  style={{ cursor: "pointer" }}
                >
                  <i
                    className="ti-filter text-success"
                    style={{ fontSize: "1.4rem" }}
                  ></i>
                </div>
              </OverlayTrigger>
            )}

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

            {/* User Authentication - visible on mobile only */}
            <div className="d-lg-none">
              {status === "loading" ? (
                <div
                  className="spinner-border spinner-border-sm text-success"
                  role="status"
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : session ? (
                <ProfileDropdown user={session.user} />
              ) : (
                <Button
                  as={Link}
                  href="/login"
                  variant="outline-success"
                  size="sm"
                >
                  Sign in
                </Button>
              )}
            </div>
          </div>

          {/* User Authentication - desktop only, appears after cart */}
          <div className="d-none d-lg-flex align-items-center order-lg-4">
            {status === "loading" ? (
              <div
                className="spinner-border spinner-border-sm text-success"
                role="status"
              >
                <span className="visually-hidden">Loading...</span>
              </div>
            ) : session ? (
              <ProfileDropdown user={session.user} />
            ) : (
              <Button as={Link} href="/login" variant="outline-success">
                Sign in
              </Button>
            )}
          </div>

          {/* Custom hamburger toggle - visible on mobile only */}
          <button
            className="navbar-toggler d-lg-none"
            type="button"
            onClick={toggleMenu}
            aria-controls="mobile-menu"
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Desktop navigation - always visible on large screens */}
          <div className="d-none d-lg-flex order-lg-2 flex-grow-1">
            <Nav className="me-auto">
              <Nav.Link
                as={Link}
                href="/?showFreeOnly=true"
                className={`fair-share-link ${
                  pathname.includes("showFreeOnly=true")
                    ? "active-nav-item"
                    : ""
                }`}
              >
                🎁 Fair Share
              </Nav.Link>
              <Nav.Link
                as={Link}
                href="/"
                className={
                  isActive("/") && !pathname.includes("showFreeOnly")
                    ? "active-nav-item"
                    : ""
                }
              >
                Fresh Vegetables
              </Nav.Link>
              {session && (
                <>
                  <Nav.Link
                    as={Link}
                    href="/orders"
                    className={isActive("/orders") ? "active-nav-item" : ""}
                  >
                    Orders & Deliveries
                  </Nav.Link>
                  {/* <Nav.Link 
                  as={Link} 
                  href="/discussions"
                  className={
                    isActive("/discussions")
                      ? "active-nav-item"
                      : ""
                  }
                >
                  Discussions
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  href="/community"
                  className={
                    isActive("/community")
                      ? "active-nav-item"
                      : ""
                  }
                >
                  Community
                </Nav.Link> */}
                </>
              )}
            </Nav>
          </div>
        </Container>
      </Navbar>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="mobile-menu-backdrop d-lg-none"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="mobile-menu-overlay"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-menu-content">
              <Nav className="flex-column">
                <Nav.Link
                  as={Link}
                  href="/?showFreeOnly=true"
                  className={`mobile-nav-link fair-share-link ${
                    pathname.includes("showFreeOnly=true")
                      ? "active-nav-item"
                      : ""
                  }`}
                  onClick={handleLinkClick}
                >
                  🎁 Fair Share
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
                  Fresh Vegetables
                </Nav.Link>
                {session && (
                  <>
                    <Nav.Link
                      as={Link}
                      href="/orders"
                      className={`mobile-nav-link ${
                        isActive("/orders") ? "active-nav-item" : ""
                      }`}
                      onClick={handleLinkClick}
                    >
                      Orders & Deliveries
                    </Nav.Link>
                    {/* <Nav.Link 
                      as={Link} 
                      href="/discussions"
                      className={`mobile-nav-link ${
                        isActive("/discussions")
                          ? "active-nav-item"
                          : ""
                      }`}
                      onClick={handleLinkClick}
                    >
                      Discussions
                    </Nav.Link>
                    <Nav.Link 
                      as={Link} 
                      href="/community"
                      className={`mobile-nav-link ${
                        isActive("/community")
                          ? "active-nav-item"
                          : ""
                      }`}
                      onClick={handleLinkClick}
                    >
                      Community
                    </Nav.Link> */}
                  </>
                )}
              </Nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
