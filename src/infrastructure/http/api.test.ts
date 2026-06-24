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

const assign = vi.fn();

function setLocation(pathname: string, search = "") {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { pathname, search, assign },
  });
}

// fetch mock: every /api/backend/* call 401s (simulating an expired token); the
// /api/auth/me liveness probe returns `meStatus` so we can drive both branches.
function backendThenMe(meStatus: number) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : String(input);
    if (url.includes("/api/auth/me")) {
      return new Response(meStatus === 200 ? JSON.stringify({ data: {} }) : null, {
        status: meStatus,
      });
    }
    return new Response(null, { status: 401 });
  });
}

// api.ts keeps module-level single-flight guards (isRedirectingToSignIn /
// isVerifyingSession); reset the module between tests so each starts clean.
let apiAuthFetch: (path: string, options?: RequestInit) => Promise<unknown>;

describe("apiAuthFetch 401 handling (verify-before-logout)", () => {
  beforeEach(async () => {
    assign.mockClear();
    clearSession.mockClear();
    clearContext.mockClear();
    clearUser.mockClear();
    queryClientClear.mockClear();
    setLocation("/en/org-1/branch-1/dashboard/patients");
    vi.resetModules();
    ({ apiAuthFetch } = await import("./api"));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does NOT log out when the 401 is transient and /auth/me still succeeds", async () => {
    vi.stubGlobal("fetch", backendThenMe(200));

    await apiAuthFetch("/patients").catch(() => undefined);

    // Wait for the background liveness probe to fire.
    await vi.waitFor(() => {
      const urls = vi.mocked(fetch).mock.calls.map((c) => String(c[0]));
      expect(urls.some((u) => u.includes("/api/auth/me"))).toBe(true);
    });
    await Promise.resolve();

    // Session is alive → no teardown, no redirect.
    expect(assign).not.toHaveBeenCalled();
    expect(clearSession).not.toHaveBeenCalled();
  });

  it("logs out once (after a single /auth/me probe) when the session is dead", async () => {
    vi.stubGlobal("fetch", backendThenMe(401));

    // A dashboard query fan-out: many authenticated calls all 401 at once.
    await Promise.all(
      Array.from({ length: 8 }, () =>
        apiAuthFetch("/patients").catch(() => undefined),
      ),
    );

    await vi.waitFor(() => expect(assign).toHaveBeenCalledTimes(1));
    expect(assign).toHaveBeenCalledWith(
      "/en/sign-in?redirectTo=%2Forg-1%2Fbranch-1%2Fdashboard%2Fpatients",
    );
    expect(clearSession).toHaveBeenCalledTimes(1);

    // Single-flight: the burst triggers exactly one /auth/me probe.
    const meProbes = vi
      .mocked(fetch)
      .mock.calls.filter((c) => String(c[0]).includes("/api/auth/me"));
    expect(meProbes).toHaveLength(1);
  });

  it("never probes or redirects from a public auth page", async () => {
    setLocation("/en/sign-in");
    vi.stubGlobal("fetch", backendThenMe(401));

    await apiAuthFetch("/patients").catch(() => undefined);
    await Promise.resolve();
    await Promise.resolve();

    const meProbes = vi
      .mocked(fetch)
      .mock.calls.filter((c) => String(c[0]).includes("/api/auth/me"));
    expect(meProbes).toHaveLength(0);
    expect(assign).not.toHaveBeenCalled();
  });
});
