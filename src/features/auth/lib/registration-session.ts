const REGISTRATION_TOKEN_KEY = "cradlen-registration-token";

export function getRegistrationToken() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(REGISTRATION_TOKEN_KEY);
}

export function setRegistrationToken(token: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(REGISTRATION_TOKEN_KEY, token);
}

export function clearRegistrationToken() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(REGISTRATION_TOKEN_KEY);
}
