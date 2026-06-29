"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { BUILD_INFO, shortCommit } from "@/infrastructure/config/build-info";
import LanguageSelect from "./LanguageSelect";

export default function Footer() {
  const locale = useLocale();
  const t = useTranslations("auth.signUp");
  const tg = useTranslations("userGuide");
  const tu = useTranslations("appUpdate");

  // Show the version only; keep the commit in the hover tooltip for support so
  // it's recoverable without surfacing it in plain view.
  const versionLabel = `v${BUILD_INFO.version}`;
  const versionTitle = shortCommit
    ? `${tu("versionLabel")} ${versionLabel} · ${shortCommit}`
    : `${tu("versionLabel")} ${versionLabel}`;

  return (
    <footer className="border-t border-gray-200 bg-inherit px-6 py-4 md:px-8">
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">
          © {t("copyright")}
          <span className="ms-2 text-gray-400" title={versionTitle}>
            {versionLabel}
          </span>
        </p>
        <nav className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Link
            href="/terms-of-service"
            className="text-sm text-gray-500 transition-colors hover:text-brand-primary"
          >
            {t("termsOfService")}
          </Link>
          <Link
            href="/privacy-policy"
            className="text-sm text-gray-500 transition-colors hover:text-brand-primary"
          >
            {t("privacyPolicy")}
          </Link>
          <Link
            href="/guide"
            className="text-sm text-gray-500 transition-colors hover:text-brand-primary"
          >
            {tg("navLabel")}
          </Link>
          <Link
            href="/help-center"
            className="text-sm text-gray-500 transition-colors hover:text-brand-primary"
          >
            {t("helpCenter")}
          </Link>
          <LanguageSelect currentLocale={locale as Locale} />
        </nav>
      </div>
    </footer>
  );
}
