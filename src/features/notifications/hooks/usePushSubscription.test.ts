import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiAuthFetch } from "@/infrastructure/http/api";

// The hook reads NEXT_PUBLIC_VAPID_PUBLIC_KEY at module-eval time, so it must be
// set before the static import below is evaluated. "QUJD" is valid base64url.
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "QUJD";
});

vi.mock("@/infrastructure/http/api", () => ({ apiAuthFetch: vi.fn() }));

import { usePushSubscription } from "./usePushSubscription";

const mockFetch = vi.mocked(apiAuthFetch);

type NotificationPermission = "default" | "granted" | "denied";

function makeSub(endpoint = "https://push.example/e-1") {
  return {
    endpoint,
    toJSON: () => ({ endpoint, keys: { p256dh: "p", auth: "a" } }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  };
}

function installBrowserEnv(opts: {
  serviceWorker?: boolean;
  pushManager?: boolean;
  permission?: NotificationPermission;
  existingSub?: ReturnType<typeof makeSub> | null;
  grantOnRequest?: NotificationPermission;
} = {}) {
  const {
    serviceWorker = true,
    pushManager = true,
    permission = "default",
    existingSub = null,
    grantOnRequest = "granted",
  } = opts;

  const requestPermission = vi.fn().mockResolvedValue(grantOnRequest);
  vi.stubGlobal("Notification", { permission, requestPermission });
  if (pushManager) vi.stubGlobal("PushManager", function PushManager() {});

  const subscribe = vi.fn().mockResolvedValue(makeSub());
  const getSubscription = vi.fn().mockResolvedValue(existingSub);
  if (serviceWorker) {
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: {
        ready: Promise.resolve({ pushManager: { subscribe, getSubscription } }),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });
  }
  return { requestPermission, subscribe, getSubscription };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue(undefined as never);
});

afterEach(() => {
  // stubGlobal cleanup is handled by setup.ts (vi.unstubAllGlobals); the
  // navigator property is defined directly, so drop it here.
  delete (window.navigator as { serviceWorker?: unknown }).serviceWorker;
});

describe("usePushSubscription", () => {
  it("is unsupported when the browser has no service worker", async () => {
    installBrowserEnv({ serviceWorker: false });
    const { result } = renderHook(() => usePushSubscription());
    await waitFor(() => expect(result.current.status).toBe("unsupported"));
    expect(result.current.supported).toBe(false);
  });

  it("reports denied when notifications are blocked", async () => {
    installBrowserEnv({ permission: "denied" });
    const { result } = renderHook(() => usePushSubscription());
    await waitFor(() => expect(result.current.status).toBe("denied"));
  });

  it("reports subscribed when a grant + subscription already exist", async () => {
    installBrowserEnv({ permission: "granted", existingSub: makeSub() });
    const { result } = renderHook(() => usePushSubscription());
    await waitFor(() => expect(result.current.status).toBe("subscribed"));
  });

  it("enable() requests permission, subscribes, and registers with the backend", async () => {
    const env = installBrowserEnv({ permission: "default" });
    const { result } = renderHook(() => usePushSubscription());
    await waitFor(() => expect(result.current.status).toBe("default"));

    await act(async () => {
      await result.current.enable();
    });

    expect(env.requestPermission).toHaveBeenCalledTimes(1);
    expect(env.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({ userVisibleOnly: true }),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      "/push/subscribe",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result.current.status).toBe("subscribed");
  });

  it("enable() stops at denied without subscribing when permission is refused", async () => {
    const env = installBrowserEnv({
      permission: "default",
      grantOnRequest: "denied",
    });
    const { result } = renderHook(() => usePushSubscription());
    await waitFor(() => expect(result.current.status).toBe("default"));

    await act(async () => {
      await result.current.enable();
    });

    expect(env.subscribe).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.status).toBe("denied");
  });

  it("disable() unsubscribes locally and tells the backend", async () => {
    const sub = makeSub();
    installBrowserEnv({ permission: "granted", existingSub: sub });
    const { result } = renderHook(() => usePushSubscription());
    await waitFor(() => expect(result.current.status).toBe("subscribed"));

    await act(async () => {
      await result.current.disable();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/push/unsubscribe",
      expect.objectContaining({ method: "POST" }),
    );
    expect(sub.unsubscribe).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("default");
  });
});
