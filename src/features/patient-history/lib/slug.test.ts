import { describe, expect, it } from "vitest";
import { slugifyGroup } from "./slug";

describe("slugifyGroup", () => {
  it("lowercases and replaces spaces with underscores", () => {
    expect(slugifyGroup("Gynecological History")).toBe("gynecological_history");
    expect(slugifyGroup("Obstetric History")).toBe("obstetric_history");
    expect(slugifyGroup("Medical History")).toBe("medical_history");
  });

  it("strips non-alphanumeric chars (keeps underscores)", () => {
    expect(slugifyGroup("OB/GYN — Notes!")).toBe("obgyn__notes");
  });

  it("trims surrounding whitespace", () => {
    expect(slugifyGroup("  Family History  ")).toBe("family_history");
  });

  it("is idempotent", () => {
    const once = slugifyGroup("Fertility History");
    expect(slugifyGroup(once)).toBe(once);
  });
});
