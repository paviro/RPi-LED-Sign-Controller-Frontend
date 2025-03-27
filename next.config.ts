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
  ...baseConfig
};

// Production-specific configuration
const productionConfig: NextConfig = {
  ...baseConfig,
  output: 'export',
};

// Choose the right config based on environment
const nextConfig: NextConfig = 
  process.env.NODE_ENV === 'development' 
    ? developmentConfig 
    : productionConfig;

export default nextConfig;
