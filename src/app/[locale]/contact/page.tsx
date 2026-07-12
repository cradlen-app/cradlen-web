import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
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
import { Link } from "@/i18n/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

const SUPPORT_EMAIL = "cradlen.app@gmail.com";

type ContactCard = {
  id: "sales" | "support" | "help";
  title: string;
  body: string;
  action: string;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("seo");

  return buildMetadata({
    locale,
    path: "contact",
    title: t("contact.title"),
    description: t("contact.description"),
  });
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("contactPage");
  const tSeo = await getTranslations("seo");

  const cards = t.raw("cards") as ContactCard[];

  // v1 routes sales/support to email rather than a form: a form needs a backend
  // endpoint and spam protection, which is its own change.
  const hrefFor = (id: ContactCard["id"]) =>
    id === "help"
      ? "/help-center"
      : `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
          id === "sales" ? "Cradlen demo request" : "Cradlen support",
        )}`;

  const structuredData = graph(
    organizationSchema(),
    websiteSchema(locale),
    {
      "@type": "ContactPage",
      url: urlFor(locale, "contact"),
      name: tSeo("contact.title"),
      description: tSeo("contact.description"),
      inLanguage: locale,
      mainEntity: { "@id": `${urlFor(locale)}#organization` },
    },
    breadcrumbListSchema(
      [
        { name: "Cradlen", path: "" },
        { name: t("eyebrow"), path: "contact" },
      ],
      locale,
    ),
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F3EC] text-brand-black">
      <JsonLd data={structuredData} />
      <MarketingHeader />

      <main className="flex-1">
        <section className="mx-auto w-full max-w-3xl px-5 pt-16 text-center sm:px-8 lg:pt-24">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-primary">
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight text-brand-black sm:text-5xl">
            {t("heading")}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-brand-black/60 sm:text-base">
            {t("subheading")}
          </p>
        </section>

        <section className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {cards.map((card) => {
              const href = hrefFor(card.id);
              const label = (
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary">
                  {card.action}
                  <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
                </span>
              );

              return (
                <div
                  key={card.id}
                  className="flex flex-col rounded-[24px] bg-white p-7 ring-1 ring-black/[0.05]"
                >
                  <h2 className="text-base font-semibold text-brand-black">
                    {card.title}
                  </h2>
                  <p className="mt-3 flex-1 text-sm leading-6 text-brand-black/65">
                    {card.body}
                  </p>

                  {card.id === "help" ? (
                    <Link href={href} className="group">
                      {label}
                    </Link>
                  ) : (
                    <a href={href} className="group">
                      {label}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
