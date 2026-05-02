import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import Footer from "@/components/common/Footer";
import { Link } from "@/i18n/navigation";
import { SelectProfilePage } from "@/features/auth/components/SelectProfilePage";
import Logo from "@/public/Logo.png";
import LogoIcon from "@/public/Logo-icon.png";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SelectProfileRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="flex items-center justify-between px-8 py-5">
        <Link
          href="/"
          aria-label="Cradlen home"
          className="w-30 shrink-0 inline-flex"
        >
          <Image src={Logo} alt="CRADLEN" loading="eager" className="w-auto" />
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl flex flex-col items-center gap-5">
          <Image
            src={LogoIcon}
            alt="Cradlen"
            loading="eager"
            width={90}
            height={90}
          />
          <SelectProfilePage />
        </div>
      </main>
      <Footer />
    </div>
  );
}
