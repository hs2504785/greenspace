/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXTAUTH_URL: "http://localhost:3000",
    NEXTAUTH_SECRET: "f2inYw7j6BKP9fvH0OMJGB6rrerPKXgP9xNgeJTnDZ0=",
  },
  images: {
    domains: ['images.unsplash.com', 'sjhbbmbjyqzmswlvzuyi.supabase.co'],
  },
};

export default nextConfig;