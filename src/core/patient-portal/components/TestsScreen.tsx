"use client";

import { useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FlaskConical,
  UserRound,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import { formatDate } from "../lib/format";
import { useInvestigations } from "../hooks/usePortalData";
import type { PortalTest, PortalTestStatus } from "../types/patient-portal.types";
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

      <div className="space-y-2">
        <FilterChips
          label={t("tests.fields.status")}
          value={status}
          options={STATUS_FILTERS}
          onChange={setStatus}
          renderLabel={(opt) =>
            t(`tests.statusFilter.${opt}` as Parameters<typeof t>[0])
          }
          allLabel={t("tests.filterAll")}
        />
        <FilterChips
          label={t("tests.fields.type")}
          value={type}
          options={TYPE_FILTERS}
          onChange={setType}
          renderLabel={(opt) =>
            t(`tests.type.${opt.toLowerCase()}` as Parameters<typeof t>[0])
          }
          allLabel={t("tests.filterAll")}
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

/** A labeled row of segmented filter pills; an "All" pill clears the filter. */
function FilterChips({
  label,
  value,
  options,
  onChange,
  renderLabel,
  allLabel,
}: {
  label: string;
  value: string | undefined;
  options: readonly string[];
  onChange: (next: string | undefined) => void;
  renderLabel: (option: string) => string;
  allLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="me-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </span>
      <Chip active={value === undefined} onClick={() => onChange(undefined)}>
        {allLabel}
      </Chip>
      {options.map((opt) => (
        <Chip
          key={opt}
          active={value === opt}
          onClick={() => onChange(value === opt ? undefined : opt)}
        >
          {renderLabel(opt)}
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-brand-primary bg-brand-primary text-white"
          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
      )}
    >
      {children}
    </button>
  );
}

function TestCard({ test }: { test: PortalTest }) {
  const t = useTranslations("patientPortal");
  const locale = useLocale();
  const [open, setOpen] = useState(false);

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
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs text-gray-500">
              {t("tests.drShort", { doctor: test.doctorName })}
            </span>
            <StatusDot
              status={test.status}
              label={t(`status.${test.status}` as Parameters<typeof t>[0])}
            />
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
