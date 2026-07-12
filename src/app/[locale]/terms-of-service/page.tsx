import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildMetadata } from "@/common/seo/metadata";
import LegalDocument from "@/components/marketing/LegalDocument";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("seo");

  return buildMetadata({
    locale,
    path: "terms-of-service",
    title: t("legal.terms.title"),
    description: t("legal.terms.description"),
  });
}

// Section ids double as anchor targets and as message keys under
// `termsOfService.sections.<id>`. Order here is the rendered + TOC order.
const TERMS_SECTION_IDS = [
  "introduction",
  "acceptance",
  "eligibility",
  "data-ownership",
  "responsibilities",
  "prohibited",
  "subscriptions",
  "intellectual-property",
  "confidentiality",
  "disclaimers",
  "liability",
  "termination",
  "changes",
  "governing-law",
  "contact",
] as const;

export default async function TermsOfServicePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <LegalDocument namespace="termsOfService" sectionIds={TERMS_SECTION_IDS} />
  );
}
