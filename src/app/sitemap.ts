import type { MetadataRoute } from "next";
import { SITE_URL } from "@/common/constants/site";
import { routing } from "@/i18n/routing";
import { GUIDE_SLUGS } from "@/content/guide/manifest";

// Only genuinely public content is listed. Auth/action/thin pages (sign-in,
// sign-up, forgot-password, invitations/accept, select-profile,
// create-organization) and all dashboard routes are excluded on purpose.
//
// next-intl has no `localePrefix` configured, so it defaults to "always":
// every URL is locale-prefixed (`/en/...`, `/ar/...`) and the bare `/`
// redirects to `/en`. Each entry lists all locales via `alternates.languages`
// for hreflang.
const CONTENT_PATHS: { path: string; priority: number }[] = [
  { path: "", priority: 1.0 },
  { path: "help-center", priority: 0.5 },
  { path: "guide", priority: 0.7 },
  { path: "guide/whats-new", priority: 0.7 },
  ...GUIDE_SLUGS.map((slug) => ({ path: `guide/${slug}`, priority: 0.6 })),
  { path: "terms-of-service", priority: 0.3 },
  { path: "privacy-policy", priority: 0.3 },
];

const urlFor = (locale: string, path: string) =>
  `${SITE_URL}/${locale}${path ? `/${path}` : ""}`;

export default function sitemap(): MetadataRoute.Sitemap {
  return CONTENT_PATHS.flatMap(({ path, priority }) =>
    routing.locales.map((locale) => ({
      url: urlFor(locale, path),
      priority,
      changeFrequency: "monthly" as const,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, urlFor(l, path)]),
        ),
      },
    })),
  );
}
