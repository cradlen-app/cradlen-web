import { describe, expect, it } from "vitest";
import { groupSections } from "./group-sections";
import type { FormSectionDto } from "../templates/template.types";

function section(code: string, group?: string): FormSectionDto {
  return {
    id: code,
    code,
    name: code,
    order: 0,
    config: group ? { ui: { group } } : {},
    fields: [],
  };
}

describe("groupSections", () => {
  it("returns an empty list for no sections", () => {
    expect(groupSections([])).toEqual([]);
  });

  it("buckets all ungrouped sections under a single null group", () => {
    const sections = [section("a"), section("b")];
    const groups = groupSections(sections);
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBeNull();
    expect(groups[0].sections.map((s) => s.code)).toEqual(["a", "b"]);
  });

  it("groups by ui.group name, preserving first-occurrence order", () => {
    const groups = groupSections([
      section("a", "Vitals"),
      section("b", "History"),
      section("c", "Vitals"),
    ]);
    expect(groups.map((g) => g.name)).toEqual(["Vitals", "History"]);
    // 'c' merges into the existing 'Vitals' bucket rather than creating a new one.
    expect(groups[0].sections.map((s) => s.code)).toEqual(["a", "c"]);
    expect(groups[1].sections.map((s) => s.code)).toEqual(["b"]);
  });

  it("keeps the ungrouped bucket at the position of the first ungrouped section", () => {
    const groups = groupSections([
      section("a", "G1"),
      section("b"),
      section("c", "G1"),
      section("d"),
    ]);
    expect(groups.map((g) => g.name)).toEqual(["G1", null]);
    expect(groups[1].sections.map((s) => s.code)).toEqual(["b", "d"]);
  });
});
