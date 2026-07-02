import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Client router cache: reuse each tab's payload for 30s so bottom-nav
    // hops render instantly instead of re-fetching the server on every tap.
    // Mutations that must show up across tabs call router.refresh() (drop
    // composer, delete, watchlist save) which busts this cache.
    staleTimes: { dynamic: 30 },
  },
};

export default nextConfig;
