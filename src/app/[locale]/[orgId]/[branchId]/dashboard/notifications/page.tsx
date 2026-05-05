import { setRequestLocale } from "next-intl/server";
import { NotificationsPageClient } from "@/features/notifications/components/NotificationsPageClient";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function NotificationsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <NotificationsPageClient />;
}
