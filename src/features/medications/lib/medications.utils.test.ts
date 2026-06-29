import { describe, expect, it } from "vitest";
import { generateMedicationCode } from "./medications.utils";

describe("generateMedicationCode", () => {
  describe("name abbreviation", () => {
    it("builds a 3-letter abbreviation from first char + following consonants", () => {
      // "Amoxicillin": A + MXCLLN -> AMX
      expect(generateMedicationCode("Amoxicillin", "")).toBe("AMX");
    });

    it("keeps the first character even when it is a vowel", () => {
      // "Aspirin": A + SPRN -> ASP
      expect(generateMedicationCode("Aspirin", "")).toBe("ASP");
    });

    it("trims surrounding whitespace from the name", () => {
      expect(generateMedicationCode("  Amoxicillin  ", "")).toBe("AMX");
    });

    it("returns empty string when the name is empty or whitespace", () => {
      expect(generateMedicationCode("", "")).toBe("");
      expect(generateMedicationCode("   ", "100mg")).toBe("");
    });

    it("handles a single-character name", () => {
      expect(generateMedicationCode("A", "")).toBe("A");
    });

    it("uppercases the abbreviation regardless of input case", () => {
      expect(generateMedicationCode("paracetamol", "")).toBe("PRC");
    });

    it("strips hyphens and spaces from the consonant run", () => {
      // "Co-amox": C + (o-amox -> mx) -> CMX
      expect(generateMedicationCode("Co-amox", "")).toBe("CMX");
    });
  });

  describe("strength formatting", () => {
    it("appends a plain numeric strength when no recognised unit", () => {
      expect(generateMedicationCode("Amoxicillin", "500")).toBe("AMX500");
    });

    it("formats mg under 1000 as a bare number", () => {
      expect(generateMedicationCode("Amoxicillin", "500mg")).toBe("AMX500");
    });

    it("converts mg >= 1000 into grams with a G suffix", () => {
      expect(generateMedicationCode("Amoxicillin", "1000mg")).toBe("AMX1G");
    });

    it("keeps fractional grams when mg does not divide evenly", () => {
      expect(generateMedicationCode("Amoxicillin", "1500mg")).toBe("AMX1.5G");
    });

    it("formats an explicit g unit with a G suffix", () => {
      expect(generateMedicationCode("Amoxicillin", "1g")).toBe("AMX1G");
    });

    it("formats mcg with an MCG suffix", () => {
      expect(generateMedicationCode("Levothyroxine", "50mcg")).toBe("LVT50MCG");
    });

    it("formats ml with an ML suffix", () => {
      expect(generateMedicationCode("Saline", "5ml")).toBe("SLN5ML");
    });

    it("preserves decimal strengths", () => {
      expect(generateMedicationCode("Amlodipine", "2.5mg")).toBe("AML2.5");
    });

    it("tolerates whitespace between number and unit", () => {
      expect(generateMedicationCode("Amoxicillin", "500 mg")).toBe("AMX500");
    });

    it("is case-insensitive about the unit", () => {
      expect(generateMedicationCode("Amoxicillin", "500MG")).toBe("AMX500");
    });

    it("returns only the name abbreviation when strength is empty", () => {
      expect(generateMedicationCode("Amoxicillin", "   ")).toBe("AMX");
    });

    it("returns only the name abbreviation when strength has no leading number", () => {
      expect(generateMedicationCode("Amoxicillin", "as needed")).toBe("AMX");
    });
  });
});
