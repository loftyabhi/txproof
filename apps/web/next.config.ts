import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  /* config options here */
  /* config options here */
  transpilePackages: [
    '@solana/kit',
    '@solana-program/system',
    '@solana-program/token',
    '@coinbase/cdp-sdk',
    '@reown/appkit',
    '@reown/appkit-adapter-wagmi'
  ],
  env: {
    ADMIN_ADDRESS: process.env.ADMIN_ADDRESS,
  },
};

export default nextConfig;
