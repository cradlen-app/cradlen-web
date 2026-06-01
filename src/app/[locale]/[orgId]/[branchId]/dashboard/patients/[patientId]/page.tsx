import { setRequestLocale } from "next-intl/server";
import { PatientWorkspacePage } from "@/features/patients/components/patient-workspace/PatientWorkspacePage";

type Props = {
  params: Promise<{
    locale: string;
    orgId: string;
    branchId: string;
    patientId: string;
  }>;
};

export default async function PatientDetailRoutePage({ params }: Props) {
  const { locale, patientId } = await params;
  setRequestLocale(locale);

  return <PatientWorkspacePage patientId={patientId} />;
}
