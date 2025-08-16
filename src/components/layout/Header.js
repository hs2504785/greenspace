"use client";

import { Navbar, Nav, Container, Button } from "react-bootstrap";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import ProfileDropdown from "@/components/common/ProfileDropdown";
import { useCart } from "@/context/CartContext";

export default function Header() {
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

  return (
    <Navbar expand="lg" className="navbar-sticky py-0">
      <Container>
        <Navbar.Brand as={Link} href="/">
          <img
            src="/images/logo.svg"
            width="60"
            className="d-inline-block align-top me-2"
            alt="Arya Natural Farms Logo"
          />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link
              as={Link}
              href="/?showFreeOnly=true"
              className={`fair-share-link ${
                pathname.includes("showFreeOnly=true") ? "active-nav-item" : ""
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
          <Nav className="align-items-center">
            <div
              className="text-decoration-none me-4 d-flex align-items-center cursor-pointer"
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
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
