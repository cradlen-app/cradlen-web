import { setRequestLocale } from "next-intl/server";
import { OrgBranchContextSync } from "@/components/layout/OrgBranchContextSync";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string; orgId: string; branchId: string }>;
};

export default async function OrgBranchLayout({ children, params }: Props) {
  const { locale, orgId, branchId } = await params;
  setRequestLocale(locale);

  return (
    <OrgBranchContextSync orgId={orgId} branchId={branchId}>
      {children}
    </OrgBranchContextSync>
  );
}
