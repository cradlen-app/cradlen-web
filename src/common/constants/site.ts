/**
 * Canonical public base URL for the clinic web app (this repo), served at
 * `https://www.cradlen.com` (the bare apex `cradlen.com` 308-redirects here, so
 * `www` is the canonical host). Used for `metadataBase`, the sitemap, and
 * robots.txt. Override per environment with NEXT_PUBLIC_SITE_URL.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.cradlen.com";
