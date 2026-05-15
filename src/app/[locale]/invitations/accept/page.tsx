import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import Footer from "@/components/common/Footer";
import { Link } from "@/i18n/navigation";
import { StaffInviteAcceptance } from "@/core/staff/pages";
import Logo from "@/public/Logo.png";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function InvitationAcceptPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-8 sm:py-5">
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

      <main className="flex min-h-[calc(100vh-5rem)] items-start justify-center px-4 py-10">
        <StaffInviteAcceptance />
      </main>
      <Footer />
    </div>
  );
}
