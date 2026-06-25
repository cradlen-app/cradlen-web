import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import GuideSidebar, {
  type GuideNavSection,
} from "@/components/marketing/guide/GuideSidebar";
import { GUIDE_SECTIONS } from "@/content/guide/manifest";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function GuideLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("userGuide");

  const sections: GuideNavSection[] = GUIDE_SECTIONS.map((section) => ({
    id: section.id,
    title: t(`sections.${section.id}.title`),
    items: section.articles.map((slug) => ({
      href: `/guide/${slug}`,
      label: t(`articles.${slug}.title`),
    })),
  }));

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F3EC] text-brand-black">
      <MarketingHeader />

      <div className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
          <GuideSidebar
            overview={{ href: "/guide", label: t("overview") }}
            sections={sections}
            whatsNew={{ href: "/guide/whats-new", label: t("whatsNew.title") }}
            menuLabel={t("title")}
          />
          <main className="min-w-0">{children}</main>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
