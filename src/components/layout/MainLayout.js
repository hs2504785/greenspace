"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Cart from "../features/Cart";
import AIChatAssistant from "../ai/AIChatAssistant";

const MainLayout = ({ children }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

  // Pages that have filters and need extra padding on mobile
  const pagesWithFilters = [
    "/", // Home page with vegetable filters
    "/prebooking", // Pre-booking page with filters
    "/products", // Products management with filters
    "/orders", // Orders page with filters
  ];

  const hasFilters = pagesWithFilters.includes(pathname);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 10;
      if (scrolled !== isScrolled) {
        setIsScrolled(scrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isScrolled]);

  useEffect(() => {
    const navbar = document.querySelector(".navbar-sticky");
    if (navbar) {
      if (isScrolled) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    }
  }, [isScrolled]);

  return (
    <div className="layout-wrapper">
      <Header />
      <main className={`main-content ${hasFilters ? "has-filters" : ""}`}>
        {children}
      </main>
      <Cart />

      {/* AI Chat Assistant - Always enabled */}
      <AIChatAssistant user={session?.user} />
    </div>
  );
};

export default MainLayout;
