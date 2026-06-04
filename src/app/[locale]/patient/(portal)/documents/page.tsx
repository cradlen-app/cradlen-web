import { setRequestLocale } from "next-intl/server";

import { DocumentsScreen } from "@/core/patient-portal/pages";

type Props = { params: Promise<{ locale: string }> };

export default async function PatientDocumentsRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DocumentsScreen />;
}
