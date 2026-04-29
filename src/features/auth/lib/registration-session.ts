const SIGNUP_EMAIL_KEY = "cradlen-signup-email";

export function normalizeSignupEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getPendingSignupEmail() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SIGNUP_EMAIL_KEY);
}

export function setPendingSignupEmail(email: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SIGNUP_EMAIL_KEY, normalizeSignupEmail(email));
}

export function clearPendingSignupEmail() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SIGNUP_EMAIL_KEY);
}
