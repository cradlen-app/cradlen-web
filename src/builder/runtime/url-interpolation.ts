/**
 * Substitute `{key}` placeholders in a URL template with values from `vars`.
 *
 * Returns `null` if a **required** placeholder (`{key}`) appears in the template
 * but its value is missing or empty — callers use that signal to skip the fetch
 * instead of firing a request with an unresolved `{org_id}` segment.
 *
 * An **optional** placeholder (`{key?}`) resolves to an empty string when its
 * value is missing — leaving e.g. `…&authorized_for_service=` in the URL — so a
 * dependent filter (a doctor list narrowed by an optionally-chosen service) can
 * still resolve before the dependency is picked. The endpoint must treat the
 * empty value as "no filter".
 *
 * Also strips a leading `/v1` so the result fits `apiAuthFetch`, which already
 * prepends `/api/backend` and targets the v1 surface.
 */
export function interpolateUrl(
  template: string,
  vars: Record<string, string | null | undefined>,
): string | null {
  let missing = false;
  const interpolated = template.replace(
    /\{(\w+)(\?)?\}/g,
    (_match, key: string, optional: string | undefined) => {
      const value = vars[key];
      if (value == null || value === "") {
        if (!optional) missing = true;
        return "";
      }
      return encodeURIComponent(value);
    },
  );
  if (missing) return null;
  return interpolated.replace(/^\/v1(?=\/)/, "");
}
