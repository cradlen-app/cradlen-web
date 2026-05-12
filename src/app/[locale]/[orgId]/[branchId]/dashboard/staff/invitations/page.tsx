import dynamic from "next/dynamic";
import { setRequestLocale } from "next-intl/server";

const StaffInvitationsPage = dynamic(
  () => import("@/core/staff/components/StaffInvitationsPage").then((m) => m.StaffInvitationsPage),
  { loading: () => null },
);

type Props = {
  params: Promise<{ locale: string; orgId: string; branchId: string }>;
};

export default async function StaffInvitationsRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <StaffInvitationsPage />;
}
