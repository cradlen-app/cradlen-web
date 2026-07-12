import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildMetadata, urlFor } from "@/common/seo/metadata";
import {
  breadcrumbListSchema,
  graph,
  organizationSchema,
  websiteSchema,
} from "@/common/seo/schema";
import JsonLd from "@/components/seo/JsonLd";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";
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
    path: "about",
    title: t("about.title"),
    description: t("about.description"),
  });
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("aboutPage");
  const tSeo = await getTranslations("seo");

  const sections = t.raw("sections") as { title: string; body: string }[];

  const structuredData = graph(
    organizationSchema(),
    websiteSchema(locale),
    {
      "@type": "AboutPage",
      url: urlFor(locale, "about"),
      name: tSeo("about.title"),
      description: tSeo("about.description"),
      inLanguage: locale,
      mainEntity: { "@id": `${urlFor(locale)}#organization` },
    },
    breadcrumbListSchema(
      [
        { name: "Cradlen", path: "" },
        { name: t("eyebrow"), path: "about" },
      ],
      locale,
    ),
  );

  return (
    <div className="min-h-screen bg-[#F4F3EC] text-brand-black">
      <JsonLd data={structuredData} />
      <MarketingHeader />

      <main>
        <section className="mx-auto w-full max-w-3xl px-5 pt-16 sm:px-8 lg:pt-24">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-primary">
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight text-brand-black sm:text-5xl">
            {t("heading")}
          </h1>
          <p className="mt-6 text-base leading-8 text-brand-black/70">
            {t("intro")}
          </p>
        </section>

        <section className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8">
          <div className="space-y-10">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-xl font-semibold text-brand-black">
                  {section.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-brand-black/70">
                  {section.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <FinalCta />
      </main>

      <MarketingFooter />
    </div>
  );
}
