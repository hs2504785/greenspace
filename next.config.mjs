/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "images.unsplash.com",
      "picsum.photos",
      "hnzykyyefjupdxbramup.supabase.co",
      "sjhbbmbjyqzmswlvzuyi.supabase.co",
      // External seller image domains
      "example.com",
      "imgur.com",
      "i.imgur.com",
      "drive.google.com",
      "lh3.googleusercontent.com",
    ],
    // For better security with external sellers, use remotePatterns
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "**",
      },
    ],
  },
};

// Note: next-pwa disabled - using custom service worker in public/sw.js
// The custom service worker handles:
// - Push notifications
// - Caching strategies
// - PWA functionality
// - Offline support

export default nextConfig;
