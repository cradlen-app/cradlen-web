/**
 * schema.org builders. Hand-typed rather than pulling in `schema-dts` — the set
 * of schemas here is small and static.
 *
 * Every page emits ONE JSON-LD block containing an `@graph` array whose nodes
 * cross-reference each other by `@id`, which is how Google ties the Organization
 * to the WebSite to the page.
 *
 * NOTE: `SoftwareApplication` deliberately carries NO `offers`. Pricing is in
 * EGP while the product is positioned English-first/global, and `Offer` requires
 * a machine-readable `price` + `priceCurrency`. Emitting it would tell Google
 * this is an Egyptian-priced product. Add offers once the currency question is
 * settled — see the pricing note in the SEO plan.
 */
import { SITE_URL } from "@/common/constants/site";
import { urlFor } from "@/common/seo/metadata";

const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;

const SUPPORT_EMAIL = "cradlen.app@gmail.com";

export function organizationSchema() {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: "Cradlen",
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
    email: SUPPORT_EMAIL,
    description:
      "Clinic management and EMR software for OB-GYN and women's health clinics.",
  };
}

export function websiteSchema(locale: string) {
  return {
    "@type": "WebSite",
    "@id": SITE_ID,
    name: "Cradlen",
    url: urlFor(locale),
    inLanguage: locale,
    publisher: { "@id": ORG_ID },
  };
}

export function softwareApplicationSchema(locale: string, description: string) {
  return {
    "@type": "SoftwareApplication",
    name: "Cradlen",
    url: urlFor(locale),
    applicationCategory: "HealthApplication",
    applicationSubCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: locale,
    description,
    publisher: { "@id": ORG_ID },
  };
}

type FaqCategory = { items: { q: string; a: string }[] };

/** Built from the categories the help-center page already computes. */
export function faqPageSchema(categories: FaqCategory[]) {
  return {
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#faq`,
    mainEntity: categories.flatMap((c) =>
      c.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    ),
  };
}

/** `items` are ordered root -> leaf and mirror the visual breadcrumb. */
export function breadcrumbListSchema(
  items: { name: string; path: string }[],
  locale: string,
) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: urlFor(locale, item.path),
    })),
  };
}

export function techArticleSchema(args: {
  locale: string;
  path: string;
  headline: string;
  description: string;
}) {
  return {
    "@type": "TechArticle",
    headline: args.headline,
    description: args.description,
    inLanguage: args.locale,
    url: urlFor(args.locale, args.path),
    mainEntityOfPage: { "@type": "WebPage", "@id": urlFor(args.locale, args.path) },
    isPartOf: { "@id": SITE_ID },
    publisher: { "@id": ORG_ID },
  };
}

/** Wrap nodes into the single `@graph` document a page emits. */
export function graph(...nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}
