"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useCurrentUser } from "../hooks/useCurrentUser";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  SILENT_REFRESH_RATIO,
} from "../lib/auth.constants";

// Floor/cap the scheduling delay so a misconfigured or tiny TTL can't busy-loop
// the refresh endpoint, and a long TTL still leaves comfortable margin.
const MIN_DELAY_MS = 15 * 1000;
// After a transient network failure, retry soon rather than waiting a full TTL.
const RETRY_DELAY_MS = 20 * 1000;

type RefreshResult =
  | { ok: true; expiresInSeconds: number }
  | { ok: false; dead: boolean };

async function postRefresh(): Promise<RefreshResult> {
  // Plain fetch (not apiAuthFetch) so a 401 doesn't trigger the global
  // clearSessionAndRedirect — we decide here whether the session is truly dead.
  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    // 401 = refresh token genuinely rejected (the route already cleared the
    // cookies); anything else (5xx/network) is treated as transient.
    return { ok: false, dead: res.status === 401 };
  }

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
 * pair at ~80% of the access-token lifetime — well before the cookie expires.
 *
 * This is the primary fix for the "forced re-login after the access token
 * expires" bug. The session previously refreshed only reactively (on the next
 * API call after expiry), which races the backend's refresh-token rotation and
 * could wipe the session. By refreshing ahead of expiry, the token is (almost)
 * never expired, so the racy path is rarely exercised and the user stays signed
 * in until they explicitly log out.
 *
 * Mounted once, globally, inside `Providers`. Renders nothing.
 */
export function SilentRefreshProvider() {
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const isAuthenticated = Boolean(currentUser);

  // Mutable scheduling state kept in refs so the effect can manage a single
  // timer without re-subscribing on every render.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextRunAtRef = useRef<number>(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

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
          schedule(result.expiresInSeconds * SILENT_REFRESH_RATIO * 1000);
          return;
        }

        if (result.dead) {
          // Session is genuinely over (refresh token revoked / 7-day window
          // elapsed). Stop looping and let the app react: re-probing /auth/me
          // will 401 and route the user out through the normal sign-out path.
          clearTimer();
          queryClient.invalidateQueries({ queryKey: queryKeys.currentUser() });
          return;
        }

        // Transient failure (5xx) — retry soon without tearing down the session.
        schedule(RETRY_DELAY_MS);
      } catch {
        // Network blip — retry soon; never wipe the session on a transient error.
        if (!cancelled) schedule(RETRY_DELAY_MS);
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
  }, [isAuthenticated, queryClient]);

  return null;
}
