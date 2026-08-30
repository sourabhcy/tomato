import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      // Matches MAX_CSV_BYTES in lib/productCsv.ts - keeps the product upload capped everywhere.
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
