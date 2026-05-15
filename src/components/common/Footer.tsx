"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import Logo from "@/public/Logo.png";
import LogoIcon from "@/public/Logo-icon.png";
import LanguageSelect from "./LanguageSelect";

export default function Footer() {
  const locale = useLocale();
  const t = useTranslations("auth.signUp");

  return (
    <footer className="border-t border-gray-200 bg-inherit px-6 py-4 md:px-8">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          aria-label="Cradlen home"
          className="inline-flex items-center gap-2"
        >
          <Image src={LogoIcon} alt="" aria-hidden className="h-7 w-auto" />
          <Image src={Logo} alt="CRADLEN" className="h-7 w-auto" />
        </Link>

        <nav className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <a
            href="#"
            className="text-sm text-gray-500 transition-colors hover:text-brand-primary"
          >
            {t("termsOfService")}
          </a>
          <a
            href="#"
            className="text-sm text-gray-500 transition-colors hover:text-brand-primary"
          >
            {t("privacyPolicy")}
          </a>
          <a
            href="#"
            className="text-sm text-gray-500 transition-colors hover:text-brand-primary"
          >
            {t("helpCenter")}
          </a>
          <LanguageSelect currentLocale={locale as Locale} />
        </nav>
      </div>

      <div className="mt-2 border-t border-gray-100 pt-4 text-center text-xs text-gray-500 sm:text-center">
        © {t("copyright")}
      </div>
    </footer>
  );
}
