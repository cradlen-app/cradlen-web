/**
 * Canonical public base URL for the clinic web app (this repo), served at
 * `https://cradlen.com`. Used for `metadataBase`, the sitemap, and robots.txt.
 * Override per environment with NEXT_PUBLIC_SITE_URL.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://cradlen.com";
