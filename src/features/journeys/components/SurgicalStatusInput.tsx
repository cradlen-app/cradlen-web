"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldShell } from "@/builder/fields/field-shell";
import type { FieldInputProps } from "@/builder/fields/input-props";
import { closeSurgical, type SurgicalOutcomeType } from "../lib/surgical.api";
import { useJourneyClinicalContext } from "../lib/journey-clinical-context";

const OUTCOME_TYPES: SurgicalOutcomeType[] = [
  "COMPLETED",
  "ABORTED",
  "CONVERTED",
  "TRANSFERRED",
  "DECEASED",
  "OTHER",
];

/**
 * Editable surgical status, rendered inside the read-only Summary (custom builder
 * input, `config.ui.variant='surgical-status'`). The field value is the current
 * status (ACTIVE/CLOSED). Choosing "Closed" opens the outcome drawer and calls
 * `POST /surgical/close`; once closed the select is disabled. visitId comes from
 * `JourneyClinicalContext`.
 */
export function SurgicalStatusInput({ field, value, required }: FieldInputProps) {
  const t = useTranslations("surgical");
  const ctx = useJourneyClinicalContext();
  const qc = useQueryClient();

  const isActive = (value ?? "ACTIVE") === "ACTIVE";
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [outcomeType, setOutcomeType] =
    useState<SurgicalOutcomeType>("COMPLETED");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  function onStatusChange(next: string) {
    if (next === "CLOSED" && isActive && ctx) setOpen(true);
  }

  async function handleConfirm() {
    if (!ctx) return;
    setClosing(true);
    try {
      await closeSurgical(ctx.visitId, {
        outcome_type: outcomeType,
        date: date || undefined,
        notes: notes || undefined,
      });
      await qc.invalidateQueries({ queryKey: ["visit-journey", ctx.visitId] });
      toast.success(t("closed"));
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("closeError"));
    } finally {
      setClosing(false);
    }
  }

  return (
    <FieldShell label={field.label} required={required}>
      <select
        className="w-full rounded border-b border-gray-200 bg-transparent py-2 text-xs text-brand-black focus:outline-none"
        value={isActive ? "ACTIVE" : "CLOSED"}
        disabled={!isActive || closing || !ctx}
        onChange={(e) => onStatusChange(e.target.value)}
      >
        <option value="ACTIVE">{t("statusActive")}</option>
        <option value="CLOSED">{t("statusClosed")}</option>
      </select>

      <Dialog.Root
        open={open}
        onOpenChange={(next) => {
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
                    setOutcomeType(e.target.value as SurgicalOutcomeType)
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
                {t("closeSurgical")}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </FieldShell>
  );
}
