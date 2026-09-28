import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle a minimal Node server into .next/standalone -> small Docker image
  output: "standalone",
};

export default nextConfig;
