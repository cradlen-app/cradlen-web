import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import LegalTableOfContents from "@/components/marketing/LegalTableOfContents";
import Logo from "@/public/Logo.png";

type Props = {
  /** Message namespace holding `title`, `lastUpdated`, `intro`, `tocLabel`, `sections`. */
  namespace: string;
  /** Section ids — each doubles as the anchor target and the `sections.<id>` message key. */
  sectionIds: readonly string[];
};

/**
 * Shared shell for public legal documents (Terms of Service, Privacy Policy):
 * a logo header, the document title/intro, a sticky table of contents, and the
 * anchored sections, followed by the marketing footer. Server component — reads
 * all prose from the given i18n namespace. Public (no auth redirect).
 */
export default async function LegalDocument({ namespace, sectionIds }: Props) {
  const t = await getTranslations(namespace);

  const sections = sectionIds.map((id) => ({
    id,
    heading: t(`sections.${id}.heading`),
    body: t.raw(`sections.${id}.body`) as string[],
    // `t.raw` returns the key string (not undefined) for a missing key, so guard
    // optional bullets with `t.has` — otherwise `.map` runs on a string and throws.
    bullets: t.has(`sections.${id}.bullets`)
      ? (t.raw(`sections.${id}.bullets`) as string[])
      : null,
  }));

  const tocItems = sections.map((section) => ({
    id: section.id,
    label: section.heading,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F3EC] text-brand-black">
      <header className="border-b border-black/10">
        <div className="mx-auto flex w-full max-w-7xl items-center px-5 py-5 sm:px-8">
          <Link href="/" aria-label="Cradlen home" className="inline-flex w-28">
            <Image src={Logo} alt="CRADLEN" className="h-auto w-full" priority />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-12 sm:px-8">
        <div className="mb-10 max-w-3xl">
          <h1 className="text-3xl font-semibold sm:text-4xl">{t("title")}</h1>
          <p className="mt-2 text-sm text-brand-black/55">{t("lastUpdated")}</p>
          <p className="mt-6 text-sm leading-7 text-brand-black/75">
            {t("intro")}
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
          <LegalTableOfContents items={tocItems} label={t("tocLabel")} />

          <article className="max-w-3xl space-y-12">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24"
              >
                <h2 className="text-xl font-semibold text-brand-black">
                  {section.heading}
                </h2>
                <div className="mt-4 space-y-4">
                  {section.body.map((paragraph, index) => (
                    <p
                      key={index}
                      className="text-sm leading-7 text-brand-black/75"
                    >
                      {paragraph}
                    </p>
                  ))}
                  {section.bullets ? (
                    <ul className="ms-5 list-disc space-y-2 text-sm leading-7 text-brand-black/75 marker:text-brand-secondary">
                      {section.bullets.map((bullet, index) => (
                        <li key={index}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </section>
            ))}
          </article>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
