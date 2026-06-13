import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { InvoiceSearchPage } from "@/core/financial/pages";

type Props = {
  params: Promise<{ locale: string; orgId: string; branchId: string }>;
};

export default async function FinancialInvoicesRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // InvoiceSearchPage reads `?invoice=` via useSearchParams, which Next.js
  // requires to sit under a Suspense boundary.
  return (
    <Suspense>
      <InvoiceSearchPage />
    </Suspense>
  );
}
