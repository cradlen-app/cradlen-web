import { setRequestLocale } from "next-intl/server";
import { PatientLayout } from "@/components/layout/PatientLayout";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function PatientGroupLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PatientLayout>{children}</PatientLayout>;
}
