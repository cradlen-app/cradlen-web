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
