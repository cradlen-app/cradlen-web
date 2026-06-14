/** Format a decimal-string amount + currency, e.g. "12,000 EGP". */
export function formatMoney(amount: string, currency: string, locale = "en") {
  const n = Number(amount);
  const value = Number.isFinite(n)
    ? new Intl.NumberFormat(locale).format(n)
    : amount;
  return `${value} ${currency}`;
}

/** Format an ISO date (date only), or "-" when null. */
export function formatDate(iso: string | null | undefined, locale = "en") {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}
