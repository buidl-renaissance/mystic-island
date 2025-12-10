import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: true,
  transpilePackages: ["@coinbase/cdp-react", "x402-fetch", "@farcaster/miniapp-sdk"],
  compiler: {
    styledComponents: true,
  },
};

export default nextConfig;
