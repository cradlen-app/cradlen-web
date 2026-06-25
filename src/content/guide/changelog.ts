import type { ComponentType } from "react";
import type { Locale } from "@/i18n/routing";

/**
 * Dated "What's new" entries, newest first. Each entry has an ISO `date` (shown
 * by the page) and a `slug` mapping to per-locale MDX under `./changelog/`.
 * The MDX body supplies the entry's heading + bullet list.
 *
 * Adding an entry: prepend it here and create
 * `./changelog/en/<slug>.mdx` + `./changelog/ar/<slug>.mdx` + a switch case.
 */
export interface ChangelogEntryRef {
  /** ISO date, e.g. "2026-06-25". */
  date: string;
  slug: string;
}

export const CHANGELOG_ENTRIES: readonly ChangelogEntryRef[] = [
  { date: "2026-06-25", slug: "2026-06-25-user-guide" },
  { date: "2026-06-01", slug: "2026-06-01-financial" },
] as const;

export async function loadChangelogEntry(
  locale: Locale,
  slug: string,
): Promise<ComponentType | null> {
  if (locale === "ar") {
    switch (slug) {
      case "2026-06-25-user-guide":
        return (await import("./changelog/ar/2026-06-25-user-guide.mdx")).default;
      case "2026-06-01-financial":
        return (await import("./changelog/ar/2026-06-01-financial.mdx")).default;
      default:
        return null;
    }
  }

  switch (slug) {
    case "2026-06-25-user-guide":
      return (await import("./changelog/en/2026-06-25-user-guide.mdx")).default;
    case "2026-06-01-financial":
      return (await import("./changelog/en/2026-06-01-financial.mdx")).default;
    default:
      return null;
  }
}
