import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The homepage is the static public/index.html (liquidGL landing page),
  // not a React route - there is intentionally no app/page.tsx. This
  // rewrite makes "/" serve that file directly.
  async rewrites() {
    return [
      {
        source: "/",
        destination: "/index.html",
      },
    ];
  },
};

export default nextConfig;
