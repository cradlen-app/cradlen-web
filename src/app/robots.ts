import type { MetadataRoute } from "next";
import { SITE_URL } from "@/common/constants/site";

// Cradlen web is mostly an auth-gated multi-tenant dashboard. Keep the API and
// every non-public app route out of the index; only public content (landing,
// legal, help-center, /guide docs) should be crawled. Google's `*` wildcard
// matches across `/`, so `/*/dashboard` covers the locale-prefixed dynamic
// dashboard routes (`/[locale]/[orgId]/[branchId]/dashboard/...`).
//
// The routes listed here are all auth-walled — a crawler reaching one gets a
// 307 to sign-in, so there is nothing to read and blocking the crawl costs
// nothing. Pages that ARE publicly reachable but shouldn't rank (sign-in,
// sign-up, forgot-password) are deliberately NOT disallowed: they're linked
// from every header and footer, and `Disallow` only blocks the crawl — Google
// can still index the URL as a bare, description-less result. They carry
// `noindex, follow` in their page metadata instead, which requires the crawler
// to actually fetch them to see it.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/*/dashboard",
        "/*/select-profile",
        "/*/create-organization",
        "/*/invitations",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
