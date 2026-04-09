import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mansociety.org",
        pathname: "/wp-content/**",
      },
    ],
  },
};

export default nextConfig;
