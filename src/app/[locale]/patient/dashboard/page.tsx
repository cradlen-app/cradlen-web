import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PatientDashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("patientDashboard");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-brand-black">{t("welcome")}</h1>
    </div>
  );
}
