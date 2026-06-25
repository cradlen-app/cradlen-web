import type { Metadata } from "next";
import { ArrowRight, Rocket } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { GUIDE_SECTIONS } from "@/content/guide/manifest";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("userGuide");
  return { title: t("title"), description: t("subtitle") };
}

export default async function GuideIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("userGuide");

  return (
    <div>
      <header className="mb-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-medium text-brand-primary">
          <Rocket className="size-3.5" aria-hidden />
          {t("title")}
        </span>
        <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">{t("heading")}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-brand-black/70">
          {t("subtitle")}
        </p>
      </header>

      <div className="space-y-6">
        {GUIDE_SECTIONS.map((section) => (
          <section
            key={section.id}
            className="rounded-2xl border border-black/10 bg-white/60 p-6"
          >
            <h2 className="text-lg font-semibold text-brand-black">
              {t(`sections.${section.id}.title`)}
            </h2>
            <p className="mt-1 text-sm leading-6 text-brand-black/60">
              {t(`sections.${section.id}.description`)}
            </p>

            <ul className="mt-4 divide-y divide-black/5">
              {section.articles.map((slug) => (
                <li key={slug}>
                  <Link
                    href={`/guide/${slug}`}
                    className="group flex items-center justify-between gap-4 py-3"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-brand-black group-hover:text-brand-primary">
                        {t(`articles.${slug}.title`)}
                      </span>
                      <span className="mt-0.5 block text-sm text-brand-black/55">
                        {t(`articles.${slug}.description`)}
                      </span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-brand-black/30 transition-colors group-hover:text-brand-primary rtl:rotate-180" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="mt-8 flex flex-col items-start justify-between gap-3 rounded-2xl border border-black/10 bg-white/60 p-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-semibold text-brand-black">
            {t("helpCta.heading")}
          </h2>
          <p className="mt-1 text-sm text-brand-black/60">{t("helpCta.body")}</p>
        </div>
        <Link
          href="/help-center"
          className="shrink-0 text-sm font-medium text-brand-primary hover:underline"
        >
          {t("helpCta.link")}
        </Link>
      </section>
    </div>
  );
}
