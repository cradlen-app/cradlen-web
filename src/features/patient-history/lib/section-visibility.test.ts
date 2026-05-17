import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useSectionVisibility } from "./section-visibility";

function clearStorage() {
  for (const key of Object.keys(window.localStorage)) {
    if (key.startsWith("patientHistory.hiddenSections.")) {
      window.localStorage.removeItem(key);
    }
  }
}

describe("useSectionVisibility", () => {
  beforeEach(() => {
    clearStorage();
  });

  it("starts empty when no prior state is stored", () => {
    const { result } = renderHook(() => useSectionVisibility("profile-1"));
    expect([...result.current.hidden]).toEqual([]);
  });

  it("toggles a section through the public API", () => {
    const { result } = renderHook(() => useSectionVisibility("profile-1"));
    act(() => result.current.toggle("menstrual_history"));
    expect(result.current.isHidden("menstrual_history")).toBe(true);
    act(() => result.current.toggle("menstrual_history"));
    expect(result.current.isHidden("menstrual_history")).toBe(false);
  });

  it("scopes by profileId — different profiles don't share hidden sections", () => {
    const a = renderHook(() => useSectionVisibility("profile-a"));
    const b = renderHook(() => useSectionVisibility("profile-b"));
    act(() => a.result.current.toggle("allergies"));
    expect(a.result.current.isHidden("allergies")).toBe(true);
    expect(b.result.current.isHidden("allergies")).toBe(false);
  });
});