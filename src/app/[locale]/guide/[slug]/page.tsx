import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import ArticleToc from "@/components/marketing/guide/ArticleToc";
import { GUIDE_SLUGS, getSectionIdForSlug } from "@/content/guide/manifest";
import { loadGuideArticle } from "@/content/guide/registry";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

// Only the slugs in the manifest are valid; anything else is a true 404
// (returned before the layout streams, so the status is correct).
export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  if (!getSectionIdForSlug(slug)) return {};
  const t = await getTranslations("userGuide");
  return {
    title: `${t(`articles.${slug}.title`)} — ${t("title")}`,
    description: t(`articles.${slug}.description`),
  };
}

export default async function GuideArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const sectionId = getSectionIdForSlug(slug);
  const Article = await loadGuideArticle(locale as Locale, slug);
  if (!sectionId || !Article) notFound();

  const t = await getTranslations("userGuide");

  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_200px] xl:gap-10">
      <article className="min-w-0">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-1.5 text-xs text-brand-black/50"
        >
          <Link href="/guide" className="hover:text-brand-primary">
            {t("title")}
          </Link>
          <ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden />
          <span className="text-brand-black/70">
            {t(`sections.${sectionId}.title`)}
          </span>
        </nav>

        <div
          id="guide-article"
          className="prose prose-sm max-w-none prose-headings:scroll-mt-24 prose-headings:font-semibold prose-headings:text-brand-black prose-h1:text-3xl prose-h2:mt-10 prose-h2:text-2xl prose-h3:text-xl prose-p:text-brand-black/80 prose-a:text-brand-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-brand-black prose-li:text-brand-black/80 prose-code:rounded prose-code:bg-black/5 prose-code:px-1 prose-code:py-0.5 prose-code:font-normal prose-code:before:content-none prose-code:after:content-none"
        >
          <Article />
        </div>
      </article>

      <div className="hidden xl:block">
        <div className="sticky top-24">
          <ArticleToc label={t("onThisPage")} />
        </div>
      </div>
    </div>
  );
}
