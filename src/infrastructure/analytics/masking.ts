/**
 * Pure PHI-masking helpers for session replay + captured properties.
 *
 * Public marketing/auth/guide pages contain no PHI, so replay text is captured
 * verbatim there (heatmaps + full replay). Every other route — the
 * authenticated dashboard — is masked by default. The public prefixes mirror
 * `PUBLIC_ROUTE_PREFIXES` in `src/proxy.ts`; keep them in sync.
 */
const PUBLIC_ROUTE_PREFIXES = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/terms-of-service",
  "/privacy-policy",
  "/help-center",
  "/guide",
  "/invitations/accept",
];

const LOCALES = ["en", "ar"];

/** Strip a leading `/en` or `/ar` so the path matches the prefixes above. */
function stripLocale(pathname: string): string {
  const segments = pathname.split("/");
  if (LOCALES.includes(segments[1] ?? "")) {
    const rest = `/${segments.slice(2).join("/")}`;
    return rest === "/" ? "/" : rest.replace(/\/$/, "");
  }
  return pathname === "/" ? "/" : pathname.replace(/\/$/, "");
}

export function isPublicPath(pathname: string): boolean {
  const path = stripLocale(pathname);
  if (path === "/") return true; // marketing landing
  return PUBLIC_ROUTE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

/** Fixed redaction — never reveals length or content of masked text. */
export function maskText(_text: string): string {
  return "****";
}

/** Remove query string and hash from a URL; keep origin + path only. */
export function sanitizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return url.split("?")[0].split("#")[0];
  }
}
