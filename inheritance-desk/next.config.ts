import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Route handlers read the government-data pack from disk and use node:sqlite,
  // so keep them on the Node.js runtime (declared per-route as well).
  serverExternalPackages: ["node:sqlite"],
  outputFileTracingIncludes: {
    "/api/**": ["./government-data/*.json"],
  },
};

export default nextConfig;
