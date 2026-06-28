import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * `PATIENT_APP_URL` is read at module-evaluation time, so each case resets the
 * module registry and re-imports after stubbing the env var. This pins the
 * env-override precedence and the production default the clinic CTA links to.
 */
describe("PATIENT_APP_URL", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function load() {
    vi.resetModules();
    return (await import("./external-urls")).PATIENT_APP_URL;
  }

  it("uses NEXT_PUBLIC_PATIENT_APP_URL when set", async () => {
    vi.stubEnv(
      "NEXT_PUBLIC_PATIENT_APP_URL",
      "https://cradlen-patient-staging.cradlen.com",
    );
    expect(await load()).toBe("https://cradlen-patient-staging.cradlen.com");
  });

  it("falls back to the production patient domain when the env var is undefined", async () => {
    // The constant uses `?? default`, so the fallback applies only when the var
    // is genuinely undefined (note: an empty string would slip through as "").
    vi.stubEnv("NEXT_PUBLIC_PATIENT_APP_URL", undefined);
    expect(await load()).toBe("https://cradlen-patient.cradlen.com");
  });
});
