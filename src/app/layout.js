import { Geist } from "next/font/google";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "react-hot-toast";
import MainLayout from "@/components/layout/MainLayout";
import { NextAuthProvider } from "@/context/NextAuthProvider";
import "../styles/main.scss";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "GreenSpace - Fresh Local Vegetables",
  description: "Connect with local vegetable producers and buy fresh produce directly from farms and home gardens",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/themify-icons/themify-icons.css" />
      </head>
      <body className={geistSans.variable}>
        <Providers>
          <NextAuthProvider>
            <CartProvider>
              <MainLayout>{children}</MainLayout>
              <Toaster position="top-right" reverseOrder={false} />
            </CartProvider>
          </NextAuthProvider>
        </Providers>
      </body>
    </html>
  );
}