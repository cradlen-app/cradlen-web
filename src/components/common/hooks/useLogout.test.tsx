import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

const replace = vi.fn();
const clearUser = vi.fn();
const clearSession = vi.fn();
const clearContext = vi.fn();
const clearAvailableProfiles = vi.fn();
const clearPendingProfileSelection = vi.fn();
const queryClientClear = vi.fn();

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/infrastructure/query/queryClient", () => ({
  queryClient: { clear: () => queryClientClear() },
}));

vi.mock("@/features/auth/store/userStore", () => ({
  useUserStore: (selector: (s: { clearUser: () => void }) => unknown) =>
    selector({ clearUser }),
}));

vi.mock("@/features/auth/store/authStore", () => ({
  useAuthStore: (selector: (s: { clearSession: () => void }) => unknown) =>
    selector({ clearSession }),
}));

vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (selector: (s: { clearContext: () => void }) => unknown) =>
    selector({ clearContext }),
}));

vi.mock("@/features/auth/store/availableProfilesStore", () => ({
  useAvailableProfilesStore: (
    selector: (s: { clearAvailableProfiles: () => void }) => unknown,
  ) => selector({ clearAvailableProfiles }),
}));

vi.mock("@/features/auth/lib/profile-selection-session", () => ({
  clearPendingProfileSelection: () => clearPendingProfileSelection(),
}));

import { useLogout } from "./useLogout";

describe("useLogout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls the logout API, clears all client state, and redirects", async () => {
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current.handleLogout();
    });

    expect(fetch).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
    expect(clearSession).toHaveBeenCalled();
    expect(clearContext).toHaveBeenCalled();
    expect(clearUser).toHaveBeenCalled();
    expect(clearPendingProfileSelection).toHaveBeenCalled();
    expect(clearAvailableProfiles).toHaveBeenCalled();
    expect(queryClientClear).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith("/sign-in");
  });

  it("still clears state and redirects when the logout API call fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current.handleLogout();
    });

    expect(clearSession).toHaveBeenCalled();
    expect(clearAvailableProfiles).toHaveBeenCalled();
    expect(queryClientClear).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith("/sign-in");
  });
});
