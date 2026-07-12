import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildMetadata } from "@/common/seo/metadata";
import {
  graph,
  organizationSchema,
  softwareApplicationSchema,
  websiteSchema,
} from "@/common/seo/schema";
import JsonLd from "@/components/seo/JsonLd";
import { RedirectIfAuthenticated } from "@/features/auth/components/RedirectIfAuthenticated";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import Hero from "@/components/marketing/Hero";
import WhyJourneys from "@/components/marketing/WhyJourneys";
import WhatsInside from "@/components/marketing/WhatsInside";
// import Testimonial from "@/components/marketing/Testimonial";
import PatientPortal from "@/components/marketing/PatientPortal";
import HowItWorks from "@/components/marketing/HowItWorks";
import Pricing from "@/components/marketing/Pricing";
import FinalCta from "@/components/marketing/FinalCta";
import MarketingFooter from "@/components/marketing/MarketingFooter";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("seo");

  return buildMetadata({
    locale,
    path: "",
    // `absolute` because the landing title already ends in "| Cradlen"; the root
    // layout's "%s | Cradlen" template would otherwise double the suffix.
    title: { absolute: t("home.title") },
    description: t("home.description"),
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("seo");
  const structuredData = graph(
    organizationSchema(),
    websiteSchema(locale),
    softwareApplicationSchema(locale, t("home.description")),
  );

  return (
    <div className="min-h-screen bg-[#F4F3EC] text-brand-black">
      <JsonLd data={structuredData} />
      <RedirectIfAuthenticated />
      <MarketingHeader />
      <main>
        <Hero />
        <WhyJourneys />
        <WhatsInside />
        {/* <Testimonial /> — temporarily hidden */}
        <PatientPortal />
        <HowItWorks />
        <Pricing />
        <FinalCta />
      </main>
      <MarketingFooter />
    </div>
  );
}
