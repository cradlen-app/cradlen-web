import dynamic from "next/dynamic";
import { setRequestLocale } from "next-intl/server";

const PaymentDetailPage = dynamic(
  () =>
    import("@/features/subscriptions/components/PaymentDetailPage").then(
      (m) => m.PaymentDetailPage,
    ),
  { loading: () => null },
);

type Props = {
  params: Promise<{
    locale: string;
    orgId: string;
    branchId: string;
    paymentId: string;
  }>;
};

export default async function SubscriptionPaymentDetailPage({
  params,
}: Props) {
  const { locale, paymentId } = await params;
  setRequestLocale(locale);

  return <PaymentDetailPage paymentId={paymentId} />;
}
