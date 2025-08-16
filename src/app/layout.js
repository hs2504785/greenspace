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
  title: "Arya Natural Farms - Fresh Local Vegetables",
  description:
    "Connect with local vegetable producers and buy fresh produce directly from farms and home gardens",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/themify-icons/themify-icons.css" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon/favicon-16x16.png"
        />
        {/* <link rel="manifest" href="/favicon/site.webmanifest" /> */}
      </head>
      <body className={geistSans.variable}>
        <Providers>
          <NextAuthProvider>
            <CartProvider>
              <MainLayout>{children}</MainLayout>
              <Toaster
                position="bottom-right"
                reverseOrder={false}
                gutter={12}
                containerStyle={{
                  bottom: 16,
                  right: 16,
                  zIndex: 9999,
                }}
                toastOptions={{
                  duration: 4000,
                  style: {
                    fontSize: "14px",
                    fontWeight: "400",
                    minWidth: "280px",
                    maxWidth: "400px",
                  },
                  success: {
                    duration: 3000,
                  },
                  error: {
                    duration: 5000,
                  },
                }}
              />
            </CartProvider>
          </NextAuthProvider>
        </Providers>
      </body>
    </html>
  );
}
