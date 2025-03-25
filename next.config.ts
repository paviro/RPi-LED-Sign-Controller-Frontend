import type { NextConfig } from "next";

// Base configuration shared between dev and prod
const baseConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

// Development-specific configuration
const developmentConfig: NextConfig = {
  ...baseConfig,
  // No 'output: export' in development
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://172.20.2.167:3000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

// Production-specific configuration
const productionConfig: NextConfig = {
  ...baseConfig,
  output: 'export',
  // No rewrites in production
};

// Choose the right config based on environment
const nextConfig: NextConfig = 
  process.env.NODE_ENV === 'development' 
    ? developmentConfig 
    : productionConfig;

export default nextConfig;
