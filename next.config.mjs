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

// Note: next-pwa disabled - using custom service worker in public/sw.js
// The custom service worker handles:
// - Push notifications
// - Caching strategies
// - PWA functionality
// - Offline support

export default nextConfig;
