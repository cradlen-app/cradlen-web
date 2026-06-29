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

const isProd = process.env.NODE_ENV === "production";

// Origins the browser legitimately talks to. Authenticated data goes same-origin
// through `/api/backend`, but the Socket.IO visit feed connects directly to the
// backend host (NEXT_PUBLIC_API_URL with `/v1` stripped), so allow it explicitly.
const apiOrigin = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
})();

const wsOrigin = apiOrigin
  ? apiOrigin.replace(/^http/, "ws")
  : null;

const connectSrc = ["'self'", apiOrigin, wsOrigin]
  .filter(Boolean)
  .join(" ");

// Reporting-only to start: this learns real violations from production traffic
// without breaking Next's inline bootstrap, next/font styles, Turbopack HMR, or
// the RTL/i18n shells. Promote to an enforcing `Content-Security-Policy` once the
// report stream is clean. `unsafe-eval` is dev-only (Turbopack/React Refresh).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src ${connectSrc}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
]
  .filter(Boolean)
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy-Report-Only", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  // Let `.md`/`.mdx` files act as pages and imports alongside TS/JS.
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(withBundleAnalyzer(withMDX(nextConfig)));
