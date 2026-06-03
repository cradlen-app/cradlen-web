import { setRequestLocale } from "next-intl/server";
import { VisitWorkspaceSwitch } from "@/features/visits/components/visit-workspace/VisitWorkspaceSwitch";

type Props = {
  params: Promise<{
    locale: string;
    orgId: string;
    branchId: string;
    visitId: string;
  }>;
  searchParams: Promise<{ kind?: string }>;
};

export default async function VisitDetailRoutePage({
  params,
  searchParams,
}: Props) {
  const { locale, visitId } = await params;
  const { kind } = await searchParams;
  setRequestLocale(locale);

  return <VisitWorkspaceSwitch visitId={visitId} kind={kind} />;
}
