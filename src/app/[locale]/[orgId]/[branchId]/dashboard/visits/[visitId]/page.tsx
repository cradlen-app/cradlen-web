import { setRequestLocale } from "next-intl/server";
import { VisitDetailPage } from "@/features/visits/components/VisitDetailPage";

type Props = {
  params: Promise<{
    locale: string;
    orgId: string;
    branchId: string;
    visitId: string;
  }>;
};

export default async function VisitDetailRoutePage({ params }: Props) {
  const { locale, visitId } = await params;
  setRequestLocale(locale);

  return <VisitDetailPage visitId={visitId} />;
}
