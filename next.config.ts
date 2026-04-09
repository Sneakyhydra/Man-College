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
    // Cache optimized images longer (default 60s) so repeat visits hit the cache.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
