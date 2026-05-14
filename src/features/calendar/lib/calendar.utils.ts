import type { ApiCalendarEvent } from "../types/calendar.api.types";
import type { CalendarEvent } from "../types/calendar.types";

// ── Grid builder ────────────────────────────────────────────────────────────

export type GridCell = {
  day: number;
  iso: string;
  inMonth: boolean;
};

function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function fromIsoDate(iso: string) {
  const [yyyy, mm, dd] = iso.split("-").map(Number);
  return new Date(yyyy, mm - 1, dd);
}

export function buildMonthGrid(
  year: number,
  month: number,
  weekStartsOn: 0 | 6,
): GridCell[] {
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = firstOfMonth.getDay();
  const offsetFromStart = (firstDayOfWeek - weekStartsOn + 7) % 7;

  const cells: GridCell[] = [];

  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = offsetFromStart - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const date = new Date(year, month - 1, day);
    cells.push({
      day,
      iso: toIsoDate(date.getFullYear(), date.getMonth(), date.getDate()),
      inMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, iso: toIsoDate(year, month, day), inMonth: true });
  }

  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1];
    const next = fromIsoDate(last.iso);
    next.setDate(next.getDate() + 1);
    cells.push({
      day: next.getDate(),
      iso: toIsoDate(next.getFullYear(), next.getMonth(), next.getDate()),
      inMonth: false,
    });
  }

  return cells;
}

export function todayIso() {
  const now = new Date();
  return toIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
}

export function localIsoDate(utcIso: string): string {
  const d = new Date(utcIso);
  return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
}

// ── Month window helpers ─────────────────────────────────────────────────────

export function monthWindowFrom(year: number, month: number) {
  const from = new Date(year, month, 1, 0, 0, 0, 0).toISOString();
  const to = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();
  return { from, to };
}

// ── Grouping ────────────────────────────────────────────────────────────────

export function groupEventsByDate(
  events: CalendarEvent[],
): Record<string, CalendarEvent[]> {
  const map: Record<string, CalendarEvent[]> = {};
  for (const event of events) {
    const cur = new Date(localIsoDate(event.startsAt) + "T00:00:00");
    const end = new Date(localIsoDate(event.endsAt) + "T00:00:00");
    while (cur <= end) {
      const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
      if (!map[key]) map[key] = [];
      map[key].push(event);
      cur.setDate(cur.getDate() + 1);
    }
  }
  return map;
}

// ── Time formatting ──────────────────────────────────────────────────────────

export function formatEventTime(startsAt: string, endsAt: string): string {
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  return `${fmt(startsAt)} – ${fmt(endsAt)}`;
}

// ── API → UI mapper ──────────────────────────────────────────────────────────

export function mapApiCalendarEvent(api: ApiCalendarEvent): CalendarEvent {
  return {
    id: api.id,
    profileId: api.profile_id,
    organizationId: api.organization_id,
    branchId: api.branch_id,
    type: api.event_type,
    visibility: api.visibility,
    title: api.title,
    description: api.description,
    startsAt: api.start_at,
    endsAt: api.end_at,
    allDay: api.all_day,
    procedureId: api.procedure_id,
    procedureName: api.procedure_name,
    patientId: api.patient_id,
    patientName: api.patient_full_name,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}
