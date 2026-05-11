"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/error";
import { useUpdateVisit } from "../hooks/useUpdateVisit";
import { useUpdateVisitStatus } from "../hooks/useUpdateVisitStatus";
import {
  CHIEF_COMPLAINT_CATEGORIES,
  CHIEF_COMPLAINT_MAX,
  type ChiefComplaintCategory,
} from "../lib/visits.constants";
import type { Visit } from "../types/visits.types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: Visit | null;
  onCompleted?: () => void;
};

export function CompleteVisitDialog(props: Props) {
  return (
    <Dialog.Root open={props.open} onOpenChange={props.onOpenChange}>
      {props.open && props.visit ? <DialogBody {...props} /> : null}
    </Dialog.Root>
  );
}

function DialogBody({ visit, onOpenChange, onCompleted }: Props) {
  const t = useTranslations("visits.actions.completeRequiresChiefComplaint");
  const updateVisit = useUpdateVisit();
  const updateStatus = useUpdateVisitStatus();
  const submitting = updateVisit.isPending || updateStatus.isPending;

  const [chiefComplaint, setChiefComplaint] = useState(visit?.chiefComplaint ?? "");
  const [categories, setCategories] = useState<ChiefComplaintCategory[]>(
    (visit?.chiefComplaintMeta?.categories ?? []).filter((c): c is ChiefComplaintCategory =>
      (CHIEF_COMPLAINT_CATEGORIES as readonly string[]).includes(c),
    ),
  );
  const [error, setError] = useState<string | null>(null);

  function toggleCategory(cat: ChiefComplaintCategory) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }

  async function handleSubmit() {
    if (!visit) return;
    const trimmed = chiefComplaint.trim();
    if (!trimmed) {
      setError(t("required"));
      return;
    }
    if (trimmed.length > CHIEF_COMPLAINT_MAX) {
      setError(t("tooLong"));
      return;
    }
    setError(null);

    try {
      await updateVisit.mutateAsync({
        visitId: visit.id,
        body: {
          chief_complaint: trimmed,
          ...(categories.length
            ? { chief_complaint_meta: { categories } }
            : {}),
        },
        branchId: visit.branchId,
      });
      await updateStatus.mutateAsync({
        visitId: visit.id,
        status: "COMPLETED",
        branchId: visit.branchId,
      });
      toast.success(t("successToast"));
      onOpenChange(false);
      onCompleted?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("genericError")));
    }
  }

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl outline-none">
        <Dialog.Title className="text-base font-semibold text-brand-black">
          {t("title")}
        </Dialog.Title>
        <Dialog.Description className="mt-1 text-xs text-gray-500">
          {t("description")}
        </Dialog.Description>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-brand-black">
              {t("label")}
            </span>
            <textarea
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              rows={3}
              maxLength={CHIEF_COMPLAINT_MAX}
              placeholder={t("placeholder")}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-brand-black outline-none focus:border-brand-primary/40 focus:ring-2 focus:ring-brand-primary/20"
            />
            <div className="flex items-center justify-between pt-1">
              {error ? (
                <p className="text-[11px] text-red-500">{error}</p>
              ) : (
                <span />
              )}
              <span className="text-[11px] text-gray-400 tabular-nums">
                {chiefComplaint.length}/{CHIEF_COMPLAINT_MAX}
              </span>
            </div>
          </label>

          <div>
            <span className="text-xs font-medium text-brand-black">
              {t("categoriesLabel")}
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {CHIEF_COMPLAINT_CATEGORIES.map((cat) => {
                const active = categories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex h-8 items-center rounded-full border px-3 text-[11px] font-medium transition-colors",
                      active
                        ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                        : "border-gray-200 bg-white text-gray-500 hover:border-brand-primary/30 hover:text-brand-black",
                    )}
                  >
                    {t(`categories.${cat}`)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <Dialog.Close className="inline-flex h-9 items-center rounded-full border border-gray-200 px-4 text-xs font-medium text-gray-600 hover:bg-gray-50">
            {t("cancel")}
          </Dialog.Close>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-primary px-5 text-xs font-semibold text-white transition-colors hover:bg-brand-primary/90",
              "disabled:bg-brand-primary/50",
            )}
          >
            {submitting && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
            {t("submit")}
          </button>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
