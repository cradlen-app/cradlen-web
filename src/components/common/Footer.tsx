import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import LanguageSelect from "./LanguageSelect";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Footer({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.signUp");

  return (
    <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 px-8 py-4">
      <p className="text-xs text-black">© {t("copyright")}</p>
      <nav className="flex items-center gap-6">
        <a
          href="#"
          className="text-xs text-black hover:text-gray-600 transition-colors"
        >
          {t("termsOfService")}
        </a>
        <a
          href="#"
          className="text-xs text-black hover:text-gray-600 transition-colors"
        >
          {t("privacyPolicy")}
        </a>
        <a
          href="#"
          className="text-xs text-black hover:text-gray-600 transition-colors"
        >
          {t("helpCenter")}
        </a>
        <LanguageSelect currentLocale={locale as Locale} />
      </nav>
    </footer>
  );
}
