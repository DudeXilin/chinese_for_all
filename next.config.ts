import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The homepage is the static public/index.html (liquidGL landing page).
  // Keep the root route mapped to that static file.
  async rewrites() {
    return [{ source: "/", destination: "/index.html" }];
  },
};

export default nextConfig;
