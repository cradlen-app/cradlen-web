import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import LanguageSelect from "@/components/common/LanguageSelect";
import Logo from "@/public/Logo.png";

export default async function MarketingFooter() {
  const t = await getTranslations("home.footer");
  const locale = (await getLocale()) as Locale;

  const columns = [
    {
      label: t("productLabel"),
      links: [
        { text: t("product.features"), href: "#features" },
        { text: t("product.pricing"), href: "#pricing" },
        { text: t("product.howItWorks"), href: "#how-it-works" },
        { text: t("product.documentation"), href: "#docs" },
      ],
    },
    {
      label: t("companyLabel"),
      links: [
        { text: t("company.about"), href: "#" },
        { text: t("company.helpCenter"), href: "#" },
        { text: t("company.whyJourneys"), href: "#" },
      ],
    },
    {
      label: t("legalLabel"),
      links: [
        { text: t("legal.privacy"), href: "#" },
        { text: t("legal.terms"), href: "#" },
      ],
    },
  ];

  return (
    <footer className="border-t border-black/10 bg-[#F4F3EC]">
      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" aria-label="Cradlen home" className="inline-flex w-32">
              <Image src={Logo} alt="CRADLEN" className="h-auto w-full" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-brand-black/55">
              {t("tagline")}
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.label}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-black/45">
                {column.label}
              </p>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.text}>
                    <a
                      href={link.href}
                      className="text-sm text-brand-black/65 transition-colors hover:text-brand-primary"
                    >
                      {link.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-black/10 pt-6 sm:flex-row">
          <p className="text-xs text-brand-black/45">{t("copyright")}</p>
          <LanguageSelect currentLocale={locale} />
        </div>
      </div>
    </footer>
  );
}
