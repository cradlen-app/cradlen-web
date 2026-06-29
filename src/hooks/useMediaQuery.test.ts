import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useMediaQuery } from "./useMediaQuery";

type Listener = (e: MediaQueryListEvent) => void;

function installMatchMedia(initialMatches: boolean) {
  const listeners = new Set<Listener>();
  let matches = initialMatches;
  const mql = {
    get matches() {
      return matches;
    },
    media: "(min-width: 768px)",
    addEventListener: (_: string, cb: Listener) => listeners.add(cb),
    removeEventListener: (_: string, cb: Listener) => listeners.delete(cb),
  };
  window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia;
  return {
    setMatches(next: boolean) {
      matches = next;
      listeners.forEach((cb) => cb({ matches } as MediaQueryListEvent));
    },
    listenerCount: () => listeners.size,
  };
}

describe("useMediaQuery", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it("reads the initial match value from matchMedia", () => {
    installMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(true);
  });

  it("returns false when the query does not match", () => {
    installMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);
  });

  it("updates when the media query change event fires", () => {
    const controller = installMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);

    act(() => controller.setMatches(true));
    expect(result.current).toBe(true);
  });

  it("unsubscribes the change listener on unmount", () => {
    const controller = installMatchMedia(false);
    const { unmount } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(controller.listenerCount()).toBe(1);
    unmount();
    expect(controller.listenerCount()).toBe(0);
  });
});
