/** Local-time `YYYY-MM-DD` for a date. */
function iso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** `{ date_from, date_to }` covering the current calendar month up to today. */
export function currentMonthRange(): { date_from: string; date_to: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { date_from: iso(start), date_to: iso(now) };
}

/** `{ date_from, date_to }` covering the whole previous calendar month. */
export function previousMonthRange(): { date_from: string; date_to: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  // Day 0 of the current month = last day of the previous month.
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  return { date_from: iso(start), date_to: iso(end) };
}
