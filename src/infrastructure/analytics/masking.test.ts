import { describe, expect, it } from "vitest";
import { isPublicPath, maskText, sanitizeUrl } from "./masking";

describe("analytics masking", () => {
  it("treats marketing/guide/auth pages as public (locale-prefixed)", () => {
    expect(isPublicPath("/en")).toBe(true);
    expect(isPublicPath("/ar/guide/dashboard")).toBe(true);
    expect(isPublicPath("/en/sign-up")).toBe(true);
  });

  it("treats the authenticated dashboard as non-public", () => {
    expect(isPublicPath("/en/org_1/branch_1/dashboard/visits")).toBe(false);
    expect(isPublicPath("/ar/select-profile")).toBe(false);
  });

  it("masks text to a fixed-length redaction on non-public content", () => {
    expect(maskText("Sarah Mohamed")).toBe("****");
  });

  it("strips query and hash from captured URLs (they can carry ids)", () => {
    expect(sanitizeUrl("https://www.cradlen.com/en/x?patient=123#frag")).toBe(
      "https://www.cradlen.com/en/x",
    );
  });
});
