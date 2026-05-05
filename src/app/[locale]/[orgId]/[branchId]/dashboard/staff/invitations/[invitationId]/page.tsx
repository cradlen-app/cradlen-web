import { setRequestLocale } from "next-intl/server";
import { StaffInvitationsPage } from "@/features/staff/components/StaffInvitationsPage";

type Props = {
  params: Promise<{
    locale: string;
    orgId: string;
    branchId: string;
    invitationId: string;
  }>;
};

export default async function StaffInvitationDetailRoute({ params }: Props) {
  const { locale, invitationId } = await params;
  setRequestLocale(locale);

  return <StaffInvitationsPage initialSelectedId={invitationId} />;
}
