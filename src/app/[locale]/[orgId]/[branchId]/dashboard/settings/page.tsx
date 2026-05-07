import dynamic from "next/dynamic";
import { setRequestLocale } from "next-intl/server";

const SettingsPage = dynamic(
  () => import("@/features/settings/components/SettingsPage").then((m) => m.SettingsPage),
  { loading: () => null },
);

type Props = {
  params: Promise<{ locale: string; orgId: string; branchId: string }>;
};

export default async function DashboardSettingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SettingsPage />;
}
