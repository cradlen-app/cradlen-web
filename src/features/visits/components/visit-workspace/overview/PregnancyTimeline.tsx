"use client";

import { useLocale, useTranslations } from "next-intl";

import { useActiveJourneySummary } from "@/features/journeys/lib/useActiveJourneySummary";
import type { JourneyIdentifier } from "@/features/journeys/lib/active-journey-summary.api";

type Props = { patientId: string };

const TOTAL_WEEKS = 40;

/** Short day+month label, e.g. "31 May" (locale-aware). */
function formatDayMonth(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(d);
}

/** Current gestational week from the server `ga` string, else derived from LMP. */
function resolveWeek(identifier: JourneyIdentifier): number | null {
  const fromGa = identifier.ga?.match(/\d+/)?.[0];
  if (fromGa != null) {
    return clampWeek(Number.parseInt(fromGa, 10));
  }
  if (identifier.lmp) {
    const lmp = new Date(identifier.lmp);
    if (!Number.isNaN(lmp.getTime())) {
      const days = (Date.now() - lmp.getTime()) / (1000 * 60 * 60 * 24);
      return clampWeek(Math.floor(days / 7));
    }
  }
  return null;
}

function clampWeek(week: number): number {
  if (Number.isNaN(week)) return 0;
  return Math.min(Math.max(week, 0), TOTAL_WEEKS);
}

/** Plural-multiples caption key from fetus count, e.g. "twins"; null for singleton. */
function multiplesKey(count: number | null): "twins" | "triplets" | "multiples" | null {
  if (count == null || count <= 1) return null;
  if (count === 2) return "twins";
  if (count === 3) return "triplets";
  return "multiples";
}

export function PregnancyTimeline({ patientId }: Props) {
  const t = useTranslations("visits.workspace.pregnancyTimeline");
  const locale = useLocale();
  const { data, isLoading, isError } = useActiveJourneySummary(patientId);

  if (isLoading) return <Skeleton />;
  if (isError || !data || !data.journey_exists || !data.identifier) return null;

  const identifier = data.identifier;
  const week = resolveWeek(identifier);
  const lmpLabel = formatDayMonth(identifier.lmp, locale);
  const eddLabel = formatDayMonth(identifier.edd, locale);

  // Not a datable pregnancy — nothing meaningful to plot.
  if (week == null && !lmpLabel && !eddLabel) return null;

  const safeWeek = week ?? 0;
  const weeksToGo = Math.max(0, TOTAL_WEEKS - safeWeek);
  const fillFraction = Math.min(Math.max(safeWeek / TOTAL_WEEKS, 0), 1);
  const fillPct = `${fillFraction * 100}%`;

  const multiples = multiplesKey(identifier.number_of_fetuses);
  const captionParts = [
    t("weekOf", { week: safeWeek, total: TOTAL_WEEKS }),
    t("weeksToGo", { count: weeksToGo }),
    multiples ? t(multiples) : null,
  ].filter(Boolean);

  return (
    <section aria-label={t("weekOf", { week: safeWeek, total: TOTAL_WEEKS })}>
      {/* End + trimester labels */}
      <div className="relative mb-1.5 h-4 text-[11px] font-medium">
        <span className="absolute start-0 text-brand-primary">
          {lmpLabel ? `${t("lmp")} ${lmpLabel}` : t("lmp")}
        </span>
        <span className="absolute -translate-x-1/2 text-brand-secondary ltr:left-1/4 rtl:right-1/4">
          {t("trimester1")}
        </span>
        <span className="absolute left-1/2 -translate-x-1/2 text-brand-secondary">
          {t("trimester2")}
        </span>
        <span className="absolute -translate-x-1/2 text-brand-secondary ltr:left-3/4 rtl:right-3/4">
          {t("trimester3")}
        </span>
        <span className="absolute end-0 text-brand-primary">
          {eddLabel ? `${t("edd")} ${eddLabel}` : t("edd")}
        </span>
      </div>

      {/* Track + fill + knob */}
      <div className="relative h-2 rounded-full bg-gray-100">
        <div
          className="absolute inset-y-0 start-0 rounded-full bg-brand-primary transition-[width] duration-500"
          style={{ width: fillPct }}
        />
        <div
          className="absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full border-2 border-white bg-brand-primary shadow ltr:-translate-x-1/2 rtl:translate-x-1/2"
          style={{ insetInlineStart: fillPct }}
          aria-hidden="true"
        />
        {/* Trimester ticks at 1/4, 1/2, 3/4 */}
        {[0.25, 0.5, 0.75].map((p) => (
          <div
            key={p}
            className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-white/70"
            style={{ insetInlineStart: `${p * 100}%` }}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Caption */}
      <p className="mt-2 text-xs text-gray-500">{captionParts.join(" · ")}</p>
    </section>
  );
}

function Skeleton() {
  return (
    <section>
      <div className="mb-1.5 h-3 w-full animate-pulse rounded bg-gray-100" />
      <div className="h-2 w-full animate-pulse rounded-full bg-gray-100" />
      <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-gray-100" />
    </section>
  );
}
