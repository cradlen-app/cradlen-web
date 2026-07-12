import type { Metadata } from "next";
import Image from "next/image";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Footer from "@/components/common/Footer";
import { Link } from "@/i18n/navigation";
import { SelectProfilePage } from "@/features/auth/components/SelectProfilePage";
import {
  AUTH_TOKEN_COOKIE,
  AUTH_SELECTION_TOKEN_COOKIE,
} from "@/features/auth/lib/auth.constants";
import Logo from "@/public/Logo.png";
import LogoIcon from "@/public/Logo-icon.png";

type Props = {
  params: Promise<{ locale: string }>;
};

// Authenticated-only step: never indexed, so it needs no canonical or SEO title.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function SelectProfileRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.selectProfile");

  const cookieStore = await cookies();
  const isAuthenticated =
    !!cookieStore.get(AUTH_TOKEN_COOKIE)?.value ||
    !!cookieStore.get(AUTH_SELECTION_TOKEN_COOKIE)?.value;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <Link
          href="/"
          aria-label="Cradlen home"
          className="w-28 shrink-0 inline-flex"
        >
          <Image src={Logo} alt="CRADLEN" loading="eager" className="w-auto" />
        </Link>
        {isAuthenticated && (
          <Link
            href="/create-organization"
            className="px-4 py-2 text-sm font-medium text-brand-primary"
          >
            {t("createOrganization")}
          </Link>
        )}
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl flex flex-col items-center gap-6">
          <Image
            src={LogoIcon}
            alt="Cradlen"
            loading="eager"
            width={80}
            height={80}
          />
          <SelectProfilePage />
        </div>
      </main>
      <Footer />
    </div>
  );
}
