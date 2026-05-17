/**
 * Convert a top-level group display name (e.g. "Gynecological History") to
 * a stable section-code slug (e.g. "gynecological_history") used as the
 * `section_code` on `PatientHistoryNote`s. The source-of-truth is the seed's
 * `group` string (English); slugifying client-side keeps the seed
 * human-readable and avoids round-tripping the slug through the API.
 */
export function slugifyGroup(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}
