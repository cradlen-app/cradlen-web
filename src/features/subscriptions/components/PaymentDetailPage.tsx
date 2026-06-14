"use client";

import { useState } from "react";
import {
  ArrowLeft,
  FileText,
  Loader2,
  Trash2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getActiveProfile } from "@/features/auth/lib/current-user";
import { Link } from "@/i18n/navigation";
import { useDashboardPath } from "@/hooks/useDashboardPath";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/infrastructure/http/api";
import {
  useCancelPayment,
  usePayment,
  useRemoveProof,
} from "../hooks/useSubscription";
import { formatDate, formatMoney } from "../lib/format";
import { loadInstructions } from "../lib/instructions-store";
import { PaymentStatusBadge } from "./status-badges";
import { ProofUploader } from "./ProofUploader";

const OPEN_STATUSES = ["PENDING", "AWAITING_VERIFICATION"];

export function PaymentDetailPage({ paymentId }: { paymentId: string }) {
  const t = useTranslations("subscriptions");
  const locale = useLocale();
  const dashboardPath = useDashboardPath();
  const { data: user } = useCurrentUser();
  const organizationId = getActiveProfile(user)?.organization.id;

  const { data, isLoading, isError } = usePayment(organizationId, paymentId);
  const cancel = useCancelPayment(organizationId);
  const removeProof = useRemoveProof(organizationId, paymentId);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const payment = data?.data;
  const isOpen = payment ? OPEN_STATUSES.includes(payment.status) : false;
  const instructions = loadInstructions(paymentId);
  const listHref = dashboardPath("/settings/subscription/payments");

  function onCancel() {
    cancel.mutate(paymentId, {
      onSuccess: () => {
        toast.success(t("detail.cancelled"));
        setConfirmCancel(false);
      },
      onError: (error) =>
        toast.error(
          error instanceof ApiError
            ? (error.messages[0] ?? t("detail.cancelError"))
            : t("detail.cancelError"),
        ),
    });
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-4 overflow-y-auto p-4 lg:p-6">
      <Link
        href={listHref as Parameters<typeof Link>[0]["href"]}
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-brand-black"
      >
        <ArrowLeft className="size-4" />
        {t("detail.back")}
      </Link>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : isError || !payment ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-red-500">
          {t("detail.loadError")}
        </div>
      ) : (
        <>
          <header className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm shadow-gray-100/60">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase text-brand-primary">
                  {t("detail.title")}
                </p>
                <h1 className="mt-1 text-2xl font-medium text-brand-black">
                  {formatMoney(payment.amount, payment.currency, locale)}
                </h1>
                <p className="mt-1 text-sm text-gray-400">
                  {t(`createDialog.providers.${payment.provider}`)} ·{" "}
                  {formatDate(payment.created_at, locale)}
                </p>
              </div>
              <PaymentStatusBadge status={payment.status} />
            </div>
            {payment.status === "REJECTED" && payment.rejection_reason && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {payment.rejection_reason}
              </p>
            )}
          </header>

          {isOpen && (
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm shadow-gray-100/60">
              <h2 className="text-base font-medium text-brand-black">
                {t("detail.instructions")}
              </h2>
              {instructions ? (
                <dl className="mt-3 rounded-xl border border-gray-100 px-3">
                  <Row label={t("detail.payTo")} value={instructions.pay_to} />
                  <Row
                    label={t("detail.amount")}
                    value={formatMoney(
                      payment.amount,
                      payment.currency,
                      locale,
                    )}
                  />
                  <Row label={t("detail.reference")} value={payment.id} />
                  <p className="py-3 text-sm text-gray-500">
                    {instructions.note}
                  </p>
                </dl>
              ) : (
                <p className="mt-2 text-sm text-gray-500">
                  {t("detail.instructionsFallback", { reference: payment.id })}
                </p>
              )}
            </section>
          )}

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm shadow-gray-100/60">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-medium text-brand-black">
                {t("detail.proofs")}
              </h2>
              {isOpen && organizationId && (
                <ProofUploader
                  organizationId={organizationId}
                  paymentId={payment.id}
                />
              )}
            </div>

            {payment.proofs && payment.proofs.length > 0 ? (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {payment.proofs.map((proof) => (
                  <li
                    key={proof.id}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 p-3"
                  >
                    {proof.content_type?.startsWith("image/") && proof.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={proof.url}
                        alt="proof"
                        className="size-14 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="flex size-14 items-center justify-center rounded-lg bg-gray-50 text-gray-400">
                        <FileText className="size-6" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      {proof.url ? (
                        <a
                          href={proof.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-brand-primary hover:underline"
                        >
                          {t("detail.viewProof")}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">
                          {t("detail.viewProof")}
                        </span>
                      )}
                      <p className="text-xs text-gray-400">
                        {formatDate(proof.created_at, locale)}
                      </p>
                    </div>
                    {isOpen && (
                      <button
                        type="button"
                        disabled={removeProof.isPending}
                        onClick={() =>
                          removeProof.mutate(proof.id, {
                            onSuccess: () => toast.success(t("proof.removed")),
                            onError: () => toast.error(t("proof.error")),
                          })
                        }
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        aria-label={t("proof.remove")}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-gray-400">{t("detail.noProofs")}</p>
            )}
          </section>

          {isOpen && (
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm shadow-gray-100/60">
              {confirmCancel ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-gray-600">
                    {t("detail.cancelConfirm")}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setConfirmCancel(false)}
                    >
                      {t("detail.keep")}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={cancel.isPending}
                      onClick={onCancel}
                    >
                      {cancel.isPending && (
                        <Loader2 className="size-4 animate-spin" />
                      )}
                      {t("detail.cancel")}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setConfirmCancel(true)}
                >
                  {t("detail.cancel")}
                </Button>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-gray-100 py-3 last:border-0 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-xs font-medium uppercase text-gray-400">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-brand-black">{value}</dd>
    </div>
  );
}
