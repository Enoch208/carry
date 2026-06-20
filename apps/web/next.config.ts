import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@carry/core", "@carry/walrus"],
};

export default nextConfig;
