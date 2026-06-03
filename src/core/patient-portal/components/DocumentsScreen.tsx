"use client";

import { useState } from "react";
import { FileText, ImageIcon, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { formatDate } from "../lib/format";
import { useDocuments } from "../hooks/usePortalData";
import type { PortalDocument } from "../types/patient-portal.types";
import {
  ClinicTag,
  EmptyState,
  ScreenHeader,
  StatusBadge,
  documentTone,
} from "./portal-ui";
import { UploadDialog } from "./upload/UploadDialog";

export function DocumentsScreen() {
  const t = useTranslations("patientPortal");
  const { data: docs, isLoading } = useDocuments();
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-start justify-between gap-3">
        <ScreenHeader
          title={t("documents.title")}
          subtitle={t("documents.subtitle")}
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-primary px-3 py-2 text-xs font-bold text-white"
        >
          <Plus className="size-4" />
          {t("documents.newUpload")}
        </button>
      </div>

      {isLoading ? (
        <EmptyState message={t("common.loading")} />
      ) : (docs?.length ?? 0) === 0 ? (
        <EmptyState message={t("documents.none")} />
      ) : (
        <ul className="space-y-2">
          {docs!.map((d) => (
            <DocRow key={d.id} doc={d} />
          ))}
        </ul>
      )}

      {open && <UploadDialog open onClose={() => setOpen(false)} />}
    </div>
  );
}

function DocRow({ doc }: { doc: PortalDocument }) {
  const t = useTranslations("patientPortal");
  const locale = useLocale();
  const hasPdf = doc.files.some((f) => f.type === "pdf");
  return (
    <li className="rounded-xl border border-gray-100 bg-white p-3">
      <div className="flex items-start gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-brand-secondary/15 text-brand-primary">
          {hasPdf ? (
            <FileText className="size-5" />
          ) : (
            <ImageIcon className="size-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-brand-black">
              {doc.title}
            </p>
            <StatusBadge
              label={t(`status.${doc.status}` as Parameters<typeof t>[0])}
              tone={documentTone(doc.status)}
            />
          </div>
          <p className="text-xs text-gray-500">
            {t("documents.files", { count: doc.files.length })} ·{" "}
            {doc.doctorName}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {t("documents.uploadedOn", {
                date: formatDate(doc.uploadedAt, locale),
              })}
            </span>
            <ClinicTag clinic={doc.clinic} />
          </div>
        </div>
      </div>
    </li>
  );
}
