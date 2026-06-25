import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { CHANGELOG_ENTRIES, loadChangelogEntry } from "@/content/guide/changelog";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("userGuide");
  return { title: `${t("whatsNew.title")} — ${t("title")}`, description: t("whatsNew.subtitle") };
}

export default async function WhatsNewPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("userGuide");
  const dateFormat = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const entries = await Promise.all(
    CHANGELOG_ENTRIES.map(async (entry) => ({
      ...entry,
      label: dateFormat.format(new Date(entry.date)),
      Body: await loadChangelogEntry(locale as Locale, entry.slug),
    })),
  );

  return (
    <div>
      <header className="mb-10">
        <h1 className="text-3xl font-semibold sm:text-4xl">{t("whatsNew.title")}</h1>
        <p className="mt-3 text-sm leading-7 text-brand-black/70">
          {t("whatsNew.subtitle")}
        </p>
      </header>

      <ol className="relative space-y-10 border-s border-black/10 ps-6">
        {entries.map(({ slug, label, Body }) => (
          <li key={slug} className="relative">
            <span
              aria-hidden
              className="absolute -start-[1.6rem] top-1.5 size-3 rounded-full border-2 border-[#F4F3EC] bg-brand-primary"
            />
            <time className="text-xs font-medium uppercase tracking-[0.14em] text-brand-black/45">
              {label}
            </time>
            <div className="mt-2 prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-brand-black prose-h3:mt-0 prose-h3:text-lg prose-p:text-brand-black/80 prose-li:text-brand-black/80 prose-strong:text-brand-black">
              {Body ? <Body /> : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
