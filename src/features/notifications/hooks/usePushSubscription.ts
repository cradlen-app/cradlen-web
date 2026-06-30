"use client";

import { useCallback, useEffect, useState } from "react";
import { apiAuthFetch } from "@/infrastructure/http/api";

// The VAPID public key is inlined at build time. It is non-sensitive and must
// match the backend's VAPID_PUBLIC_KEY. When unset, push is treated as
// unsupported and the UI degrades gracefully (no "enable" affordance).
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export type PushStatus =
  | "unsupported" // no SW/PushManager/Notification API, or no VAPID key configured
  | "default" // supported, permission not yet requested
  | "denied" // user blocked notifications at the browser level
  | "subscribed"; // permission granted and an active subscription is registered

/**
 * Web Push wants the application server key as raw bytes, not base64url. Backed
 * by an explicit ArrayBuffer so the result is `Uint8Array<ArrayBuffer>` (what
 * `applicationServerKey: BufferSource` expects), not the `ArrayBufferLike`
 * variant that includes SharedArrayBuffer.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

function isSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    VAPID_PUBLIC_KEY.length > 0
  );
}

async function registerSubscription(sub: PushSubscription): Promise<void> {
  const json = sub.toJSON();
  await apiAuthFetch("/push/subscribe", {
    method: "POST",
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  });
}

/**
 * Manages this browser's Web Push subscription against the backend `/push`
 * endpoints (proxied like every other authenticated call via apiAuthFetch).
 * Headless and idempotent — read `status`, call `enable()` / `disable()` from an
 * explicit opt-in control, or `resync()` to re-register an already-granted
 * subscription without prompting.
 */
export function usePushSubscription() {
  const [status, setStatus] = useState<PushStatus>("unsupported");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!isSupported()) return setStatus("unsupported");
    if (Notification.permission === "denied") return setStatus("denied");
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    setStatus(sub && Notification.permission === "granted" ? "subscribed" : "default");
  }, []);

  useEffect(() => {
    // refresh() reads browser-only push state (permission + existing
    // subscription) after mount; its setState runs after async work, not as a
    // synchronous cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const enable = useCallback(async () => {
    if (!isSupported() || busy) return;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "default");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }));
      await registerSubscription(sub);
      setStatus("subscribed");
    } finally {
      setBusy(false);
    }
  }, [busy]);

  const disable = useCallback(async () => {
    if (!isSupported() || busy) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await apiAuthFetch("/push/unsubscribe", {
          method: "POST",
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => null);
        await sub.unsubscribe().catch(() => false);
      }
      setStatus("default");
    } finally {
      setBusy(false);
    }
  }, [busy]);

  // Silent: re-register an existing grant with the backend (e.g. after re-login).
  // Never requests permission, so it's safe to call on every authenticated load.
  const resync = useCallback(async () => {
    if (!isSupported() || Notification.permission !== "granted") return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    await registerSubscription(sub).catch(() => null);
    setStatus("subscribed");
  }, []);

  return { status, busy, enable, disable, resync, supported: isSupported() };
}
