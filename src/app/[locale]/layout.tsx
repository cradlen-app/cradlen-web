import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import LocaleDocumentSync from "@/i18n/LocaleDocumentSync";
import { routing, type Locale } from "@/i18n/routing";
import { Providers } from "@/components/Providers";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Locale-aware defaults for any page that forgets to build its own metadata.
// Intentionally carries NO `alternates` — canonical must stay page-owned, or
// every child page inherits this segment's canonical (see common/seo/metadata).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("seo");

  return {
    description: t("home.description"),
    openGraph: {
      type: "website",
      siteName: "Cradlen",
      locale: locale === "ar" ? "ar_EG" : "en_US",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();
  const currentLocale = locale as Locale;

  return (
    <NextIntlClientProvider messages={messages}>
      <Providers>
        <LocaleDocumentSync locale={currentLocale} />
        {children}
      </Providers>
    </NextIntlClientProvider>
  );
}
