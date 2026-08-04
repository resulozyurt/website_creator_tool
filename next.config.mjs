/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Image optimization is configured per environment in a later step.
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
