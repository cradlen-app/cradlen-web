import { render } from "@testing-library/react";
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
const RETRY_DELAY_MS = 20 * 1000;
const MAX_CONSECUTIVE_FAILURES = 5;

function refreshResponse(expiresIn: number) {
  return new Response(
    JSON.stringify({ data: { authenticated: true, expires_in: expiresIn }, meta: {} }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
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

    render(<SilentRefreshProvider />);
    await vi.advanceTimersByTimeAsync(FIRST_DELAY_MS * 2);

    expect(fetch).not.toHaveBeenCalled();
  });

  it("refreshes at ~80% of the access-token TTL when authenticated", async () => {
    mockCurrentUser.value = authed;
    vi.mocked(fetch).mockResolvedValue(refreshResponse(ACCESS_TOKEN_TTL_SECONDS));

    render(<SilentRefreshProvider />);

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
    vi.mocked(fetch).mockResolvedValue(refreshResponse(60));

    render(<SilentRefreshProvider />);

    await vi.advanceTimersByTimeAsync(FIRST_DELAY_MS);
    expect(fetch).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(40_000);
    expect(fetch).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(10_000);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("treats a failed refresh as transient and retries (never logs out)", async () => {
    mockCurrentUser.value = authed;
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response("", { status: 401 }))
      .mockResolvedValue(refreshResponse(ACCESS_TOKEN_TTL_SECONDS));

    render(<SilentRefreshProvider />);

    await vi.advanceTimersByTimeAsync(FIRST_DELAY_MS);
    expect(fetch).toHaveBeenCalledTimes(1);

    // Retries after the short backoff and recovers.
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("gives up quietly after repeated consecutive failures", async () => {
    mockCurrentUser.value = authed;
    vi.mocked(fetch).mockResolvedValue(new Response("", { status: 500 }));

    render(<SilentRefreshProvider />);

    await vi.advanceTimersByTimeAsync(FIRST_DELAY_MS);
    // Each subsequent failure retries after RETRY_DELAY_MS, up to the cap.
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS * (MAX_CONSECUTIVE_FAILURES + 2));
    expect(fetch).toHaveBeenCalledTimes(MAX_CONSECUTIVE_FAILURES);
  });
});
