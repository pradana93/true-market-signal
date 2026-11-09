/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 15 moved typedRoutes out of experimental; keeping it nested
  // logs a deprecation warning on every boot.
  typedRoutes: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;