import { setRequestLocale } from "next-intl/server";
import { MedicalRepVisitPage } from "@/features/medical-rep/components/visit/MedicalRepVisitPage";

type Props = {
  params: Promise<{
    locale: string;
    orgId: string;
    branchId: string;
    visitId: string;
  }>;
};

export default async function MedicalRepVisitRoutePage({ params }: Props) {
  const { locale, visitId } = await params;
  setRequestLocale(locale);

  return <MedicalRepVisitPage visitId={visitId} />;
}
