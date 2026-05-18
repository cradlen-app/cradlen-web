import { medicationFormSchema } from "./medications.schemas";

describe("medicationFormSchema", () => {
  it("accepts valid full data", () => {
    const result = medicationFormSchema.safeParse({
      code: "AMX-500",
      name: "Amoxicillin",
      form: "Capsule",
      strength: "500mg",
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimal required fields only", () => {
    const result = medicationFormSchema.safeParse({ code: "X", name: "Y" });
    expect(result.success).toBe(true);
  });

  it("accepts empty strings for optional fields", () => {
    const result = medicationFormSchema.safeParse({
      code: "IBU-400",
      name: "Ibuprofen",
      form: "",
      strength: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty code", () => {
    const result = medicationFormSchema.safeParse({ code: "", name: "Amoxicillin" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain("code");
  });

  it("rejects empty name", () => {
    const result = medicationFormSchema.safeParse({ code: "AMX", name: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain("name");
  });

  it("rejects code exceeding 64 characters", () => {
    const result = medicationFormSchema.safeParse({
      code: "A".repeat(65),
      name: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name exceeding 200 characters", () => {
    const result = medicationFormSchema.safeParse({
      code: "X",
      name: "A".repeat(201),
    });
    expect(result.success).toBe(false);
  });
});
