import { setRequestLocale } from "next-intl/server";
import { CashSessionsPage } from "@/core/financial/pages";

type Props = {
  params: Promise<{ locale: string; orgId: string; branchId: string }>;
};

export default async function FinancialCashSessionsRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CashSessionsPage />;
}
