import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import LogoIcon from "@/public/Logo-icon.png";
import Logo from "@/public/Logo.png";
import Footer from "@/components/common/Footer";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ForgotPasswordPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="flex items-center px-8 py-5">
        <Image
          src={Logo}
          alt="CRADLEN"
          loading="eager"
          height={36}
          className="w-auto"
        />
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-100 flex flex-col items-center gap-5">
          <Image
            src={LogoIcon}
            alt="Cradlen"
            loading="eager"
            width={100}
            height={100}
          />

          <ForgotPasswordForm />
        </div>
      </main>

      {/* Footer */}
      <Footer params={params} />
    </div>
  );
}
