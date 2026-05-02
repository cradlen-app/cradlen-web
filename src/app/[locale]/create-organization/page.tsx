import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/common/Footer";
import { Link } from "@/i18n/navigation";
import { CreateOrganizationPage } from "@/features/organizations/components/CreateOrganizationPage";
import Logo from "@/public/Logo.png";
import LogoIcon from "@/public/Logo-icon.png";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function CreateOrganizationRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("createOrganization");

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
        <Link
          href="/select-profile"
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 transition hover:border-gray-300 hover:text-brand-black"
        >
          <ArrowLeft className="size-4" />
          {t("backToProfiles")}
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl flex flex-col items-center gap-6">
          <Image
            src={LogoIcon}
            alt="Cradlen"
            loading="eager"
            width={72}
            height={72}
          />
          <CreateOrganizationPage />
        </div>
      </main>
      <Footer />
    </div>
  );
}
