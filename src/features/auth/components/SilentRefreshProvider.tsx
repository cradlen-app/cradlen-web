"use client";

import { useEffect, useRef } from "react";
import { useCurrentUser } from "../hooks/useCurrentUser";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  SILENT_REFRESH_RATIO,
} from "../lib/auth.constants";

// Floor/cap the scheduling delay so a misconfigured or tiny TTL can't busy-loop
// the refresh endpoint, and a long TTL still leaves comfortable margin.
const MIN_DELAY_MS = 15 * 1000;
// After a failed refresh, retry soon rather than waiting a full TTL.
const RETRY_DELAY_MS = 20 * 1000;
// Stop the proactive loop after this many consecutive failures. The session
// isn't torn down here — the next user-driven request runs the authoritative
// verify-before-logout check in apiAuthFetch. This just stops pointless polling.
const MAX_CONSECUTIVE_FAILURES = 5;

type RefreshOutcome = { ok: boolean; expiresInSeconds: number };

async function postRefresh(): Promise<RefreshOutcome> {
  // Plain fetch (not apiAuthFetch) so this never triggers the global
  // session-teardown path; the proactive refresh is best-effort and must never
  // log the user out on its own.
  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) return { ok: false, expiresInSeconds: ACCESS_TOKEN_TTL_SECONDS };

  const body = (await res.json().catch(() => null)) as {
    data?: { expires_in?: number | null };
  } | null;
  const expiresIn = body?.data?.expires_in;
  const expiresInSeconds =
    typeof expiresIn === "number" && expiresIn > 0
      ? expiresIn
      : ACCESS_TOKEN_TTL_SECONDS;
  return { ok: true, expiresInSeconds };
}

/**
 * Keeps the staff session alive proactively: while a user is signed in (a
 * `/auth/me` query has resolved a user), it refreshes the access/refresh token
 * pair at ~80% of the access-token lifetime — well before the cookie expires —
 * so an active user (e.g. a doctor in a long visit) stays signed in until they
 * explicitly log out.
 *
 * Best-effort by design: a failed proactive refresh is treated as transient and
 * never tears down the session. Session death is decided solely by the
 * verify-before-logout path in `apiAuthFetch` (probe `/auth/me`), so a transient
 * refresh-rotation race can't produce a false logout.
 *
 * Mounted once, globally, inside `Providers`. Renders nothing.
 */
export function SilentRefreshProvider() {
  const { data: currentUser } = useCurrentUser();
  const isAuthenticated = Boolean(currentUser);

  // Mutable scheduling state kept in refs so the effect can manage a single
  // timer without re-subscribing on every render.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextRunAtRef = useRef<number>(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    let consecutiveFailures = 0;

    const clearTimer = () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const schedule = (delayMs: number) => {
      clearTimer();
      const delay = Math.max(MIN_DELAY_MS, delayMs);
      nextRunAtRef.current = Date.now() + delay;
      timerRef.current = setTimeout(run, delay);
    };

    async function run() {
      if (cancelled) return;
      try {
        const result = await postRefresh();
        if (cancelled) return;

        if (result.ok) {
          consecutiveFailures = 0;
          schedule(result.expiresInSeconds * SILENT_REFRESH_RATIO * 1000);
          return;
        }
        consecutiveFailures += 1;
      } catch {
        if (cancelled) return;
        consecutiveFailures += 1;
      }

      // Failure (HTTP error or network blip) — retry a few times, then give up
      // quietly. Never wipe the session here.
      if (consecutiveFailures < MAX_CONSECUTIVE_FAILURES) {
        schedule(RETRY_DELAY_MS);
      } else {
        clearTimer();
      }
    }

    // Background tabs throttle setTimeout, so a scheduled refresh can be late.
    // When the tab becomes visible again, run immediately if we're overdue.
    const onVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() >= nextRunAtRef.current
      ) {
        void run();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    // Anchor the first refresh off the known access-token TTL; every subsequent
    // tick re-anchors off the live `expires_in` from the refresh response.
    schedule(ACCESS_TOKEN_TTL_SECONDS * SILENT_REFRESH_RATIO * 1000);

    return () => {
      cancelled = true;
      clearTimer();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isAuthenticated]);

  return null;
}
