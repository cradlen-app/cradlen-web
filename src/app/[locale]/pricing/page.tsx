import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildMetadata } from "@/common/seo/metadata";
import {
  breadcrumbListSchema,
  faqPageSchema,
  graph,
  organizationSchema,
  softwareApplicationSchema,
  websiteSchema,
} from "@/common/seo/schema";
import JsonLd from "@/components/seo/JsonLd";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import HelpCenterFaq from "@/components/marketing/HelpCenterFaq";
import Pricing from "@/components/marketing/Pricing";
import FinalCta from "@/components/marketing/FinalCta";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("seo");

  return buildMetadata({
    locale,
    path: "pricing",
    title: t("pricing.title"),
    description: t("pricing.description"),
  });
}

// Note: no `RedirectIfAuthenticated` here (unlike the landing page). A signed-in
// user clicking "Pricing" should be able to read it, not get bounced to their
// dashboard.
export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("pricingPage");
  const tSeo = await getTranslations("seo");

  const faq = t.raw("faq") as { q: string; a: string }[];
  const faqCategories = [
    { id: "pricing-faq", title: t("faqHeading"), items: faq },
  ];

  // No `offers` on the SoftwareApplication — see the note in common/seo/schema.
  const structuredData = graph(
    organizationSchema(),
    websiteSchema(locale),
    softwareApplicationSchema(locale, tSeo("pricing.description")),
    faqPageSchema(faqCategories),
    breadcrumbListSchema(
      [
        { name: "Cradlen", path: "" },
        { name: t("eyebrow"), path: "pricing" },
      ],
      locale,
    ),
  );

  return (
    <div className="min-h-screen bg-[#F4F3EC] text-brand-black">
      <JsonLd data={structuredData} />
      <MarketingHeader />

      <main>
        <section className="mx-auto w-full max-w-7xl px-5 pb-12 pt-16 text-center sm:px-8 lg:pt-24">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-primary">
            {t("eyebrow")}
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight text-brand-black sm:text-5xl lg:text-6xl">
            {t("heading")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-brand-black/60 sm:text-base">
            {t("subheading")}
          </p>
        </section>

        {/* Same tiers the landing page renders. Its own eyebrow/heading block is
            suppressed here — this page already has an h1 and intro above. */}
        <Pricing showHeading={false} />

        <section className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-8">
          <HelpCenterFaq categories={faqCategories} />
        </section>

        <FinalCta />
      </main>

      <MarketingFooter />
    </div>
  );
}
