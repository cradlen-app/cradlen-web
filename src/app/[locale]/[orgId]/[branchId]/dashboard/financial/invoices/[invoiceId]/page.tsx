import { setRequestLocale } from "next-intl/server";
import { InvoiceDetailPage } from "@/core/financial/pages";

type Params = Promise<{
  locale: string;
  orgId: string;
  branchId: string;
  invoiceId: string;
}>;

export default async function FinancialInvoiceDetailRoute({
  params,
}: {
  params: Params;
}) {
  const { locale, invoiceId } = await params;
  setRequestLocale(locale);

  return <InvoiceDetailPage invoiceId={invoiceId} />;
}
