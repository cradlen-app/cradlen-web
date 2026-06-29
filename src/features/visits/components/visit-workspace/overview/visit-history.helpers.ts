import type { ApiJourneyTimelineEntry } from "../../../types/visits.api.types";

function localeFor(locale: string) {
  return locale.startsWith("en") ? "en-GB" : locale;
}

export function formatDate(iso: string, locale: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(localeFor(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** Split a date for the visit date rail: "14 Jun" over "2026". */
export function formatDateParts(iso: string, locale: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { dayMonth: iso, year: "" };
  const fl = localeFor(locale);
  return {
    dayMonth: new Intl.DateTimeFormat(fl, {
      day: "2-digit",
      month: "short",
    }).format(d),
    year: new Intl.DateTimeFormat(fl, { year: "numeric" }).format(d),
  };
}

/** Seed the default expanded state: active (or newest) journey + its latest episode. */
export function computeDefaults(journeys: ApiJourneyTimelineEntry[]) {
  const openJourneys = new Set<string>();
  const openEpisodes = new Set<string>();
  const focus = journeys.find((j) => j.status === "ACTIVE") ?? journeys[0];
  if (focus) {
    openJourneys.add(focus.id);
    const latest =
      focus.episodes.find((e) => e.status === "ACTIVE") ??
      [...focus.episodes].sort((a, b) => b.order - a.order)[0];
    if (latest) openEpisodes.add(latest.id);
  }
  return { openJourneys, openEpisodes };
}
