import { setRequestLocale } from "next-intl/server";
import { StaffPage } from "@/core/staff/pages";

type Props = {
  params: Promise<{ locale: string; orgId: string; branchId: string }>;
};

export default async function StaffRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <StaffPage />;
}
