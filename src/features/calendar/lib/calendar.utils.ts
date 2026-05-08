import type { ApiCalendarEvent, ApiCalendarParticipant, ApiConflict } from "../types/calendar.api.types";
import type { CalendarEvent, CalendarParticipant, Conflict } from "../types/calendar.types";

// ── Grid builder (extracted from MiniCalendar) ────────────────────────────────

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

// ── Month window helpers ───────────────────────────────────────────────────────

export function monthWindowFrom(year: number, month: number) {
  const from = `${year}-${String(month + 1).padStart(2, "0")}-01T00:00:00Z`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const to = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}T23:59:59Z`;
  return { from, to };
}

// ── Grouping ──────────────────────────────────────────────────────────────────

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

// ── Time formatting ────────────────────────────────────────────────────────────

export function formatEventTime(startsAt: string, endsAt: string): string {
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  return `${fmt(startsAt)} – ${fmt(endsAt)}`;
}

// ── API → UI mappers ───────────────────────────────────────────────────────────

function mapParticipant(p: ApiCalendarParticipant): CalendarParticipant {
  return { id: p.id, profileId: p.profile_id, role: p.role, name: p.name };
}

export function mapApiCalendarEvent(api: ApiCalendarEvent): CalendarEvent {
  return {
    id: api.id,
    organizationId: api.organization_id,
    branchId: api.branch_id,
    createdById: api.created_by_id,
    patientId: api.patient_id,
    patientName: api.patient?.full_name ?? null,
    type: api.type,
    title: api.title,
    description: api.description,
    startsAt: api.starts_at,
    endsAt: api.ends_at,
    allDay: api.all_day,
    status: api.status,
    details: api.details,
    participants: api.participants.map(mapParticipant),
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export function mapApiConflict(api: ApiConflict): Conflict {
  return {
    profileId: api.profile_id,
    kind: api.kind,
    refId: api.ref_id,
    startsAt: api.starts_at,
    endsAt: api.ends_at,
    summary: api.summary,
  };
}
