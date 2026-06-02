"use client";

import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import type { MedicalRepVisitHistoryItem } from "../../types/medical-rep.types";

type Props = {
  item: MedicalRepVisitHistoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const formatLocale = locale.startsWith("en") ? "en-GB" : locale;
  return new Intl.DateTimeFormat(formatLocale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function RepVisitDetailsDialog({ item, open, onOpenChange }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {open && item ? <DialogBody item={item} /> : null}
    </Dialog.Root>
  );
}

function DialogBody({ item }: { item: MedicalRepVisitHistoryItem }) {
  const t = useTranslations("medicalRep.visit.history");
  const locale = useLocale();
  const purpose = item.purpose ? t(`purposeValue.${item.purpose}`) : "—";
  const outcome = item.outcome ? t(`outcomeValue.${item.outcome}`) : "—";

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white shadow-2xl outline-none">
        <header className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="min-w-0">
            <Dialog.Title className="text-base font-semibold text-brand-black">
              {t("detailsTitle")}
            </Dialog.Title>
            <Dialog.Description className="mt-0.5 text-xs text-gray-500">
              {formatDate(item.scheduled_at, locale)}
            </Dialog.Description>
          </div>
          <Dialog.Close
            aria-label={t("detailsTitle")}
            className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="size-4" aria-hidden="true" />
          </Dialog.Close>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          <ReadField label={t("purpose")} value={purpose} />
          <ReadField label={t("outcome")} value={outcome} />
          <ReadField
            label={t("samples")}
            value={item.samples_received ? t("samplesYes") : t("samplesNo")}
          />
          <ReadField
            label={t("followUp")}
            value={formatDate(item.follow_up_date, locale)}
          />
          {item.notes ? (
            <ReadField label={t("notes")} value={item.notes} />
          ) : null}

          <div>
            <p className="mb-1.5 text-sm font-semibold text-gray-700">
              {t("products")}
            </p>
            {item.products.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {item.products.map((p) => (
                  <span
                    key={p.id}
                    className="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-600"
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">—</p>
            )}
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-sm font-semibold text-gray-700">{label}</p>
      <p className="whitespace-pre-wrap text-sm text-gray-600">{value}</p>
    </div>
  );
}
