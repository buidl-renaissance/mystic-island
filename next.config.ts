import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: true,
  transpilePackages: ["@coinbase/cdp-react", "x402-fetch"],
};

export default nextConfig;
