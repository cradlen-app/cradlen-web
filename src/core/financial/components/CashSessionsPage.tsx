"use client";

import { useState } from "react";
import { AlertDialog, Dialog } from "radix-ui";
import { Banknote, Loader2, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";

import {
  useCashSessions,
  useCloseCashSession,
  useCurrentCashSession,
  useOpenCashSession,
  useReconcileCashSession,
} from "../hooks/useCashSessions";
import { formatMoney } from "../lib/format";
import type { CashSession, CashSessionStatus } from "../types/financial.types";
import { FinancialPageShell } from "./FinancialPageShell";

const STATUS_STYLES: Record<CashSessionStatus, string> = {
  OPEN: "bg-emerald-50 text-emerald-700",
  CLOSED: "bg-amber-50 text-amber-700",
  RECONCILED: "bg-gray-100 text-gray-600",
};

const inputClass = cn(
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900",
  "placeholder:text-gray-400 outline-none transition-colors",
  "focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20",
);

function money(value: string | null) {
  return value == null ? "—" : formatMoney(Number(value));
}

function dateTime(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export function CashSessionsPage() {
  const t = useTranslations("financial.cashSessions");
  const tCommon = useTranslations("financial.common");
  const branchId = useAuthContextStore((s) => s.branchId);

  const { session: current, isLoading: currentLoading } = useCurrentCashSession();
  const { sessions, isLoading: historyLoading } = useCashSessions();
  const openMutation = useOpenCashSession();
  const closeMutation = useCloseCashSession();
  const reconcileMutation = useReconcileCashSession();

  const [openDialog, setOpenDialog] = useState(false);
  const [openingFloat, setOpeningFloat] = useState("0");
  const [closeTarget, setCloseTarget] = useState<CashSession | null>(null);
  const [countedAmount, setCountedAmount] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [reconcileTarget, setReconcileTarget] = useState<CashSession | null>(null);

  function handleOpen() {
    if (!branchId) return;
    openMutation.mutate(
      { branch_id: branchId, opening_float: Number(openingFloat) || 0 },
      {
        onSuccess: () => {
          setOpenDialog(false);
          setOpeningFloat("0");
        },
      },
    );
  }

  function handleClose() {
    if (!closeTarget) return;
    closeMutation.mutate(
      {
        id: closeTarget.id,
        payload: {
          counted_amount: Number(countedAmount) || 0,
          notes: closeNotes || undefined,
        },
      },
      {
        onSuccess: () => {
          setCloseTarget(null);
          setCountedAmount("");
          setCloseNotes("");
        },
      },
    );
  }

  return (
    <FinancialPageShell
      title={t("title")}
      subtitle={t("subtitle")}
      actions={
        !current && (
          <Button
            type="button"
            size="sm"
            onClick={() => setOpenDialog(true)}
            disabled={!branchId}
          >
            <Plus className="size-3.5" aria-hidden="true" />
            {t("open")}
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-6">
        {/* Current session */}
        {currentLoading ? (
          <div className="h-28 animate-pulse rounded-xl bg-gray-50" />
        ) : current ? (
          <section className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Banknote className="size-4 text-emerald-600" aria-hidden="true" />
                  <h2 className="text-sm font-semibold text-gray-800">
                    {t("currentSession")}
                  </h2>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      STATUS_STYLES[current.status],
                    )}
                  >
                    {t(`status.${current.status}`)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {t("openedAt", { time: dateTime(current.opened_at) })}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setCloseTarget(current)}
              >
                {t("close")}
              </Button>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label={t("openingFloat")} value={money(current.opening_float)} />
              <Stat
                label={t("collected")}
                value={money(current.summary?.collected ?? "0")}
              />
              <Stat
                label={t("paymentCount", {
                  count: current.summary?.payment_count ?? 0,
                })}
                value={String(current.summary?.payment_count ?? 0)}
              />
              <Stat
                label={t("expectedSoFar")}
                value={money(current.summary?.expected_so_far ?? current.opening_float)}
                emphasis
              />
            </dl>
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-gray-200 py-10 text-center">
            <p className="text-sm font-medium text-gray-700">
              {t("noOpenSession")}
            </p>
            <p className="mt-1 text-sm text-gray-400">{t("noOpenSessionHint")}</p>
          </section>
        )}

        {/* History */}
        <section>
          <h2 className="mb-2 text-sm font-medium text-gray-700">{t("history")}</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            {historyLoading ? (
              <p className="py-10 text-center text-sm text-gray-400">
                {t("loading")}
              </p>
            ) : sessions.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">
                {t("empty")}
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                    <th className="px-4 py-2.5 text-start font-medium">
                      {t("columns.opened")}
                    </th>
                    <th className="px-4 py-2.5 text-end font-medium">
                      {t("columns.openingFloat")}
                    </th>
                    <th className="px-4 py-2.5 text-end font-medium">
                      {t("columns.counted")}
                    </th>
                    <th className="px-4 py-2.5 text-end font-medium">
                      {t("columns.variance")}
                    </th>
                    <th className="px-4 py-2.5 text-start font-medium">
                      {t("columns.status")}
                    </th>
                    <th className="px-4 py-2.5 text-end font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-3 text-gray-600">
                        {dateTime(s.opened_at)}
                      </td>
                      <td className="px-4 py-3 text-end tabular-nums text-gray-700">
                        {money(s.opening_float)}
                      </td>
                      <td className="px-4 py-3 text-end tabular-nums text-gray-700">
                        {money(s.counted_amount)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 text-end tabular-nums",
                          s.variance != null && Number(s.variance) !== 0
                            ? "text-red-600"
                            : "text-gray-400",
                        )}
                      >
                        {money(s.variance)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            STATUS_STYLES[s.status],
                          )}
                        >
                          {t(`status.${s.status}`)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-end">
                        {s.status === "CLOSED" && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setReconcileTarget(s)}
                          >
                            {t("reconcile")}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {/* Open dialog */}
      <Dialog.Root open={openDialog} onOpenChange={setOpenDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-51 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl outline-none">
            <div className="flex items-start justify-between">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                {t("openTitle")}
              </Dialog.Title>
              <Dialog.Close className="rounded-lg p-1 text-gray-400 hover:bg-gray-50">
                <X className="size-5" aria-hidden="true" />
              </Dialog.Close>
            </div>
            <label className="mt-4 mb-1.5 block text-xs font-medium text-gray-700">
              {t("openingFloat")}
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={openingFloat}
              onChange={(e) => setOpeningFloat(e.target.value)}
              className={inputClass}
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenDialog(false)}
              >
                {/* reuse common cancel */}
                {tCommon("cancel")}
              </Button>
              <Button type="button" onClick={handleOpen} disabled={openMutation.isPending}>
                {openMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  t("openConfirm")
                )}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Close dialog */}
      <Dialog.Root
        open={!!closeTarget}
        onOpenChange={(o) => !o && setCloseTarget(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-51 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl outline-none">
            <div className="flex items-start justify-between">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                {t("closeTitle")}
              </Dialog.Title>
              <Dialog.Close className="rounded-lg p-1 text-gray-400 hover:bg-gray-50">
                <X className="size-5" aria-hidden="true" />
              </Dialog.Close>
            </div>
            {closeTarget?.summary && (
              <p className="mt-3 text-xs text-gray-500">
                {t("expectedSoFar")}: {money(closeTarget.summary.expected_so_far)}
              </p>
            )}
            <label className="mt-3 mb-1.5 block text-xs font-medium text-gray-700">
              {t("countedAmount")}
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={countedAmount}
              onChange={(e) => setCountedAmount(e.target.value)}
              className={inputClass}
            />
            <label className="mt-3 mb-1.5 block text-xs font-medium text-gray-700">
              {t("closeNotes")}
            </label>
            <textarea
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              rows={2}
              className={cn(inputClass, "resize-none")}
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCloseTarget(null)}
              >
                {tCommon("cancel")}
              </Button>
              <Button
                type="button"
                onClick={handleClose}
                disabled={closeMutation.isPending}
              >
                {closeMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  t("closeConfirm")
                )}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Reconcile confirm */}
      <AlertDialog.Root
        open={!!reconcileTarget}
        onOpenChange={(o) => !o && setReconcileTarget(null)}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/35" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-51 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl outline-none">
            <AlertDialog.Title className="text-lg font-medium text-gray-900">
              {t("reconcile")}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-gray-500">
              {t("reconcileConfirm")}
            </AlertDialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button type="button" variant="outline">
                  {tCommon("cancel")}
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (reconcileTarget) {
                      reconcileMutation.mutate(reconcileTarget.id, {
                        onSuccess: () => setReconcileTarget(null),
                      });
                    }
                  }}
                  disabled={reconcileMutation.isPending}
                >
                  {reconcileMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    t("reconcile")
                  )}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </FinancialPageShell>
  );
}

function Stat({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd
        className={cn(
          "mt-0.5 tabular-nums",
          emphasis ? "text-base font-semibold text-gray-900" : "text-sm text-gray-700",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
