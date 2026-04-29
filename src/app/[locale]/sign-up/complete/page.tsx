import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Footer from "@/components/common/Footer";
import { Link } from "@/i18n/navigation";
import { SignUpCompleteForm } from "@/features/auth/components/SignUpCompleteForm";
import LogoIcon from "@/public/Logo-icon.png";
import Logo from "@/public/Logo.png";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SignUpCompletePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.signUp");

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="flex items-center justify-between px-8 py-5">
        <Link href="/" aria-label="Cradlen home" className="inline-flex">
          <Image
            src={Logo}
            alt="CRADLEN"
            loading="eager"
            height={36}
            className="w-auto"
          />
        </Link>
        <Link
          href="/sign-in"
          className="text-base text-brand-secondary transition-opacity hover:opacity-80"
        >
          {t("alreadyHaveAccount")}
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-5">
        <div className="w-full max-w-xl flex flex-col items-center gap-7">
          <Image
            src={LogoIcon}
            alt="Cradlen"
            loading="eager"
            width={100}
            height={100}
          />
          <SignUpCompleteForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
