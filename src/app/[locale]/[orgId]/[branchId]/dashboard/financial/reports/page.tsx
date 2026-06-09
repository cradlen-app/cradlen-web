import { setRequestLocale } from "next-intl/server";
import { ReportsPage } from "@/core/financial/pages";

type Props = {
  params: Promise<{ locale: string; orgId: string; branchId: string }>;
};

export default async function FinancialReportsRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ReportsPage />;
}
