import {
  GUIDE_SECTIONS,
  GUIDE_SLUGS,
  getSectionIdForSlug,
  isGuideSlug,
} from "./manifest";

describe("guide manifest", () => {
  it("defines the four top-level sections in order", () => {
    expect(GUIDE_SECTIONS.map((s) => s.id)).toEqual([
      "getting-started",
      "features",
      "patient-portal",
      "roles",
    ]);
  });

  it("flattens every article slug in render order", () => {
    expect(GUIDE_SLUGS).toEqual([
      "getting-started",
      "dashboard",
      "visits",
      "calendar",
      "financial",
      "patients",
      "staff",
      "medicine",
      "settings",
      "patient-portal",
      "roles-and-permissions",
    ]);
  });

  it("recognises known slugs and rejects unknown ones", () => {
    expect(isGuideSlug("dashboard")).toBe(true);
    expect(isGuideSlug("roles-and-permissions")).toBe(true);
    expect(isGuideSlug("nonexistent")).toBe(false);
    expect(isGuideSlug("")).toBe(false);
  });

  it("maps a slug back to its owning section id", () => {
    expect(getSectionIdForSlug("getting-started")).toBe("getting-started");
    expect(getSectionIdForSlug("dashboard")).toBe("features");
    expect(getSectionIdForSlug("settings")).toBe("features");
    expect(getSectionIdForSlug("patient-portal")).toBe("patient-portal");
    expect(getSectionIdForSlug("roles-and-permissions")).toBe("roles");
  });

  it("returns null for a slug that belongs to no section", () => {
    expect(getSectionIdForSlug("unknown-slug")).toBeNull();
  });

  it("keeps the features section ordered to mirror the in-app sidebar", () => {
    const features = GUIDE_SECTIONS.find((s) => s.id === "features");
    expect(features?.articles).toEqual([
      "dashboard",
      "visits",
      "calendar",
      "financial",
      "patients",
      "staff",
      "medicine",
      "settings",
    ]);
  });
});
