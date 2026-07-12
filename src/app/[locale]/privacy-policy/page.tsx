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
    path: "privacy-policy",
    title: t("legal.privacy.title"),
    description: t("legal.privacy.description"),
  });
}

// Section ids double as anchor targets and as message keys under
// `privacyPolicy.sections.<id>`. Order here is the rendered + TOC order.
const PRIVACY_SECTION_IDS = [
  "introduction",
  "data-we-collect",
  "how-we-use",
  "data-storage",
  "international-transfers",
  "data-sharing",
  "security",
  "data-retention",
  "your-rights",
  "cookies",
  "childrens-data",
  "changes",
  "contact",
] as const;

export default async function PrivacyPolicyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <LegalDocument namespace="privacyPolicy" sectionIds={PRIVACY_SECTION_IDS} />
  );
}
