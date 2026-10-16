import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The homepage is the static public/index.html (liquidGL landing page).
  // Keep the root route mapped to that static file.
  serverExternalPackages: ["jieba-wasm"],
  outputFileTracingIncludes: {
    "/api/sentences/search": [
      "./lib/TEST_SENTENCES/sentences_with_translation.json",
      "./lib/TEST_SENTENCES/cmn_sentences_russian_translation.tsv",
      "./node_modules/jieba-wasm/pkg/nodejs/**/*",
    ],
  },
  async rewrites() {
    return [{ source: "/", destination: "/index.html" }];
  },
};

export default nextConfig;
