import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearForgotPasswordSession,
  getForgotPasswordResendSecondsRemaining,
  getPendingForgotPasswordEmail,
  normalizeForgotPasswordEmail,
  setPendingForgotPasswordEmail,
  startForgotPasswordResendCooldown,
} from "./forgot-password-session";
import { useForgotPasswordStore } from "../store/forgotPasswordStore";

describe("forgot password session", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    vi.useRealTimers();
    useForgotPasswordStore.getState().clearResetToken();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
      },
    });
  });

  it("normalizes and clears the pending email", () => {
    expect(normalizeForgotPasswordEmail("  Person@Example.COM ")).toBe(
      "person@example.com",
    );

    setPendingForgotPasswordEmail("  Person@Example.COM ");

    expect(getPendingForgotPasswordEmail()).toBe("person@example.com");

    clearForgotPasswordSession();

    expect(getPendingForgotPasswordEmail()).toBeNull();
  });

  it("persists resend cooldown by timestamp", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-29T10:00:00.000Z"));

    startForgotPasswordResendCooldown();

    expect(getForgotPasswordResendSecondsRemaining()).toBe(60);

    vi.setSystemTime(new Date("2026-04-29T10:00:30.000Z"));

    expect(getForgotPasswordResendSecondsRemaining()).toBe(30);

    vi.setSystemTime(new Date("2026-04-29T10:01:01.000Z"));

    expect(getForgotPasswordResendSecondsRemaining()).toBe(0);
  });

  it("keeps reset tokens in memory only", () => {
    useForgotPasswordStore.getState().setResetToken("reset-token");

    expect(useForgotPasswordStore.getState().resetToken).toBe("reset-token");
    expect([...storage.values()]).not.toContain("reset-token");

    useForgotPasswordStore.getState().clearResetToken();

    expect(useForgotPasswordStore.getState().resetToken).toBeNull();
  });
});
