"use client";

import { useMemo, useState } from "react";
import { Upload, FileCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { formatDate } from "../lib/format";
import { useLabOrders } from "../hooks/usePortalData";
import type { LabOrder } from "../types/patient-portal.types";
import {
  ClinicTag,
  EmptyState,
  ScreenHeader,
  SectionCard,
  StatusBadge,
  labOrderTone,
} from "./portal-ui";
import { UploadDialog } from "./upload/UploadDialog";

export function TestsScreen() {
  const t = useTranslations("patientPortal");
  const { data: orders, isLoading } = useLabOrders();
  const [uploadFor, setUploadFor] = useState<LabOrder | undefined>();
  const [open, setOpen] = useState(false);

  const awaiting = useMemo(
    () => (orders ?? []).filter((o) => o.status === "awaiting_upload"),
    [orders],
  );
  const others = useMemo(
    () => (orders ?? []).filter((o) => o.status !== "awaiting_upload"),
    [orders],
  );

  function startUpload(order: LabOrder) {
    setUploadFor(order);
    setOpen(true);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <ScreenHeader title={t("tests.title")} />

      {isLoading ? (
        <EmptyState message={t("common.loading")} />
      ) : (orders?.length ?? 0) === 0 ? (
        <EmptyState message={t("tests.none")} />
      ) : (
        <>
          {awaiting.length > 0 && (
            <SectionCard title={t("tests.awaiting")}>
              <p className="-mt-2 mb-3 text-xs text-gray-400">
                {t("tests.awaitingHint")}
              </p>
              <ul className="space-y-2">
                {awaiting.map((o) => (
                  <li
                    key={o.id}
                    className="rounded-xl border border-amber-200 bg-amber-50/60 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-brand-black">
                          {o.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t("tests.orderedBy", { doctor: o.doctorName })}
                        </p>
                      </div>
                      <ClinicTag clinic={o.clinic} />
                    </div>
                    <button
                      type="button"
                      onClick={() => startUpload(o)}
                      className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-primary py-2 text-xs font-bold text-white"
                    >
                      <Upload className="size-3.5" />
                      {t("tests.uploadResult")}
                    </button>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          <SectionCard title={t("tests.ordered")}>
            {others.length === 0 ? (
              <p className="py-1 text-sm text-gray-400">{t("tests.none")}</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {others.map((o) => (
                  <OrderRow key={o.id} order={o} />
                ))}
              </ul>
            )}
          </SectionCard>
        </>
      )}

      {open && (
        <UploadDialog
          open
          presetOrder={uploadFor}
          onClose={() => {
            setOpen(false);
            setUploadFor(undefined);
          }}
        />
      )}
    </div>
  );
}

function OrderRow({ order }: { order: LabOrder }) {
  const t = useTranslations("patientPortal");
  const locale = useLocale();
  return (
    <li className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-brand-black">
          {order.name}
        </p>
        <p className="text-xs text-gray-400">
          {formatDate(order.orderedDate, locale)} · {order.clinic.name}
        </p>
      </div>
      <StatusBadge
        label={t(`status.${order.status}` as Parameters<typeof t>[0])}
        tone={labOrderTone(order.status)}
      />
      {order.result?.fileRef && (
        <button
          type="button"
          className="rounded-lg p-1.5 text-brand-primary hover:bg-brand-primary/5"
          aria-label={t("tests.viewResult")}
          title={t("tests.viewResult")}
        >
          <FileCheck className="size-4" />
        </button>
      )}
    </li>
  );
}
