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
    <footer className="border-t border-gray-200 bg-white px-6 py-5 md:px-8">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <Link href="/" aria-label="Cradlen home" className="inline-flex">
          <Image
            src={LogoIcon}
            alt="CRADLEN"
            className="block h-6 w-auto sm:hidden"
          />
          <Image
            src={Logo}
            alt="CRADLEN"
            className="hidden h-7 w-auto sm:block"
          />
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
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

      <div className="mt-5 border-t border-gray-100 pt-4 text-center text-xs text-gray-500">
        © {t("copyright")}
      </div>
    </footer>
  );
}
