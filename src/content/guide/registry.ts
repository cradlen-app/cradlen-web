import type { ComponentType } from "react";
import type { Locale } from "@/i18n/routing";

/**
 * Resolves a guide article slug to its MDX component for a locale.
 *
 * Imports are static string literals inside nested switches (never template
 * literals): Turbopack can only pre-bundle statically-analysable import paths.
 * This mirrors the per-module message loading pattern in `src/core/*` and
 * `src/i18n/request.ts`. Returns `null` for an unknown slug so the route can
 * `notFound()`.
 */
export async function loadGuideArticle(
  locale: Locale,
  slug: string,
): Promise<ComponentType | null> {
  if (locale === "ar") {
    switch (slug) {
      case "getting-started":
        return (await import("./ar/getting-started.mdx")).default;
      case "visits":
        return (await import("./ar/visits.mdx")).default;
      case "financial":
        return (await import("./ar/financial.mdx")).default;
      case "roles-and-permissions":
        return (await import("./ar/roles-and-permissions.mdx")).default;
      default:
        return null;
    }
  }

  switch (slug) {
    case "getting-started":
      return (await import("./en/getting-started.mdx")).default;
    case "visits":
      return (await import("./en/visits.mdx")).default;
    case "financial":
      return (await import("./en/financial.mdx")).default;
    case "roles-and-permissions":
      return (await import("./en/roles-and-permissions.mdx")).default;
    default:
      return null;
  }
}
