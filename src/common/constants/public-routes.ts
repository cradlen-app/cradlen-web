/**
 * Locale-stripped path prefixes reachable without a session.
 *
 * There is exactly ONE list because there are TWO independent gates that must
 * agree, and disagreement fails silently in opposite directions:
 *
 *  1. `src/proxy.ts` — the server-side route guard. A public page missing here
 *     gets a 307 to /sign-in, so it never indexes.
 *  2. `handleUnauthorized` / `clearSessionAndRedirect` in
 *     `src/infrastructure/http/api.ts` — the client-side 401 teardown. Public
 *     pages fire an `/auth/me` probe that legitimately 401s for anonymous
 *     visitors. A public page missing here is read as a dead session, and the
 *     browser is redirected to /sign-in *after* the page has already rendered —
 *     a 200 to curl, a bounce to every real logged-out visitor.
 *
 * Keeping these as two hand-maintained lists meant a new marketing page could
 * pass every server-side check and still be unreachable in a browser. Add new
 * public routes here and both gates stay correct.
 *
 * The locale root ("/") is public too, but both call sites special-case it.
 */
export const PUBLIC_ROUTE_PREFIXES = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/terms-of-service",
  "/privacy-policy",
  "/help-center",
  "/guide",
  "/pricing",
  "/about",
  "/contact",
  "/invitations/accept",
] as const;

/** Whole-segment prefix match, so "/about" never matches "/about-internal". */
export function isPublicRoute(pathWithoutLocale: string) {
  if (pathWithoutLocale === "/") return true;

  return PUBLIC_ROUTE_PREFIXES.some(
    (prefix) =>
      pathWithoutLocale === prefix || pathWithoutLocale.startsWith(prefix + "/"),
  );
}
