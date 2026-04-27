import { setRequestLocale } from "next-intl/server";
import { StaffInvitationsPage } from "@/features/staff/components/StaffInvitationsPage";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function StaffInvitationsRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <StaffInvitationsPage />;
}
