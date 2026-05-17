import type { FormSectionDto } from "../templates/template.types";

export interface SectionGroup {
  /** Group name from `section.config.ui.group`, or null for ungrouped sections. */
  name: string | null;
  sections: FormSectionDto[];
}

/**
 * Bucket sections by their `config.ui.group` annotation, preserving the
 * first-occurrence order of group names. Sections without `ui.group` form
 * one ungrouped bucket at the position of the first ungrouped section
 * (keeps the book-visit drawer rendering unchanged).
 */
export function groupSections(sections: FormSectionDto[]): SectionGroup[] {
  const groups: SectionGroup[] = [];
  const indexByName = new Map<string | null, number>();
  for (const section of sections) {
    const groupName =
      (section.config?.ui?.group as string | undefined) ?? null;
    let idx = indexByName.get(groupName);
    if (idx === undefined) {
      idx = groups.length;
      indexByName.set(groupName, idx);
      groups.push({ name: groupName, sections: [] });
    }
    groups[idx].sections.push(section);
  }
  return groups;
}
