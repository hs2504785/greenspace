import withPWA from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "images.unsplash.com",
      "hnzykyyefjupdxbramup.supabase.co",
      "sjhbbmbjyqzmswlvzuyi.supabase.co",
    ],
  },
};

const withPWAConfig = withPWA({
  dest: "public",
  register: false, // Disable automatic service worker registration - we use custom one
  skipWaiting: false, // Disable skipWaiting - handled by custom service worker
  disable: process.env.NODE_ENV === "development", // Disable PWA in development
  sw: false, // Disable service worker generation - use our custom sw.js
  workboxOptions: {
    disableDevLogs: true,
  },
});

export default withPWAConfig(nextConfig);
