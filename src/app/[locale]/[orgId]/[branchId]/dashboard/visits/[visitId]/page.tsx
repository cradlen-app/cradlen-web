import { setRequestLocale } from "next-intl/server";
import { VisitWorkspacePage } from "@/features/visits/components/visit-workspace/VisitWorkspacePage";

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

  return <VisitWorkspacePage visitId={visitId} />;
}
