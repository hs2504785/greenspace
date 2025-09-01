"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Header from "./Header";
import Cart from "../features/Cart";
import AIChatAssistant from "../ai/AIChatAssistant";

const MainLayout = ({ children }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { data: session } = useSession();

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
      <main className="main-content">{children}</main>
      <Cart />

      {/* AI Chat Assistant - Always enabled */}
      <AIChatAssistant user={session?.user} />
    </div>
  );
};

export default MainLayout;
