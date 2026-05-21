import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useSectionVisibility } from "./section-visibility";

function clearStorage() {
  for (const key of Object.keys(window.localStorage)) {
    if (key.startsWith("patientHistory.hiddenGroups.")) {
      window.localStorage.removeItem(key);
    }
  }
}

describe("useSectionVisibility", () => {
  beforeEach(() => {
    clearStorage();
  });

  it("starts empty when no prior state is stored and no default groups given", () => {
    const { result } = renderHook(() => useSectionVisibility("profile-1"));
    expect([...result.current.hidden]).toEqual([]);
  });

  it("starts with all groups hidden when no prior state is stored and default groups are given", () => {
    const groups = ["Gynecological History", "Obstetric History"];
    const { result } = renderHook(() => useSectionVisibility("profile-1", groups));
    expect(result.current.isHidden("Gynecological History")).toBe(true);
    expect(result.current.isHidden("Obstetric History")).toBe(true);
  });

  it("toggles a group through the public API", () => {
    const groups = ["Gynecological History"];
    const { result } = renderHook(() => useSectionVisibility("profile-1", groups));
    // Initially hidden
    expect(result.current.isHidden("Gynecological History")).toBe(true);
    // Toggle to visible
    act(() => result.current.toggle("Gynecological History"));
    expect(result.current.isHidden("Gynecological History")).toBe(false);
    // Toggle back to hidden
    act(() => result.current.toggle("Gynecological History"));
    expect(result.current.isHidden("Gynecological History")).toBe(true);
  });

  it("respects stored preference over default groups", () => {
    // Store an explicit (empty) preference — user has opened everything
    window.localStorage.setItem("patientHistory.hiddenGroups.profile-1", JSON.stringify([]));
    const groups = ["Gynecological History", "Obstetric History"];
    const { result } = renderHook(() => useSectionVisibility("profile-1", groups));
    expect(result.current.isHidden("Gynecological History")).toBe(false);
    expect(result.current.isHidden("Obstetric History")).toBe(false);
  });

  it("scopes by profileId — different profiles don't share hidden groups", () => {
    const groups = ["Gynecological History"];
    const a = renderHook(() => useSectionVisibility("profile-a", groups));
    const b = renderHook(() => useSectionVisibility("profile-b", groups));
    act(() => a.result.current.toggle("Gynecological History"));
    expect(a.result.current.isHidden("Gynecological History")).toBe(false);
    expect(b.result.current.isHidden("Gynecological History")).toBe(true);
  });
});
