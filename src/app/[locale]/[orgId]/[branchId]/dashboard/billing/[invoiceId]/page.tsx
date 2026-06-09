import { redirect } from "@/i18n/navigation";

type Params = Promise<{
  locale: string;
  orgId: string;
  branchId: string;
  invoiceId: string;
}>;

/**
 * Back-compat: the invoice detail page moved to
 * `dashboard/financial/invoices/[invoiceId]` when financial migrated to
 * `@/core/financial`. Redirect any bookmarked `/billing/...` URLs.
 */
export default async function LegacyInvoiceDetailRedirect({
  params,
}: {
  params: Params;
}) {
  const { locale, orgId, branchId, invoiceId } = await params;
  redirect({
    href: `/${orgId}/${branchId}/dashboard/financial/invoices/${invoiceId}`,
    locale,
  });
}
