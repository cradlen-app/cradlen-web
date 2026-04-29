import { setRequestLocale } from "next-intl/server";
import { SettingsPage } from "@/features/settings/components/SettingsPage";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardSettingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SettingsPage />;
}
