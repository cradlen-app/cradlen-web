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
import { useUploadInvestigationFiles } from "../hooks/useUploadInvestigationFiles";
import type {
  PortalTest,
  PortalTestStatus,
  UploadFile,
} from "../types/patient-portal.types";
import { ClinicTag, EmptyState, ScreenHeader } from "./portal-ui";

/** Backend `InvestigationStatus` values offered as filters (Cancelled excluded). */
const STATUS_FILTERS = ["ORDERED", "RESULTED", "REVIEWED"] as const;
/** Backend `LabTestCategory` values offered as filters. */
const TYPE_FILTERS = ["LAB", "IMAGING", "OTHER"] as const;

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
  const upload = useUploadInvestigationFiles();
  const fileInput = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<UploadFile[]>([]);
  const [dragging, setDragging] = useState(false);

  const uploaded = test.files ?? [];
  const hasFiles = uploaded.length > 0;
  const isPending = test.status === "pending";

  function addFiles(list: FileList | null) {
    if (!list) return;
    setPending((prev) => [...prev, ...Array.from(list).map(toUploadFile)]);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  async function save() {
    if (pending.length === 0) return;
    await upload.mutateAsync({ investigationId: test.id, files: pending });
    setPending([]);
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

            {hasFiles && (
              <div className="space-y-1.5 pt-1">
                {uploaded.map((f) => (
                  <FileChip key={f.id} file={f} />
                ))}
              </div>
            )}

            {isPending && (
              <div className="pt-1">
                {pending.map((f) => (
                  <FileChip key={f.id} file={f} />
                ))}
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
              </div>
            )}

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

            {test.resultUrl && (
              <a
                href={test.resultUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 pt-1 text-sm font-semibold text-brand-primary underline underline-offset-2"
              >
                <ExternalLink className="size-4" />
                {t("tests.viewResult")}
              </a>
            )}

            <div className="pt-1">
              <ClinicTag clinic={test.clinic} org={test.organizationName} />
            </div>

            {isPending && (
              <div className="flex justify-end pt-1.5">
                <button
                  type="button"
                  onClick={save}
                  disabled={pending.length === 0 || upload.isPending}
                  className="rounded-full bg-brand-secondary px-7 py-1.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                >
                  {upload.isPending ? t("common.loading") : t("tests.save")}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {hasFiles ? (
              <FileChip file={uploaded[0]} />
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

function FileChip({ file }: { file: UploadFile }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      <FileText className="size-4 shrink-0 text-red-500" />
      <span className="truncate text-sm text-gray-600">{file.name}</span>
    </div>
  );
}

function toUploadFile(file: File, idx: number): UploadFile {
  const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
  return {
    id: `${Date.now()}-${idx}-${file.name}`,
    name: file.name,
    sizeLabel: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
    type: isPdf ? "pdf" : "image",
  };
}
