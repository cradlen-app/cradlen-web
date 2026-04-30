const SIGNUP_EMAIL_KEY = "cradlen-signup-email";
const SIGNUP_TOKEN_KEY = "cradlen-signup-token";

type SignupRedirectRouter = {
  replace: (href: "/sign-up") => void;
};

function getObject(value: unknown) {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

export function normalizeSignupEmail(email: string) {
  return email.trim().toLowerCase();
}

export function extractSignupToken(response: unknown) {
  const root = getObject(response);
  const data = getObject(root?.data);
  const source = data ?? root;
  const token = source?.signup_token ?? source?.registration_token;

  return typeof token === "string" && token.trim() ? token : null;
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

export function getPendingSignupToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SIGNUP_TOKEN_KEY);
}

export function setPendingSignupToken(signupToken: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SIGNUP_TOKEN_KEY, signupToken);
}

export function clearPendingSignupToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SIGNUP_TOKEN_KEY);
}

export function clearPendingSignupSession() {
  clearPendingSignupEmail();
  clearPendingSignupToken();
}

export function getSignupTokenOrRedirect(router: SignupRedirectRouter) {
  const signupToken = getPendingSignupToken();

  if (!signupToken) {
    router.replace("/sign-up");
    return null;
  }

  return signupToken;
}
