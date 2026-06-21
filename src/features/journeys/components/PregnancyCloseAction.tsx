"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { closePregnancy } from "../lib/pregnancy.api";

interface Props {
  visitId: string;
  /** Pregnancy lifecycle status from the descriptor; the action only shows while ACTIVE. */
  journeyStatus: string;
}

/**
 * "Record delivery / Close pregnancy" action for the Pregnancy tab. Captures the
 * delivery outcome and calls `POST /pregnancy/close`, which completes the
 * journey. Refreshes the journey descriptor so the tab reflects the closed state.
 */
export function PregnancyCloseAction({ visitId, journeyStatus }: Props) {
  const t = useTranslations("pregnancy");
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [mode, setMode] = useState("VAGINAL");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  const deliveryModes = [
    { code: "VAGINAL", label: t("modeVaginal") },
    { code: "CESAREAN", label: t("modeCesarean") },
    { code: "ASSISTED", label: t("modeAssisted") },
  ];

  if (journeyStatus !== "ACTIVE") return null;

  async function handleClose() {
    setClosing(true);
    try {
      await closePregnancy(visitId, {
        mode,
        date: date || undefined,
        notes: notes || undefined,
      });
      await qc.invalidateQueries({ queryKey: ["visit-journey", visitId] });
      toast.success(t("closed"));
      setOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("closeError");
      toast.error(message);
    } finally {
      setClosing(false);
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!closing) setOpen(next);
      }}
    >
      <Dialog.Trigger asChild>
        <Button variant="outline" size="sm">
          {t("recordDelivery")}
        </Button>
      </Dialog.Trigger>
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
              {t("modeOfDelivery")}
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="mt-1 w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
              >
                {deliveryModes.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-gray-600">
              {t("deliveryDate")}
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
              onClick={handleClose}
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
  );
}
