import { setRequestLocale } from "next-intl/server";
import { ServicesPage } from "@/core/financial/pages";

type Props = {
  params: Promise<{ locale: string; orgId: string; branchId: string }>;
};

export default async function FinancialServicesRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ServicesPage />;
}
