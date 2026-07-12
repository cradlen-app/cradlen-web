import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildMetadata } from "@/common/seo/metadata";
import {
  breadcrumbListSchema,
  faqPageSchema,
  graph,
  organizationSchema,
  websiteSchema,
} from "@/common/seo/schema";
import JsonLd from "@/components/seo/JsonLd";
import { Link } from "@/i18n/navigation";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import HelpCenterFaq from "@/components/marketing/HelpCenterFaq";
import Logo from "@/public/Logo.png";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("seo");

  return buildMetadata({
    locale,
    path: "help-center",
    title: t("helpCenter.title"),
    description: t("helpCenter.description"),
  });
}

// Category ids double as anchor targets and as message keys under
// `helpCenter.categories.<id>`. Order here is the rendered order.
const CATEGORY_IDS = [
  "getting-started",
  "accounts-roles",
  "visits-patients",
  "billing-subscriptions",
  "patient-portal",
  "account-troubleshooting",
] as const;

const SUPPORT_EMAIL = "cradlen.app@gmail.com";

export default async function HelpCenterPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("helpCenter");

  const categories = CATEGORY_IDS.map((id) => ({
    id,
    title: t(`categories.${id}.title`),
    items: t.raw(`categories.${id}.items`) as { q: string; a: string }[],
  }));

  const structuredData = graph(
    organizationSchema(),
    websiteSchema(locale),
    faqPageSchema(categories),
    breadcrumbListSchema(
      [
        { name: "Cradlen", path: "" },
        { name: t("title"), path: "help-center" },
      ],
      locale,
    ),
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F3EC] text-brand-black">
      <JsonLd data={structuredData} />
      <header className="border-b border-black/10">
        <div className="mx-auto flex w-full max-w-7xl items-center px-5 py-5 sm:px-8">
          <Link href="/" aria-label="Cradlen home" className="inline-flex w-28">
            <Image src={Logo} alt="CRADLEN" className="h-auto w-full" priority />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold sm:text-4xl">{t("title")}</h1>
          <p className="mt-3 text-sm leading-7 text-brand-black/70">
            {t("subtitle")}
          </p>
        </div>

        <HelpCenterFaq categories={categories} />

        <section className="mt-12 rounded-2xl border border-black/10 bg-white/60 p-6">
          <h2 className="text-lg font-semibold text-brand-black">
            {t("contact.heading")}
          </h2>
          <p className="mt-2 text-sm leading-7 text-brand-black/70">
            {t("contact.body")}
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-3 inline-block text-sm font-medium text-brand-primary hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
