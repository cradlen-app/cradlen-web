import { describe, expect, it } from "vitest";
import { createSignInSchema } from "./sign-in.schemas";

const messages = {
  "errors.emailRequired": "Email is required",
  "errors.emailInvalid": "Enter a valid email address",
  "errors.passwordRequired": "Password is required",
  "errors.passwordMinLength": "Password must be at least 8 characters",
};

const t = ((key: keyof typeof messages) => messages[key]) as Parameters<
  typeof createSignInSchema
>[0];

describe("createSignInSchema", () => {
  it("accepts valid sign-in data", () => {
    const result = createSignInSchema(t).safeParse({
      email: "doctor@example.com",
      password: "password123",
    });

    expect(result.success).toBe(true);
  });

  it("returns localized validation messages", () => {
    const result = createSignInSchema(t).safeParse({
      email: "not-an-email",
      password: "short",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      "Enter a valid email address",
    );
    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      "Password must be at least 8 characters",
    );
  });
});
