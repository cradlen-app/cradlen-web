/**
 * Format a monetary amount with its currency code.
 *
 * Defaults to "EGP" when no currency is provided (e.g. while loading or for
 * legacy data without a currency field).
 */
export function formatMoney(
  amount: number,
  currency: string | null | undefined = "EGP",
): string {
  const code = currency ?? "EGP";
  return `${code} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Format a ratio already expressed in percent (e.g. 42.5 → "42.5%"). */
export function formatPercent(value: number): string {
  return `${value.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

/** Format an ISO date string as a short local date; "—" when null/invalid. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}
