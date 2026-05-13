/**
 * Substitute `{key}` placeholders in a URL template with values from `vars`.
 *
 * Returns `null` if any placeholder appears in the template but its value is
 * missing or empty — callers can use that signal to skip the fetch instead of
 * firing a request with an unresolved `{org_id}` segment.
 *
 * Also strips a leading `/v1` so the result fits `apiAuthFetch`, which already
 * prepends `/api/backend` and targets the v1 surface.
 */
export function interpolateUrl(
  template: string,
  vars: Record<string, string | null | undefined>,
): string | null {
  let missing = false;
  const interpolated = template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = vars[key];
    if (value == null || value === "") {
      missing = true;
      return "";
    }
    return encodeURIComponent(value);
  });
  if (missing) return null;
  return interpolated.replace(/^\/v1(?=\/)/, "");
}
