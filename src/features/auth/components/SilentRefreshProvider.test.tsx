import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@/common/types/user.types";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  SILENT_REFRESH_RATIO,
} from "../lib/auth.constants";
import { SilentRefreshProvider } from "./SilentRefreshProvider";

const mockCurrentUser = vi.hoisted(
  () => ({ value: { data: undefined as CurrentUser | undefined } }),
);

vi.mock("../hooks/useCurrentUser", () => ({
  useCurrentUser: () => mockCurrentUser.value,
}));

const FIRST_DELAY_MS = ACCESS_TOKEN_TTL_SECONDS * SILENT_REFRESH_RATIO * 1000;

function refreshResponse(expiresIn: number) {
  return new Response(
    JSON.stringify({ data: { authenticated: true, expires_in: expiresIn }, meta: {} }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function renderProvider() {
  const client = new QueryClient();
  const invalidateSpy = vi.spyOn(client, "invalidateQueries");
  render(
    <QueryClientProvider client={client}>
      <SilentRefreshProvider />
    </QueryClientProvider>,
  );
  return { invalidateSpy };
}

const authed = {
  data: { id: "u1", email: "a@b.com", profiles: [] } as unknown as CurrentUser,
};

describe("SilentRefreshProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockCurrentUser.value = { data: undefined };
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("does not refresh for an anonymous visitor", async () => {
    mockCurrentUser.value = { data: undefined };

    renderProvider();
    await vi.advanceTimersByTimeAsync(FIRST_DELAY_MS * 2);

    expect(fetch).not.toHaveBeenCalled();
  });

  it("refreshes at ~80% of the access-token TTL when authenticated", async () => {
    mockCurrentUser.value = authed;
    vi.mocked(fetch).mockResolvedValue(refreshResponse(ACCESS_TOKEN_TTL_SECONDS));

    renderProvider();

    // Nothing yet just before the scheduled tick.
    await vi.advanceTimersByTimeAsync(FIRST_DELAY_MS - 1000);
    expect(fetch).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2000);
    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/refresh",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });

  it("reschedules using the expires_in returned by the refresh", async () => {
    mockCurrentUser.value = authed;
    // First refresh returns a short 60s TTL → next tick should be at 60*0.8 = 48s.
    vi.mocked(fetch)
      .mockResolvedValueOnce(refreshResponse(60))
      .mockResolvedValue(refreshResponse(60));

    renderProvider();

    await vi.advanceTimersByTimeAsync(FIRST_DELAY_MS);
    expect(fetch).toHaveBeenCalledTimes(1);

    // Not yet at 48s.
    await vi.advanceTimersByTimeAsync(40_000);
    expect(fetch).toHaveBeenCalledTimes(1);

    // Crossing 48s triggers the second refresh.
    await vi.advanceTimersByTimeAsync(10_000);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("stops looping and invalidates the session on a 401 (dead refresh token)", async () => {
    mockCurrentUser.value = authed;
    vi.mocked(fetch).mockResolvedValue(new Response("", { status: 401 }));

    const { invalidateSpy } = renderProvider();

    await vi.advanceTimersByTimeAsync(FIRST_DELAY_MS);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalled();

    // No further refreshes are scheduled after a dead session.
    await vi.advanceTimersByTimeAsync(FIRST_DELAY_MS * 2);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("retries (without logging out) after a transient network error", async () => {
    mockCurrentUser.value = authed;
    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValue(refreshResponse(ACCESS_TOKEN_TTL_SECONDS));

    const { invalidateSpy } = renderProvider();

    await vi.advanceTimersByTimeAsync(FIRST_DELAY_MS);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).not.toHaveBeenCalled();

    // Retry fires after the short backoff window.
    await vi.advanceTimersByTimeAsync(20_000);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
