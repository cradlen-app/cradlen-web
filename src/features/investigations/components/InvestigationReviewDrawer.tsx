"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";
import { useInvestigationReviewStore } from "../store/investigationReviewStore";
import {
  useInvestigationReview,
  useSubmitInvestigationReview,
} from "../hooks/useInvestigationReview";

function formatDate(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** Read-only label / value pair. */
function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-brand-black">{value || "-"}</p>
    </div>
  );
}

/**
 * Global right-side drawer where a doctor reviews a patient-uploaded
 * investigation result and records notes. Opened via `useInvestigationReviewStore`
 * (from the notification click); mounted once in the navbar.
 */
export function InvestigationReviewDrawer() {
  const openId = useInvestigationReviewStore((s) => s.openId);
  const close = useInvestigationReviewStore((s) => s.close);
  const t = useTranslations("investigationReview");

  return (
    <Dialog.Root
      open={Boolean(openId)}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/35" />
        <Dialog.Content
          className={cn(
            "fixed inset-0 z-50 flex h-dvh w-full flex-col bg-white px-5 py-5 shadow-2xl outline-none",
            "sm:inset-y-0 sm:start-auto sm:inset-e-0 sm:w-[34rem] sm:max-w-[calc(100vw-2rem)]",
            "sm:ltr:rounded-l-2xl sm:rtl:rounded-r-2xl",
          )}
        >
          <div className="flex items-center justify-between gap-4">
            <Dialog.Title className="text-lg font-medium text-brand-black">
              {t("title")}
            </Dialog.Title>
            <Dialog.Close
              className="inline-flex size-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-black"
              aria-label={t("close")}
            >
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>

          {openId && <DrawerBody key={openId} id={openId} onClose={close} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DrawerBody({ id, onClose }: { id: string; onClose: () => void }) {
  const t = useTranslations("investigationReview");
  const locale = useLocale();
  const { data: review, isLoading } = useInvestigationReview(id);
  const submit = useSubmitInvestigationReview();

  const [notes, setNotes] = useState("");
  const seeded = useRef(false);
  useEffect(() => {
    if (review && !seeded.current) {
      setNotes(review.doctorNotes ?? "");
      seeded.current = true;
    }
  }, [review]);

  async function save() {
    await submit.mutateAsync({ id, notes });
    onClose();
  }

  if (isLoading || !review) {
    return (
      <div className="mt-6 flex-1 space-y-3">
        <div className="h-20 animate-pulse rounded-xl bg-gray-50" />
        <div className="h-64 animate-pulse rounded-xl bg-gray-50" />
      </div>
    );
  }

  return (
    <>
      <div className="mt-5 min-h-0 flex-1 space-y-5 overflow-y-auto pe-1">
        <section className="grid grid-cols-2 gap-4">
          <DetailRow label={t("fields.patient")} value={review.patientName} />
          <DetailRow label={t("fields.visitId")} value={review.visitId} />
          <DetailRow
            label={t("fields.status")}
            value={t(`status.${review.status}`)}
          />
          <DetailRow
            label={t("fields.updatedAt")}
            value={formatDate(review.updatedAt, locale)}
          />
        </section>

        <div className="border-t border-gray-100" />

        <section className="grid grid-cols-2 gap-4">
          <DetailRow label={t("fields.type")} value={review.typeLabel} />
          <DetailRow label={t("fields.testName")} value={review.testName} />
          <DetailRow label={t("fields.reason")} value={review.reason} />
        </section>

        <div className="border-t border-gray-100" />

        {review.attachments.length > 0 ? (
          <section className="space-y-3">
            {review.attachments.map((a) => (
              <ResultImage key={a.id} url={a.url} alt={review.testName} />
            ))}
          </section>
        ) : (
          <p className="py-4 text-center text-sm text-gray-400">
            {t("noResult")}
          </p>
        )}
      </div>

      <div className="border-t border-gray-100 pt-4">
        <label className="block">
          <span className="text-xs text-gray-400">{t("notes")}</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={t("notesPlaceholder")}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-brand-black outline-none focus:border-brand-primary/40 focus:ring-2 focus:ring-brand-primary/20"
          />
        </label>
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            onClick={save}
            disabled={submit.isPending}
            className="rounded-full px-8"
          >
            {submit.isPending ? t("saving") : t("save")}
          </Button>
        </div>
      </div>
    </>
  );
}

function ResultImage({ url, alt }: { url: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- presigned/mock URLs aren't optimizable by next/image
    <img
      src={url}
      alt={alt}
      className="w-full rounded-lg border border-gray-200 object-contain"
    />
  );
}
