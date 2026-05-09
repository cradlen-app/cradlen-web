import { setRequestLocale } from "next-intl/server";
import { CalendarPage } from "@/features/calendar/components/CalendarPage";

type Props = {
  params: Promise<{ locale: string; orgId: string; branchId: string }>;
};

export default async function CalendarRoutePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CalendarPage />;
}
