import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { SidebarProvider, useSidebar } from "./SidebarContext";

function wrapper({ children }: { children: ReactNode }) {
  return <SidebarProvider>{children}</SidebarProvider>;
}

describe("SidebarContext", () => {
  it("throws when useSidebar is used outside a provider", () => {
    expect(() => renderHook(() => useSidebar())).toThrow(
      /must be inside SidebarProvider/,
    );
  });

  it("exposes the default collapsed/mobile state", () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });
    expect(result.current.collapsed).toBe(false);
    expect(result.current.mobileOpen).toBe(false);
  });

  it("toggles the collapsed flag", () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });
    act(() => result.current.setCollapsed(true));
    expect(result.current.collapsed).toBe(true);
  });

  it("opens, closes and toggles the mobile drawer", () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });

    act(() => result.current.openMobile());
    expect(result.current.mobileOpen).toBe(true);

    act(() => result.current.closeMobile());
    expect(result.current.mobileOpen).toBe(false);

    act(() => result.current.toggleMobile());
    expect(result.current.mobileOpen).toBe(true);
    act(() => result.current.toggleMobile());
    expect(result.current.mobileOpen).toBe(false);
  });
});
