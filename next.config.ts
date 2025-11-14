import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Supaya build TETAP jalan walaupun masih ada error ESLint
    ignoreDuringBuilds: true,
  },
  /* config options lainmu kalau ada */
};

export default nextConfig;
