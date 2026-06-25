/**
 * Structure + ordering for the public documentation hub (`/[locale]/guide`).
 *
 * This is the single source of truth for which sections and articles exist and
 * the order they render in (sidebar + index). Human-readable labels live in the
 * `userGuide` namespace of `src/messages/{en,ar}.json` (keyed by section id and
 * article slug) so they stay parity-checked across locales; article *bodies*
 * are MDX resolved through `./registry.ts`.
 *
 * Adding an article: add its slug here AND create both
 * `./en/<slug>.mdx` and `./ar/<slug>.mdx` plus the `registry.ts` switch cases
 * and the `userGuide.articles.<slug>` message keys.
 */

export type GuideSectionId =
  | "getting-started"
  | "features"
  | "patient-portal"
  | "roles";

export interface GuideSection {
  /** Doubles as the `userGuide.sections.<id>` message key. */
  id: GuideSectionId;
  /** Article slugs in render order. */
  articles: string[];
}

export const GUIDE_SECTIONS: readonly GuideSection[] = [
  { id: "getting-started", articles: ["getting-started"] },
  {
    id: "features",
    // Order mirrors the in-app sidebar (src/core/shell/nav.ts + financial/staff
    // nav order values) so the guide nav matches what users see in the product.
    articles: [
      "dashboard",
      "visits",
      "calendar",
      "financial",
      "patients",
      "staff",
      "medicine",
      "settings",
    ],
  },
  { id: "patient-portal", articles: ["patient-portal"] },
  { id: "roles", articles: ["roles-and-permissions"] },
] as const;

/** Flat list of every article slug, in render order. */
export const GUIDE_SLUGS: readonly string[] = GUIDE_SECTIONS.flatMap(
  (section) => section.articles,
);

export function isGuideSlug(slug: string): boolean {
  return GUIDE_SLUGS.includes(slug);
}

export function getSectionIdForSlug(slug: string): GuideSectionId | null {
  const section = GUIDE_SECTIONS.find((s) => s.articles.includes(slug));
  return section ? section.id : null;
}
