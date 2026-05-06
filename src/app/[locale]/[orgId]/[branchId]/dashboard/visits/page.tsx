import { setRequestLocale } from "next-intl/server";
import { VisitsPage } from "@/features/dashboard-home/components/VisitsPage";

type Props = {
  params: Promise<{ locale: string; orgId: string; branchId: string }>;
};

export default async function VisitsRoutePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <VisitsPage />;
}
