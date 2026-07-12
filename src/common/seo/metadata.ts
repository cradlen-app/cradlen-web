import type { Metadata } from "next";
import { SITE_URL } from "@/common/constants/site";
import { routing, type Locale } from "@/i18n/routing";

/**
 * Absolute, locale-prefixed URL. `path` is locale-stripped and slash-free
 * ("" is the landing page). next-intl runs with the default
 * `localePrefix: "always"`, so every public URL carries its locale.
 */
export function urlFor(locale: string, path = "") {
  return `${SITE_URL}/${locale}${path ? `/${path}` : ""}`;
}

const OG_LOCALE: Record<Locale, string> = { en: "en_US", ar: "ar_EG" };

/**
 * The generated card from `src/app/opengraph-image.tsx`. Next only auto-injects
 * a file-convention image into pages that DON'T declare their own `openGraph`
 * object — and every page here does (for canonical/locale), so we must name it
 * explicitly or no `og:image` is emitted at all. Resolved against `metadataBase`.
 *
 * Extension-less by design; `src/proxy.ts` excludes this path from the auth gate.
 */
const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Cradlen — clinic management software for OB-GYN clinics",
};

/**
 * `x-default` points at the default locale rather than a bare `/` because the
 * unprefixed root only ever redirects to `/en` — pointing hreflang at a
 * redirect is what makes Google drop the annotation.
 */
export function alternatesFor(locale: string, path = ""): Metadata["alternates"] {
  return {
    canonical: urlFor(locale, path),
    languages: {
      ...Object.fromEntries(routing.locales.map((l) => [l, urlFor(l, path)])),
      "x-default": urlFor(routing.defaultLocale, path),
    },
  };
}

type BuildMetadataArgs = {
  locale: string;
  /** Locale-stripped path, no leading/trailing slash. "" is the landing page. */
  path?: string;
  /** `{ absolute }` opts out of the root layout's `%s | Cradlen` template. */
  title: string | { absolute: string };
  description: string;
  /** `false` emits `noindex, follow` — for auth and other thin pages. */
  index?: boolean;
  ogType?: "website" | "article";
};

/**
 * The single place canonical, hreflang, Open Graph and Twitter tags are built.
 * Every page routes through this so those tags are never hand-rolled and can
 * never drift apart.
 *
 * Deliberately never called from a layout: a layout-level `canonical` is
 * inherited by every child page that doesn't set its own, which would silently
 * canonicalize e.g. `/en/guide/visits` to `/en`.
 */
export function buildMetadata({
  locale,
  path = "",
  title,
  description,
  index = true,
  ogType = "website",
}: BuildMetadataArgs): Metadata {
  const currentLocale = locale as Locale;
  const plainTitle = typeof title === "string" ? title : title.absolute;

  return {
    title,
    description,
    alternates: alternatesFor(locale, path),
    ...(index ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      type: ogType,
      siteName: "Cradlen",
      url: urlFor(locale, path),
      title: plainTitle,
      description,
      locale: OG_LOCALE[currentLocale],
      alternateLocale: routing.locales
        .filter((l) => l !== currentLocale)
        .map((l) => OG_LOCALE[l]),
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: plainTitle,
      description,
      images: [OG_IMAGE],
    },
  };
}
