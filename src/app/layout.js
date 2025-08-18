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
  manifest: "/manifest.json",
  themeColor: "#28a745",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Arya Farms",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
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

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#28a745" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Arya Farms" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta
          name="msapplication-config"
          content="/favicon/browserconfig.xml"
        />
        <meta name="msapplication-TileColor" content="#28a745" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* iOS Splash Screens */}
        <meta
          name="apple-touch-startup-image"
          content="/favicon/apple-touch-icon.png"
        />
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
