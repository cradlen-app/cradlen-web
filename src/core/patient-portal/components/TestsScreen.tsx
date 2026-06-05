"use client";

import { useRef, useState, type DragEvent, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  FlaskConical,
  SlidersHorizontal,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "../lib/format";
import { useInvestigations } from "../hooks/usePortalData";
import {
  useRemoveInvestigationAttachment,
  useUploadInvestigationResult,
} from "../hooks/useUploadInvestigationResult";
import type {
  PortalTest,
  PortalTestResult,
  PortalTestStatus,
} from "../types/patient-portal.types";
import { ClinicTag, EmptyState, ScreenHeader } from "./portal-ui";

/** Backend `InvestigationStatus` values offered as filters (Cancelled excluded). */
const STATUS_FILTERS = ["ORDERED", "RESULTED", "REVIEWED"] as const;
/** Backend `LabTestCategory` values offered as filters. */
const TYPE_FILTERS = ["LAB", "IMAGING", "OTHER"] as const;

/** Mirror the backend upload limits (config defaults). */
const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];
const MAX_BYTES = 15_000_000;
const MAX_FILES = 10;

export function TestsScreen() {
  const t = useTranslations("patientPortal");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [type, setType] = useState<string | undefined>(undefined);
  const { entries, isLoading, isLoadingMore, hasMore, loadMore } =
    useInvestigations({ status, type });

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <ScreenHeader title={t("tests.title")} />

      <div className="flex flex-wrap items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-brand-primary">
          <SlidersHorizontal className="size-5" />
        </span>
        <FilterPill
          label={t("tests.fields.status")}
          value={status}
          onChange={setStatus}
          options={[
            { value: undefined, label: t("tests.filterAll") },
            ...STATUS_FILTERS.map((s) => ({
              value: s,
              label: t(`tests.statusFilter.${s}` as Parameters<typeof t>[0]),
            })),
          ]}
        />
        <FilterPill
          label={t("tests.fields.type")}
          value={type}
          onChange={setType}
          options={[
            { value: undefined, label: t("tests.filterAll") },
            ...TYPE_FILTERS.map((s) => ({
              value: s,
              label: t(`tests.type.${s.toLowerCase()}` as Parameters<typeof t>[0]),
            })),
          ]}
        />
      </div>

      {isLoading ? (
        <EmptyState message={t("common.loading")} />
      ) : entries.length === 0 ? (
        <EmptyState message={t("tests.none")} />
      ) : (
        <>
          <ul className="flex-1 space-y-3">
            {entries.map((test) => (
              <li key={test.id}>
                <TestCard test={test} />
              </li>
            ))}
          </ul>

          {hasMore && (
            <div className="mt-2 flex justify-center">
              <button
                type="button"
                onClick={() => loadMore()}
                disabled={isLoadingMore}
                className="inline-flex h-9 items-center justify-center rounded-full bg-brand-primary px-6 text-xs font-semibold text-white hover:bg-brand-primary/90 disabled:opacity-60"
              >
                {isLoadingMore ? t("common.loading") : t("tests.loadMore")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * A large dropdown pill showing the selected filter value (e.g. "Status: All").
 * The "All" option (radio value `"all"`) clears the filter (`undefined`).
 */
function FilterPill({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | undefined;
  options: { value: string | undefined; label: string }[];
  onChange: (next: string | undefined) => void;
}) {
  const selected = options.find((o) => o.value === value) ?? options[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-12 items-center gap-2 rounded-full border border-gray-200 bg-white px-5 text-sm hover:bg-gray-50 data-[state=open]:border-brand-primary">
        <span className="text-gray-400">{label}:</span>
        <span className="font-semibold text-brand-black">{selected.label}</span>
        <ChevronDown className="size-4 text-gray-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
        <DropdownMenuRadioGroup
          value={value ?? "all"}
          onValueChange={(v) => onChange(v === "all" ? undefined : v)}
        >
          {options.map((o) => (
            <DropdownMenuRadioItem key={o.value ?? "all"} value={o.value ?? "all"}>
              {o.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TestCard({ test }: { test: PortalTest }) {
  const t = useTranslations("patientPortal");
  const locale = useLocale();
  const upload = useUploadInvestigationResult();
  const removeAttachment = useRemoveInvestigationAttachment();
  const fileInput = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const results = test.results;
  const isReviewed = test.status === "reviewed";
  // The patient may add/remove files until the result is reviewed.
  const editable = !isReviewed;
  const remaining = MAX_FILES - results.length - pending.length;
  const busy = upload.isPending || removeAttachment.isPending;

  function addFiles(list: FileList | null) {
    if (!list) return;
    setError(null);
    const next: File[] = [];
    for (const file of Array.from(list)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(t("tests.unsupportedType"));
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(t("tests.fileTooLarge"));
        continue;
      }
      next.push(file);
    }
    if (next.length === 0) return;
    setPending((prev) => {
      const room = MAX_FILES - results.length - prev.length;
      if (next.length > room) setError(t("tests.maxFiles", { max: MAX_FILES }));
      return [...prev, ...next.slice(0, Math.max(0, room))];
    });
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  async function save() {
    if (pending.length === 0) return;
    setError(null);
    try {
      await upload.mutateAsync({ investigationId: test.id, files: pending });
      setPending([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("tests.uploadError"));
    }
  }

  async function removeUploaded(attachmentId: string) {
    setError(null);
    try {
      await removeAttachment.mutateAsync({
        investigationId: test.id,
        attachmentId,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("tests.uploadError"));
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm border-s-4 border-s-brand-primary">
      {/* Header — always visible, toggles the card */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-4 pt-3.5"
      >
        <span className="flex min-w-0 items-center gap-2">
          <FlaskConical className="size-4 shrink-0 text-brand-primary" />
          <span className="truncate text-sm font-bold text-brand-black">
            {test.name}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="text-xs font-medium text-gray-400">
            {formatDate(test.date, locale).toUpperCase()}
          </span>
          {open ? (
            <ChevronUp className="size-4 text-gray-400" />
          ) : (
            <ChevronDown className="size-4 text-gray-400" />
          )}
        </span>
      </button>

      <div className="px-4 pb-3.5 pt-3">
        {open ? (
          <div className="space-y-2.5">
            <DetailRow label={t("tests.fields.status")}>
              {t(`status.${test.status}` as Parameters<typeof t>[0])}
            </DetailRow>
            <DetailRow label={t("tests.fields.doctor")}>
              {test.doctorName}
            </DetailRow>
            <DetailRow label={t("tests.fields.type")}>
              {t(`tests.type.${test.category}` as Parameters<typeof t>[0])}
            </DetailRow>
            {test.notes && (
              <DetailRow label={t("tests.fields.notes")}>
                {test.notes}
              </DetailRow>
            )}

            {results.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {results.map((r) => (
                  <ResultChip
                    key={r.id}
                    result={r}
                    label={t("tests.viewResult")}
                    onRemove={
                      editable && r.source === "PATIENT" && !busy
                        ? () => removeUploaded(r.id)
                        : undefined
                    }
                    removeLabel={t("tests.removeFile")}
                  />
                ))}
              </div>
            )}

            {editable && (
              <div className="pt-1">
                {pending.map((f, i) => (
                  <PendingChip
                    key={`${f.name}-${i}`}
                    file={f}
                    onRemove={() =>
                      setPending((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    removeLabel={t("tests.removeFile")}
                  />
                ))}

                {remaining > 0 && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    className={cn(
                      "mt-2 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-7 text-center transition-colors",
                      dragging
                        ? "border-brand-primary bg-brand-primary/5"
                        : "border-gray-300 bg-gray-50/60",
                    )}
                  >
                    <UploadCloud className="size-7 text-gray-400" />
                    <p className="text-xs text-gray-500">
                      {t("tests.dropzone")}{" "}
                      <button
                        type="button"
                        onClick={() => fileInput.current?.click()}
                        className="font-semibold text-brand-primary underline underline-offset-2"
                      >
                        {t("tests.browse")}
                      </button>
                    </p>
                    <input
                      ref={fileInput}
                      type="file"
                      multiple
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => addFiles(e.target.files)}
                    />
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-xs text-red-600">{error}</p>}

            {test.review && (
              <div className="pt-2">
                <div className="mb-2 flex items-center gap-2">
                  <UserRound className="size-4 text-brand-primary" />
                  <h3 className="text-sm font-bold text-brand-black">
                    {t("tests.review")}
                  </h3>
                </div>
                <div className="space-y-2.5">
                  <DetailRow label={t("tests.reviewDate")}>
                    {formatDate(test.review.date, locale)}
                  </DetailRow>
                  {test.review.reviewerName && (
                    <DetailRow label={t("tests.fields.doctor")}>
                      {test.review.reviewerName}
                    </DetailRow>
                  )}
                  {test.review.notes && (
                    <DetailRow label={t("tests.reviewNotes")}>
                      {test.review.notes}
                    </DetailRow>
                  )}
                </div>
              </div>
            )}

            <div className="pt-1">
              <ClinicTag clinic={test.clinic} org={test.organizationName} />
            </div>

            {editable && pending.length > 0 && (
              <div className="flex justify-end pt-1.5">
                <button
                  type="button"
                  onClick={save}
                  disabled={busy}
                  className="rounded-full bg-brand-secondary px-7 py-1.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                >
                  {upload.isPending ? t("common.loading") : t("tests.save")}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {results.length > 0 ? (
              <p className="text-center text-sm text-brand-primary">
                {t("tests.resultsCount", { count: results.length })}
              </p>
            ) : (
              <p className="text-center text-sm text-gray-400">
                {t("tests.noFiles")}
              </p>
            )}
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs text-gray-500">
                {t("tests.drShort", { doctor: stripDrPrefix(test.doctorName) })}
              </span>
              <StatusDot
                status={test.status}
                label={t(`status.${test.status}` as Parameters<typeof t>[0])}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children?: ReactNode;
}) {
  return (
    <p className="text-sm">
      <span className="font-semibold text-brand-black">{label}</span>
      <span className="text-gray-500"> : {children}</span>
    </p>
  );
}

function StatusDot({
  status,
  label,
}: {
  status: PortalTestStatus;
  label: string;
}) {
  const reviewed = status === "reviewed";
  return (
    <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium">
      <span
        className={cn(
          "size-1.5 rounded-full",
          reviewed ? "bg-brand-primary" : "bg-amber-500",
        )}
      />
      <span className={reviewed ? "text-brand-primary" : "text-amber-600"}>
        {label}
      </span>
    </span>
  );
}

/**
 * Strips a leading honorific ("Dr." / "Dr" / Arabic "د.") so the `DR: {doctor}`
 * footer doesn't read "DR: Dr. …" when the backend name already includes it.
 */
function stripDrPrefix(name: string): string {
  return name.replace(/^\s*(dr\.?|د\.?)\s+/i, "");
}

/** An uploaded/published result file: a View link, optionally removable. */
function ResultChip({
  result,
  label,
  onRemove,
  removeLabel,
}: {
  result: PortalTestResult;
  label: string;
  onRemove?: () => void;
  removeLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-1.5">
      <a
        href={result.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-w-0 items-center gap-1.5 text-sm font-medium text-brand-primary underline underline-offset-2"
      >
        <FileText className="size-4 shrink-0" />
        <span className="truncate">{label}</span>
        <ExternalLink className="size-3.5 shrink-0" />
      </a>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="shrink-0 text-gray-400 hover:text-red-500"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

/** A picked-but-not-yet-uploaded file. */
function PendingChip({
  file,
  onRemove,
  removeLabel,
}: {
  file: File;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="inline-flex min-w-0 items-center gap-1.5">
        <FileText className="size-4 shrink-0 text-red-500" />
        <span className="truncate text-sm text-gray-600">{file.name}</span>
        <span className="shrink-0 text-[11px] text-gray-400">
          {(file.size / (1024 * 1024)).toFixed(1)} MB
        </span>
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="shrink-0 text-gray-400 hover:text-red-500"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
