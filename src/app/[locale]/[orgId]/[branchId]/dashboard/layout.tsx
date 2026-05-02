import { setRequestLocale } from "next-intl/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string; orgId: string; branchId: string }>;
};

export default async function DashboardGroupLayout({
  children,
  params,
}: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <DashboardLayout>{children}</DashboardLayout>;
}
