const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Mirrors the API's add-on proration (`prorate` in
 * subscription-payments.service): yearly price × quantity ×
 * clamp(daysRemaining, 1, 365) / 365, rounded to 2 decimals. Returns null when
 * the price is not numeric or the end date is missing/invalid so callers can
 * fall back to the un-prorated price.
 */
export function prorateAddOnTotal(
  yearlyPrice: string,
  quantity: number,
  endsAt: string | null | undefined,
  now: Date = new Date(),
): string | null {
  const price = Number(yearlyPrice);
  if (!Number.isFinite(price)) return null;
  const ends = endsAt ? new Date(endsAt) : null;
  if (!ends || Number.isNaN(ends.getTime())) return null;
  const daysRemaining = Math.min(
    365,
    Math.max(1, Math.ceil((ends.getTime() - now.getTime()) / DAY_MS)),
  );
  return ((price * quantity * daysRemaining) / 365).toFixed(2);
}
