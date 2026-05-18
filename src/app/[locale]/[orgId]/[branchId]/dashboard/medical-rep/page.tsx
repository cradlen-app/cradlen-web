import { setRequestLocale } from "next-intl/server";
import { MedicalRepPage } from "@/features/medical-rep/components/MedicalRepPage";

type Props = {
  params: Promise<{ locale: string; orgId: string; branchId: string }>;
};

export default async function MedicalRepRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <MedicalRepPage />;
}
