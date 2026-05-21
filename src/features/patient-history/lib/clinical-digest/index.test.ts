import { describe, expect, it } from "vitest";
import { buildClinicalDigest } from "./index";
import type { ObgynHistorySummary } from "../../api/obgyn-history-summary.api";
import { humanJoin } from "./formatters";

const base: ObgynHistorySummary = {
  history_exists: true,
  allergies: [],
  current_medications: [],
  obstetric_summary: null,
  gynecological_baseline: null,
  medical_chronic_illnesses: null,
  family_history: null,
  social_history: null,
  screening_history: null,
  section_timestamps: null,
};

describe("humanJoin", () => {
  it("returns empty string for empty array", () => {
    expect(humanJoin([])).toBe("");
  });
  it("returns single item unchanged", () => {
    expect(humanJoin(["A"])).toBe("A");
  });
  it("joins two items with 'and'", () => {
    expect(humanJoin(["A", "B"])).toBe("A and B");
  });
  it("joins three items with Oxford comma", () => {
    expect(humanJoin(["A", "B", "C"])).toBe("A, B, and C");
  });
  it("joins four items with Oxford comma", () => {
    expect(humanJoin(["A", "B", "C", "D"])).toBe("A, B, C, and D");
  });
});

describe("buildClinicalDigest", () => {
  describe("header", () => {
    it("includes age when dateOfBirth is provided", () => {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 28);
      const { header } = buildClinicalDigest(base, dob.toISOString());
      expect(header).toMatch(/^28y/);
    });

    it("omits age when dateOfBirth is null", () => {
      const history = {
        ...base,
        obstetric_summary: { gravida: 1, para: 0, abortion: 0, ectopic: 0, stillbirths: 0 },
      };
      const { header } = buildClinicalDigest(history, null);
      expect(header).toBe("G1P0A0");
    });

    it("shows '—' when no age and no obstetric summary", () => {
      const { header } = buildClinicalDigest(base, null);
      expect(header).toBe("—");
    });

    it("includes obstetric label in header", () => {
      const history = {
        ...base,
        obstetric_summary: { gravida: 2, para: 1, abortion: 1, ectopic: 0, stillbirths: 0 },
      };
      const { header } = buildClinicalDigest(history, null);
      expect(header).toBe("G2P1A1");
    });

    it("appends ectopic and stillbirth to obstetric label", () => {
      const history = {
        ...base,
        obstetric_summary: { gravida: 3, para: 1, abortion: 1, ectopic: 1, stillbirths: 1 },
      };
      const { header } = buildClinicalDigest(history, null);
      expect(header).toContain("Ect:1");
      expect(header).toContain("SB:1");
    });
  });

  describe("flags", () => {
    it("ectopic signal has highest priority (95) and appears first", () => {
      const history = {
        ...base,
        obstetric_summary: { gravida: 2, para: 1, abortion: 0, ectopic: 1, stillbirths: 0 },
        medical_chronic_illnesses: { items: ["Hypertension"], notes: "" },
      };
      const { flags } = buildClinicalDigest(history, null);
      expect(flags[0].label).toContain("Ectopic");
      expect(flags[0].severity).toBe("high");
    });

    it("recurrent abortion (≥2) extracted as high-severity flag", () => {
      const history = {
        ...base,
        obstetric_summary: { gravida: 3, para: 1, abortion: 2, ectopic: 0, stillbirths: 0 },
      };
      const { flags } = buildClinicalDigest(history, null);
      const raf = flags.find((f) => f.label.includes("Recurrent Abortion"));
      expect(raf).toBeDefined();
      expect(raf?.severity).toBe("high");
    });

    it("single abortion does not produce recurrent_abortion flag", () => {
      const history = {
        ...base,
        obstetric_summary: { gravida: 2, para: 1, abortion: 1, ectopic: 0, stillbirths: 0 },
      };
      const { flags } = buildClinicalDigest(history, null);
      expect(flags.find((f) => f.label.includes("Recurrent"))).toBeUndefined();
    });

    it("severe allergy produces high-severity flag", () => {
      const history = {
        ...base,
        allergies: [{ allergy_to: "Penicillin", severity: "SEVERE", associated_symptoms: null }],
      };
      const { flags } = buildClinicalDigest(history, null);
      const af = flags.find((f) => f.label.includes("Penicillin"));
      expect(af?.severity).toBe("high");
      // "No Known Allergies" should NOT appear
      expect(flags.find((f) => f.label === "No Known Allergies")).toBeUndefined();
    });

    it("no allergies produces 'No Known Allergies' positive flag", () => {
      const { flags } = buildClinicalDigest(base, null);
      const naf = flags.find((f) => f.label === "No Known Allergies");
      expect(naf).toBeDefined();
      expect(naf?.severity).toBe("positive");
    });

    it("DM chronic illness normalizes to high-severity flag", () => {
      const history = {
        ...base,
        medical_chronic_illnesses: { items: ["Diabetes Mellitus Type 2"], notes: "" },
      };
      const { flags } = buildClinicalDigest(history, null);
      const dmf = flags.find((f) => f.label.includes("Diabetes"));
      expect(dmf?.severity).toBe("high");
    });

    it("caps flags at 6 items", () => {
      const history = {
        ...base,
        obstetric_summary: { gravida: 3, para: 1, abortion: 2, ectopic: 1, stillbirths: 1 },
        allergies: [
          { allergy_to: "Penicillin", severity: "SEVERE", associated_symptoms: null },
          { allergy_to: "Aspirin", severity: "MODERATE", associated_symptoms: null },
        ],
        medical_chronic_illnesses: {
          items: ["Hypertension", "Diabetes Mellitus", "Thyroid disorder"],
          notes: "",
        },
      };
      const { flags } = buildClinicalDigest(history, null);
      expect(flags.length).toBeLessThanOrEqual(6);
    });

    it("flags are sorted by priority descending", () => {
      const history = {
        ...base,
        obstetric_summary: { gravida: 3, para: 1, abortion: 2, ectopic: 1, stillbirths: 0 },
        allergies: [{ allergy_to: "Sulfa", severity: "SEVERE", associated_symptoms: null }],
      };
      const { flags } = buildClinicalDigest(history, null);
      // ectopic (95) should come before recurrent_abortion (90) which ties with allergy_severe (90)
      const ectopicIdx = flags.findIndex((f) => f.label.includes("Ectopic"));
      expect(ectopicIdx).toBe(0);
    });
  });

  describe("summary", () => {
    it("produces fluent menstrual clause", () => {
      const history = {
        ...base,
        gynecological_baseline: {
          age_at_menarche: 14,
          cycle_regularity: "REGULAR",
          dysmenorrhea: false,
        },
      };
      const { summary } = buildClinicalDigest(history, null);
      expect(summary).toContain("Regular menstrual cycles since menarche at age 14 without dysmenorrhea.");
    });

    it("includes dysmenorrhea in menstrual clause when true", () => {
      const history = {
        ...base,
        gynecological_baseline: {
          age_at_menarche: 12,
          cycle_regularity: "IRREGULAR",
          dysmenorrhea: true,
        },
      };
      const { summary } = buildClinicalDigest(history, null);
      expect(summary).toContain("with dysmenorrhea");
    });

    it("says 'No prior pregnancies' when gravida=0", () => {
      const history = {
        ...base,
        obstetric_summary: { gravida: 0, para: 0, abortion: 0, ectopic: 0, stillbirths: 0 },
      };
      const { summary } = buildClinicalDigest(history, null);
      expect(summary).toContain("No prior pregnancies.");
    });

    it("includes ectopic detail in obstetric sentence", () => {
      const history = {
        ...base,
        obstetric_summary: { gravida: 2, para: 1, abortion: 0, ectopic: 1, stillbirths: 0 },
      };
      const { summary } = buildClinicalDigest(history, null);
      expect(summary).toContain("ectopic pregnanc");
    });

    it("uses Oxford comma in aggregate negatives", () => {
      const { summary } = buildClinicalDigest(base, null);
      // base has no meds, no allergies, no chronic, no family history
      expect(summary).toMatch(
        /No regular medications, known allergies, chronic illnesses, and significant family history\./,
      );
    });

    it("omits allergy negative when allergies present", () => {
      const history = {
        ...base,
        allergies: [{ allergy_to: "Latex", severity: null, associated_symptoms: null }],
      };
      const { summary } = buildClinicalDigest(history, null);
      expect(summary).not.toContain("known allergies");
    });

    it("handles all null sections without crashing", () => {
      expect(() => buildClinicalDigest(base, null)).not.toThrow();
    });

    it("includes family history sentence when present", () => {
      const history = {
        ...base,
        family_history: {
          gynecologic_cancers: ["Ovarian cancer"],
          chronic_illnesses: [],
        },
      };
      const { summary } = buildClinicalDigest(history, null);
      expect(summary).toContain("Family history of Ovarian cancer.");
    });
  });

  describe("compactSummary", () => {
    it("prefers high/medium signals over positive in compactSummary", () => {
      const history = {
        ...base,
        obstetric_summary: { gravida: 2, para: 1, abortion: 1, ectopic: 0, stillbirths: 0 },
        medical_chronic_illnesses: { items: ["Hypertension"], notes: "" },
      };
      const { compactSummary } = buildClinicalDigest(history, null);
      expect(compactSummary).toContain("G2P1A1");
      expect(compactSummary).toContain("Hypertension");
      expect(compactSummary).not.toContain("No Known Allergies");
    });

    it("falls back to positive signal in compactSummary when no meaningful signals", () => {
      const { compactSummary } = buildClinicalDigest(base, null);
      // only positive signal is "No Known Allergies"
      expect(compactSummary).toContain("No Known Allergies");
    });
  });
});
