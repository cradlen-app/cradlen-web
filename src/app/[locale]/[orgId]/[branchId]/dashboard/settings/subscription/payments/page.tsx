import dynamic from "next/dynamic";
import { setRequestLocale } from "next-intl/server";

const PaymentsListPage = dynamic(
  () =>
    import("@/features/subscriptions/components/PaymentsListPage").then(
      (m) => m.PaymentsListPage,
    ),
  { loading: () => null },
);

type Props = {
  params: Promise<{ locale: string; orgId: string; branchId: string }>;
};

export default async function SubscriptionPaymentsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PaymentsListPage />;
}
