import { setRequestLocale } from "next-intl/server";
import { MedicationsPage } from "@/features/medications/components/MedicationsPage";

type Props = {
  params: Promise<{ locale: string; orgId: string; branchId: string }>;
};

export default async function MedicinePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <MedicationsPage />;
}
