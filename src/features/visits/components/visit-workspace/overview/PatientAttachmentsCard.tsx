"use client";

import { FileText, ImageIcon, Paperclip } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { usePatientAttachments } from "@/features/investigations/hooks/useInvestigationReview";
import { useInvestigationReviewStore } from "@/features/investigations/store/investigationReviewStore";
import type {
  InvestigationAttachment,
  InvestigationStatus,
  PatientAttachmentGroup,
} from "@/features/investigations/types/investigation-review.types";

type Props = { patientId: string };

const STATUS_STYLES: Record<InvestigationStatus, string> = {
  ORDERED: "bg-gray-100 text-gray-600",
  RESULTED: "bg-amber-50 text-amber-700 border border-amber-100",
  REVIEWED: "bg-green-50 text-green-700 border border-green-100",
  CANCELLED: "bg-gray-100 text-gray-500",
};

function formatDate(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function FileChip({ file }: { file: InvestigationAttachment }) {
  const isImage = (file.contentType ?? "").startsWith("image/");
  const Icon = isImage ? ImageIcon : FileText;
  return (
    <a
      href={file.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600 transition-colors hover:border-brand-primary/40 hover:text-brand-primary"
    >
      <Icon className="size-3" aria-hidden="true" />
      {isImage ? "IMG" : "PDF"}
    </a>
  );
}

function Skeleton() {
  return (
    <div className="mt-3 space-y-2">
      {[90, 75].map((w, i) => (
        <div
          key={i}
          className="h-9 animate-pulse rounded-lg bg-gray-100"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  );
}

export function PatientAttachmentsCard({ patientId }: Props) {
  const t = useTranslations("patientAttachments");
  const { data, isLoading, isError } = usePatientAttachments(patientId);

  // Hide entirely when there's nothing to show — keeps Overview clean.
  if (!isLoading && (isError || !data || data.length === 0)) return null;

  return (
    <section>
      <header className="flex items-center gap-2">
        <Paperclip className="size-4 text-brand-primary" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-brand-black">{t("title")}</h2>
      </header>
      {isLoading || !data ? (
        <Skeleton />
      ) : (
        <ul className="my-4 space-y-2">
          {data.map((group) => (
            <AttachmentRow key={group.id} group={group} />
          ))}
        </ul>
      )}
    </section>
  );
}

function AttachmentRow({ group }: { group: PatientAttachmentGroup }) {
  const t = useTranslations("patientAttachments");
  const locale = useLocale();
  const openReview = useInvestigationReviewStore((s) => s.open);

  return (
    <li>
      <button
        type="button"
        onClick={() => openReview(group.id)}
        className="flex w-full items-start justify-between gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2 text-start transition-colors hover:border-brand-primary/30 hover:bg-gray-50"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-brand-black">
            {group.testName || "—"}
          </p>
          <p className="mt-0.5 text-[11px] text-gray-400">
            {group.typeLabel} • {formatDate(group.orderedAt, locale)}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {group.attachments.map((file) => (
              <FileChip key={file.id} file={file} />
            ))}
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[group.status]}`}
        >
          {t(`status.${group.status}`)}
        </span>
      </button>
    </li>
  );
}
