import { describe, expect, it } from "vitest";
import { JWT_EXPIRY_LEEWAY_MS, isExpiredJwt } from "./jwt";

/** Builds a `header.payload.signature` JWT whose `exp` is `secondsFromNow` out. */
function makeJwt(secondsFromNow: number): string {
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + secondsFromNow }),
  ).toString("base64url");
  return `header.${payload}.signature`;
}

describe("isExpiredJwt", () => {
  it("treats a comfortably-future token as valid", () => {
    expect(isExpiredJwt(makeJwt(30))).toBe(false);
  });

  it("treats an already-lapsed token as expired", () => {
    expect(isExpiredJwt(makeJwt(-60))).toBe(true);
  });

  it("treats a token within the clock-skew leeway as expired (refresh early)", () => {
    // exp is 5s out but the 10s leeway pulls it over the line.
    expect(JWT_EXPIRY_LEEWAY_MS).toBeGreaterThan(5_000);
    expect(isExpiredJwt(makeJwt(5))).toBe(true);
  });

  it("returns false for malformed tokens (fail open, let the backend decide)", () => {
    expect(isExpiredJwt("not-a-jwt")).toBe(false);
    expect(isExpiredJwt("")).toBe(false);
  });

  it("returns false when the payload carries no exp claim", () => {
    const payload = Buffer.from(JSON.stringify({ sub: "x" })).toString(
      "base64url",
    );
    expect(isExpiredJwt(`header.${payload}.sig`)).toBe(false);
  });
});
