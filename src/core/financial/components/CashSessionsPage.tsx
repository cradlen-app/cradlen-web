"use client";

import { useMemo, useState } from "react";
import { AlertDialog, Dialog } from "radix-ui";
import { Loader2, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { useStaff } from "@/core/staff/api";

import {
  useCashSessions,
  useCloseCashSession,
  useCurrentCashSession,
  useOpenCashSession,
  useReconcileCashSession,
} from "../hooks/useCashSessions";
import type { CashSession } from "../types/financial.types";
import { FinancialPageShell } from "./FinancialPageShell";
import {
  CashSessionsHistoryTable,
  CurrentCashSessionCard,
  money,
} from "./cash-session-ui";

const inputClass = cn(
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900",
  "placeholder:text-gray-400 outline-none transition-colors",
  "focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20",
);

export function CashSessionsPage() {
  const t = useTranslations("financial.cashSessions");
  const tCommon = useTranslations("financial.common");
  const orgId = useAuthContextStore((s) => s.organizationId);
  const branchId = useAuthContextStore((s) => s.branchId);
  const profileId = useAuthContextStore((s) => s.profileId);

  const staffQuery = useStaff(orgId ?? undefined, branchId ?? undefined);
  // Cash session `profile_id` equals a StaffMember `id` (both the Profile id),
  // so we can resolve who opened each drawer.
  const nameByProfileId = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of staffQuery.data ?? []) {
      map.set(member.id, `${member.firstName} ${member.lastName}`.trim());
    }
    return map;
  }, [staffQuery.data]);

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

  // Cash carried from the most recent closed/reconciled session's counted amount.
  const lastCountedFloat = useMemo<string | null>(() => {
    const closed = sessions.filter(
      (s) =>
        s.counted_amount != null &&
        (s.status === "CLOSED" || s.status === "RECONCILED"),
    );
    if (closed.length === 0) return null;
    const sortKey = (s: CashSession) => s.closed_at ?? s.opened_at ?? "";
    const latest = closed.reduce((a, b) => (sortKey(b) > sortKey(a) ? b : a));
    return latest.counted_amount;
  }, [sessions]);

  function openOpenDialog() {
    setOpeningFloat(lastCountedFloat ?? "0");
    setOpenDialog(true);
  }

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
    // Require an explicit count — never silently submit 0, which would
    // manufacture a phantom variance against the expected cash.
    if (countedAmount.trim() === "") return;
    closeMutation.mutate(
      {
        id: closeTarget.id,
        payload: {
          counted_amount: Number(countedAmount),
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
            className="rounded-full bg-brand-primary text-white hover:bg-brand-primary/90"
            onClick={openOpenDialog}
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
          <CurrentCashSessionCard
            current={current}
            onClose={() => setCloseTarget(current)}
          />
        ) : (
          <section className="rounded-2xl border border-dashed border-gray-200 py-10 text-center">
            <p className="text-sm font-medium text-gray-700">{t("noOpenSession")}</p>
            <p className="mt-1 text-sm text-gray-400">{t("noOpenSessionHint")}</p>
          </section>
        )}

        <CashSessionsHistoryTable
          sessions={sessions}
          isLoading={historyLoading}
          nameByProfileId={nameByProfileId}
          profileId={profileId}
          onReconcile={setReconcileTarget}
        />
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
            {lastCountedFloat != null && (
              <p className="mt-1.5 text-xs text-gray-400">
                {t("carriedFromLastSession", { amount: money(lastCountedFloat) })}
              </p>
            )}
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
            <p className="mt-1.5 text-xs text-gray-400">{t("countedHint")}</p>
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
                disabled={closeMutation.isPending || countedAmount.trim() === ""}
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
