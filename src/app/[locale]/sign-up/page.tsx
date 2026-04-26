import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SignUpForm } from "@/features/auth/components/SignUpForm";
import LogoIcon from "@/public/Logo-icon.png";
import Logo from "@/public/Logo.png";
import Footer from "@/components/common/Footer";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SignUpPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.signUp");

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5">
        <Image
          src={Logo}
          alt="CRADLEN"
          loading="eager"
          height={36}
          className="w-auto"
        />
        <Link
          href="/sign-in"
          className="text-base text-brand-secondary hover:opacity-80 transition-opacity"
        >
          {t("alreadyHaveAccount")}
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-5">
        <div className="w-full max-w-xl flex flex-col items-center gap-7">
          <Image
            src={LogoIcon}
            alt="Cradlen"
            loading="eager"
            width={100}
            height={100}
          />

          {/* <h1 className="text-xl font-medium text-brand-black">{t("title")}</h1> */}

          <SignUpForm />
        </div>
      </main>

      {/* Footer */}
      <Footer params={params} />
    </div>
  );
}
