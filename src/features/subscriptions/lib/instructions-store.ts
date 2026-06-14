import type { PaymentInstructions } from "./subscriptions.types";

/**
 * The transfer instructions (pay-to address, note) are only returned by the
 * create-payment call, not by the payment GET. We stash them per-payment in
 * sessionStorage so the detail page can re-display them after the redirect. On a
 * fresh reload they may be absent — the detail page falls back to a generic note.
 */
const key = (paymentId: string) =>
  `subscription-payment-instructions:${paymentId}`;

export function saveInstructions(
  paymentId: string,
  instructions: PaymentInstructions,
): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key(paymentId), JSON.stringify(instructions));
  } catch {
    // ignore quota / unavailable storage
  }
}

export function loadInstructions(
  paymentId: string,
): PaymentInstructions | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key(paymentId));
    return raw ? (JSON.parse(raw) as PaymentInstructions) : null;
  } catch {
    return null;
  }
}
