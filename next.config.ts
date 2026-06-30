import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import withSerwistInit from "@serwist/next";
import createNextIntlPlugin from "next-intl/plugin";
import createBundleAnalyzer from "@next/bundle-analyzer";
import createMDX from "@next/mdx";
import pkg from "./package.json";

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

// PWA service worker (src/app/sw.ts -> public/sw.js), auto-registered on the
// client. Disabled in dev: a precaching SW fights Turbopack HMR and serves stale
// chunks. `reloadOnOnline: false` keeps the existing "never auto-reload, the user
// chooses when to refresh" rule (see UpdateBanner) intact.
//
// NOTE: @serwist/next injects the worker via a webpack() hook, which Turbopack
// ignores. The production build therefore runs `next build --webpack` (see the
// "build" script in package.json) so the SW is actually emitted. Dev stays on
// Turbopack, where Serwist is disabled anyway.
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: false,
});

const isProd = process.env.NODE_ENV === "production";

// Build identity, baked into the browser bundle so the running tab knows which
// deployment it is. On Vercel the commit SHA is the stable, meaningful id.
// `VERCEL_*` system vars are NOT `NEXT_PUBLIC_`, so they must be re-exported via
// `env` below to be readable client-side.
//
// Robustness: if the commit SHA is missing (e.g. Vercel's "Automatically expose
// System Environment Variables" is off), we must NOT silently fall back to a
// `dev-*` id in a real deploy — that would disable update detection in prod. So
// only a genuine local build gets a `dev-*` sentinel; any CI/Vercel build gets a
// unique, non-dev `build-*` id so each deploy is still detectable as new.
const commitSha = process.env.VERCEL_GIT_COMMIT_SHA ?? "";
const isCIBuild = process.env.VERCEL === "1" || process.env.CI === "1";
const buildId =
  commitSha || (isCIBuild ? `build-${Date.now()}` : `dev-${Date.now()}`);

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

// Sentry's browser SDK posts events directly to its ingest host. Allow that
// origin so the (currently report-only) CSP won't block error reporting once
// it's promoted to enforcing. Derived from the DSN; null when Sentry is off.
const sentryOrigin = (() => {
  const raw = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
})();

const connectSrc = ["'self'", apiOrigin, wsOrigin, sentryOrigin]
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
  // The PWA service worker is same-origin (/sw.js).
  "worker-src 'self' blob:",
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
  // Use the commit SHA as the build id so it lines up with `/api/version`.
  generateBuildId: async () => buildId,
  // Build metadata exposed to the browser (read via `@/infrastructure/config/
  // build-info`). Vercel runs `npm run build`, so `npm_package_version` is the
  // version release-please writes into package.json.
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version ?? pkg.version,
    NEXT_PUBLIC_BUILD_ID: buildId,
    NEXT_PUBLIC_COMMIT_SHA: commitSha,
    NEXT_PUBLIC_GIT_REF: process.env.VERCEL_GIT_COMMIT_REF ?? "",
    NEXT_PUBLIC_BUILT_AT: new Date().toISOString(),
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

const sentryBuildOptions = {
  org: "cradlen",
  project: "cradlen-web",
  // Quiet locally; verbose in CI so source-map upload issues are visible.
  silent: !process.env.CI,
  // Source-map upload only runs when SENTRY_AUTH_TOKEN is present (CI / Vercel).
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
};

export default withSentryConfig(
  withNextIntl(withBundleAnalyzer(withSerwist(withMDX(nextConfig)))),
  sentryBuildOptions,
);
