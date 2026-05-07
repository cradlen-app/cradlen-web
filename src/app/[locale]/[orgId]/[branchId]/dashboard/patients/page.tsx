import { setRequestLocale } from "next-intl/server";
import { PatientsPage } from "@/features/patients/components/PatientsPage";
import Footer from "@/components/common/Footer";

type Props = {
  params: Promise<{ locale: string; orgId: string; branchId: string }>;
};

export default async function PatientsRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <PatientsPage />
      <Footer />
    </>
  );
}
