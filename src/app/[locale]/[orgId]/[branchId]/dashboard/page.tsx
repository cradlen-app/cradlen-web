import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string; orgId: string; branchId: string }>;
};

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return null;
}
