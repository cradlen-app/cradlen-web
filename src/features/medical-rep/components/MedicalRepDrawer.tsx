"use client";

import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MedicalRep } from "../types/medical-rep.types";

interface Props {
  rep: MedicalRep | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleStatus: (rep: MedicalRep) => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function MedicalRepDrawer({ rep, open, onOpenChange, onToggleStatus }: Props) {
  const t = useTranslations("medicalRep.drawer");

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/25 transition-opacity" />
        <Dialog.Content className="fixed inset-y-0 inset-e-0 z-[41] flex w-full max-w-[480px] flex-col bg-white shadow-2xl outline-none">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <p className="text-xs text-gray-400">{t("breadcrumb")}</p>
              <Dialog.Title className="mt-0.5 text-base font-bold text-brand-black">
                {rep?.full_name ?? t("title")}
              </Dialog.Title>
            </div>
            <Dialog.Close className="mt-0.5 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
              <X className="size-4" aria-hidden />
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            {rep && (
              <>
                <ReadField label={t("phone")} value={rep.phone ?? "—"} />
                <ReadField label={t("nationalId")} value={rep.national_id ?? "—"} />
                <ReadField label={t("company")} value={rep.company_name ?? "—"} />
                <div className="grid grid-cols-2 gap-3">
                  <ReadField label={t("lastVisit")} value={formatDate(rep.last_visit_date)} />
                  <ReadField label={t("totalVisits")} value={String(rep.visits_count)} />
                </div>

                {/* Products */}
                <div>
                  <p className="mb-1.5 text-sm font-semibold text-gray-700">{t("products")}</p>
                  {rep.products.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {rep.products.map((p) => (
                        <span
                          key={p}
                          className="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-600"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">—</p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <p className="mb-1.5 text-sm font-semibold text-gray-700">{t("notes")}</p>
                  <p className="text-sm text-gray-600">{rep.notes ?? "—"}</p>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                {t("cancel")}
              </button>
            </Dialog.Close>
            {rep && (
              <button
                type="button"
                onClick={() => onToggleStatus(rep)}
                className={
                  rep.status === "active"
                    ? "rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                    : "rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90"
                }
              >
                {rep.status === "active" ? t("blockButton") : t("unblockButton")}
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-gray-700">{label}</p>
      <p className="text-sm text-gray-600">{value}</p>
    </div>
  );
}
