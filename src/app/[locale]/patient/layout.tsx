import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";

import { PatientDashboardLayout } from "@/components/layout/PatientDashboardLayout";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function PatientPortalLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PatientDashboardLayout>{children}</PatientDashboardLayout>;
}
