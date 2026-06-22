"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { closePregnancy, type PregnancyOutcomeType } from "../lib/pregnancy.api";

interface Props {
  visitId: string;
  /** Pregnancy lifecycle status from the descriptor (ACTIVE while ongoing). */
  journeyStatus: string;
}

const OUTCOME_TYPES: PregnancyOutcomeType[] = [
  "LIVE_BIRTH",
  "MISCARRIAGE",
  "STILLBIRTH",
  "ECTOPIC",
  "TERMINATION",
  "TRANSFERRED",
  "LOST_TO_FOLLOWUP",
  "OTHER",
];

const DELIVERY_MODES = ["VAGINAL", "CESAREAN", "ASSISTED"] as const;

/**
 * Pregnancy status control in the tab header. Status is a SELECT; choosing
 * "Closed" opens the outcome drawer (works with or without a delivery) which
 * calls `POST /pregnancy/close` and completes the journey. Once closed, the
 * select is disabled. Replaces the old standalone "record delivery" button.
 */
export function PregnancyStatusControl({ visitId, journeyStatus }: Props) {
  const t = useTranslations("pregnancy");
  const qc = useQueryClient();
  const isActive = journeyStatus === "ACTIVE";

  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [outcomeType, setOutcomeType] =
    useState<PregnancyOutcomeType>("LIVE_BIRTH");
  const [deliveryMode, setDeliveryMode] =
    useState<(typeof DELIVERY_MODES)[number]>("VAGINAL");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  function onStatusChange(value: string) {
    if (value === "CLOSED" && isActive) setOpen(true);
  }

  async function handleConfirm() {
    setClosing(true);
    try {
      await closePregnancy(visitId, {
        outcome_type: outcomeType,
        delivery_mode:
          outcomeType === "LIVE_BIRTH" ? deliveryMode : undefined,
        date: date || undefined,
        notes: notes || undefined,
      });
      await qc.invalidateQueries({ queryKey: ["visit-journey", visitId] });
      toast.success(t("closed"));
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("closeError"));
    } finally {
      setClosing(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">{t("statusLabel")}</span>
      <select
        className="rounded border border-gray-200 px-2 py-1 text-xs"
        value={isActive ? "ACTIVE" : "CLOSED"}
        disabled={!isActive || closing}
        onChange={(e) => onStatusChange(e.target.value)}
      >
        <option value="ACTIVE">{t("statusActive")}</option>
        <option value="CLOSED">{t("statusClosed")}</option>
      </select>

      <Dialog.Root
        open={open}
        onOpenChange={(next) => {
          // Closing the drawer without confirming reverts to Active (no write).
          if (!closing) setOpen(next);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-60 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-61 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl outline-none">
            <Dialog.Title className="text-sm font-medium text-gray-800">
              {t("closeTitle")}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-xs text-gray-500">
              {t("closeDescription")}
            </Dialog.Description>

            <div className="mt-4 space-y-3">
              <label className="block text-xs text-gray-600">
                {t("outcomeType")}
                <select
                  value={outcomeType}
                  onChange={(e) =>
                    setOutcomeType(e.target.value as PregnancyOutcomeType)
                  }
                  className="mt-1 w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                >
                  {OUTCOME_TYPES.map((o) => (
                    <option key={o} value={o}>
                      {t(`outcome_${o}`)}
                    </option>
                  ))}
                </select>
              </label>

              {outcomeType === "LIVE_BIRTH" && (
                <label className="block text-xs text-gray-600">
                  {t("modeOfDelivery")}
                  <select
                    value={deliveryMode}
                    onChange={(e) =>
                      setDeliveryMode(
                        e.target.value as (typeof DELIVERY_MODES)[number],
                      )
                    }
                    className="mt-1 w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                  >
                    {DELIVERY_MODES.map((m) => (
                      <option key={m} value={m}>
                        {t(`mode${m.charAt(0)}${m.slice(1).toLowerCase()}`)}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="block text-xs text-gray-600">
                {t("outcomeDate")}
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                />
              </label>
              <label className="block text-xs text-gray-600">
                {t("notes")}
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <Dialog.Close asChild>
                <Button variant="outline" size="sm" disabled={closing}>
                  {t("cancel")}
                </Button>
              </Dialog.Close>
              <Button
                size="sm"
                className="bg-brand-primary"
                disabled={closing}
                onClick={handleConfirm}
              >
                {closing ? (
                  <Loader2 size={14} className="mr-1 animate-spin" />
                ) : null}
                {t("closePregnancy")}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
