/**
 * Pure PHI-masking helpers for session replay + captured properties.
 *
 * Public marketing/auth/guide pages contain no PHI, so replay text is captured
 * verbatim there (heatmaps + full replay). Every other route — the
 * authenticated dashboard — is masked by default.
 *
 * The public-route list is imported, not re-declared: this used to be a third
 * hand-maintained copy (alongside `src/proxy.ts` and the 401 teardown in
 * `infrastructure/http/api.ts`) with a "keep them in sync" comment. It drifts.
 * Failing open here would mean capturing dashboard text verbatim into replay,
 * so this one is worth never getting wrong.
 */
import { isPublicRoute } from "@/common/constants/public-routes";

const LOCALES = ["en", "ar"];

/** Strip a leading `/en` or `/ar` so the path matches the shared prefixes. */
function stripLocale(pathname: string): string {
  const segments = pathname.split("/");
  if (LOCALES.includes(segments[1] ?? "")) {
    const rest = `/${segments.slice(2).join("/")}`;
    return rest === "/" ? "/" : rest.replace(/\/$/, "");
  }
  return pathname === "/" ? "/" : pathname.replace(/\/$/, "");
}

export function isPublicPath(pathname: string): boolean {
  return isPublicRoute(stripLocale(pathname));
}

/** Fixed redaction — never reveals length or content of masked text. */
export function maskText(text: string): string {
  void text; // intentionally ignored: mask to a constant regardless of input
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
