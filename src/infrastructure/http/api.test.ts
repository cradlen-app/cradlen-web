import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { clearSession, clearContext, clearUser, queryClientClear } = vi.hoisted(
  () => ({
    clearSession: vi.fn(),
    clearContext: vi.fn(),
    clearUser: vi.fn(),
    queryClientClear: vi.fn(),
  }),
);

vi.mock("@/features/auth/store/authStore", () => ({
  useAuthStore: { getState: () => ({ clearSession }) },
}));
vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: {
    getState: () => ({
      organizationId: null,
      branchId: null,
      profileId: null,
      clearContext,
    }),
  },
}));
vi.mock("@/features/auth/store/userStore", () => ({
  useUserStore: { getState: () => ({ clearUser }) },
}));
vi.mock("@/infrastructure/query/queryClient", () => ({
  queryClient: { clear: queryClientClear },
}));

import { apiAuthFetch } from "./api";

const assign = vi.fn();

function setLocation(pathname: string, search = "") {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { pathname, search, assign },
  });
}

describe("apiAuthFetch 401 handling", () => {
  beforeEach(() => {
    assign.mockClear();
    clearSession.mockClear();
    clearContext.mockClear();
    clearUser.mockClear();
    queryClientClear.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 401 })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("redirects to sign-in exactly once across a burst of 401s on a protected page", async () => {
    setLocation("/en/org-1/branch-1/dashboard/patients");

    // A dashboard query fan-out: many authenticated calls all 401 at once.
    await Promise.all(
      Array.from({ length: 8 }, () =>
        apiAuthFetch("/patients").catch(() => undefined),
      ),
    );

    // Single-flight guard: the teardown + navigation fire once, not per-failure,
    // which is what otherwise restarts the pending /sign-in navigation in a loop.
    expect(assign).toHaveBeenCalledTimes(1);
    expect(assign).toHaveBeenCalledWith(
      "/en/sign-in?redirectTo=%2Forg-1%2Fbranch-1%2Fdashboard%2Fpatients",
    );
  });
});
