import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import createBundleAnalyzer from "@next/bundle-analyzer";
import createMDX from "@next/mdx";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// Turbopack requires rehype/remark plugins to be referenced by string name with
// serializable options (functions can't cross into the Rust compiler).
const withMDX = createMDX({
  options: {
    rehypePlugins: ["rehype-slug"],
  },
});

const nextConfig: NextConfig = {
  // Let `.md`/`.mdx` files act as pages and imports alongside TS/JS.
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
};

export default withNextIntl(withBundleAnalyzer(withMDX(nextConfig)));
