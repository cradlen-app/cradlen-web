import { setRequestLocale } from "next-intl/server";
import { MedicalRepOverviewPage } from "@/features/medical-rep/components/visit/MedicalRepOverviewPage";

type Props = {
  params: Promise<{
    locale: string;
    orgId: string;
    branchId: string;
    repId: string;
  }>;
};

export default async function MedicalRepOverviewRoutePage({ params }: Props) {
  const { locale, repId } = await params;
  setRequestLocale(locale);

  return <MedicalRepOverviewPage repId={repId} />;
}
