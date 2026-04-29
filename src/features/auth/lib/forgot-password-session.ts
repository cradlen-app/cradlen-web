const FORGOT_PASSWORD_EMAIL_KEY = "cradlen-forgot-password-email";
const FORGOT_PASSWORD_RESEND_EXPIRES_AT_KEY =
  "cradlen-forgot-password-resend-expires-at";
const RESEND_COOLDOWN_MS = 60_000;

export function normalizeForgotPasswordEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getPendingForgotPasswordEmail() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(FORGOT_PASSWORD_EMAIL_KEY);
}

export function setPendingForgotPasswordEmail(email: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    FORGOT_PASSWORD_EMAIL_KEY,
    normalizeForgotPasswordEmail(email),
  );
}

export function startForgotPasswordResendCooldown() {
  if (typeof window === "undefined") return 0;

  const expiresAt = Date.now() + RESEND_COOLDOWN_MS;
  window.localStorage.setItem(
    FORGOT_PASSWORD_RESEND_EXPIRES_AT_KEY,
    String(expiresAt),
  );
  return expiresAt;
}

export function getForgotPasswordResendSecondsRemaining() {
  if (typeof window === "undefined") return 0;

  const expiresAt = Number(
    window.localStorage.getItem(FORGOT_PASSWORD_RESEND_EXPIRES_AT_KEY),
  );

  if (!Number.isFinite(expiresAt)) return 0;

  const remaining = Math.ceil((expiresAt - Date.now()) / 1000);

  if (remaining <= 0) {
    window.localStorage.removeItem(FORGOT_PASSWORD_RESEND_EXPIRES_AT_KEY);
    return 0;
  }

  return remaining;
}

export function clearForgotPasswordSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(FORGOT_PASSWORD_EMAIL_KEY);
  window.localStorage.removeItem(FORGOT_PASSWORD_RESEND_EXPIRES_AT_KEY);
}
