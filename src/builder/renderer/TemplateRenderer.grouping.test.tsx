import { describe, expect, it } from "vitest";
import { groupSections } from "./group-sections";
import type { FormSectionDto } from "../templates/template.types";

function section(
  code: string,
  group?: string,
  order = 0,
): FormSectionDto {
  return {
    id: `s-${code}`,
    code,
    name: code,
    order,
    config: group ? { ui: { group } } : {},
    fields: [],
  };
}

describe("groupSections", () => {
  it("groups sections by their config.ui.group", () => {
    const groups = groupSections([
      section("menstrual_history", "Gynecological History", 0),
      section("gynecologic_procedures", "Gynecological History", 1),
      section("obstetric_summary", "Obstetric History", 2),
      section("pregnancies", "Obstetric History", 3),
      section("family_history", "Family History", 4),
    ]);
    expect(groups.map((g) => g.name)).toEqual([
      "Gynecological History",
      "Obstetric History",
      "Family History",
    ]);
    expect(groups[0].sections.map((s) => s.code)).toEqual([
      "menstrual_history",
      "gynecologic_procedures",
    ]);
    expect(groups[1].sections.map((s) => s.code)).toEqual([
      "obstetric_summary",
      "pregnancies",
    ]);
  });

  it("preserves first-occurrence order of groups (not alphabetical)", () => {
    const groups = groupSections([
      section("x", "Zeta", 0),
      section("y", "Alpha", 1),
      section("z", "Zeta", 2),
    ]);
    expect(groups.map((g) => g.name)).toEqual(["Zeta", "Alpha"]);
  });

  it("buckets sections without ui.group under a single null group", () => {
    const groups = groupSections([
      section("a", undefined, 0),
      section("b", undefined, 1),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBeNull();
    expect(groups[0].sections.map((s) => s.code)).toEqual(["a", "b"]);
  });
});
