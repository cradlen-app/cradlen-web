import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import Footer from "@/components/common/Footer";
import { Link } from "@/i18n/navigation";
import { JoinCodePage } from "@/features/staff/components/JoinCodePage";
import Logo from "@/public/Logo.png";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function StaffJoinCodeRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

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
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <JoinCodePage />
      </main>
      <Footer />
    </div>
  );
}
