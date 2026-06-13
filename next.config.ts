import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  serverExternalPackages: [
    "@neondatabase/serverless",
    "@unlink-xyz/sdk",
    "@circle-fin/x402-batching",
  ],
};

export default nextConfig;
