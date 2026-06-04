import { setRequestLocale } from "next-intl/server";

import { AppointmentsScreen } from "@/core/patient-portal/pages";

type Props = { params: Promise<{ locale: string }> };

export default async function PatientAppointmentsRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AppointmentsScreen />;
}
