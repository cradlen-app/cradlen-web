import type { MetadataRoute } from "next";
import { SITE_URL } from "@/common/constants/site";

// Cradlen web is mostly an auth-gated multi-tenant dashboard. Keep the API and
// every non-public app route out of the index; only public content (landing,
// legal, help-center, /guide docs) should be crawled. Google's `*` wildcard
// matches across `/`, so `/*/dashboard` covers the locale-prefixed dynamic
// dashboard routes (`/[locale]/[orgId]/[branchId]/dashboard/...`).
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
        "/*/forgot-password",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
