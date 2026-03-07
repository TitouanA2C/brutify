/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { hostname: 'i.pravatar.cc' },
      { hostname: '**.cdninstagram.com' },
      { hostname: '**.fbcdn.net' },
    ],
  },
  experimental: {
    optimizeCss: false,
  },
};

export default nextConfig;
