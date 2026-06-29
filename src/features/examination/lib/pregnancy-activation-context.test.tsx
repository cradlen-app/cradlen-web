import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  PregnancyActivationContext,
  usePregnancyActivationContext,
} from "./pregnancy-activation-context";

describe("usePregnancyActivationContext", () => {
  it("returns null when no provider is mounted", () => {
    const { result } = renderHook(() => usePregnancyActivationContext());
    expect(result.current).toBeNull();
  });

  it("returns the provided visit context", () => {
    const value = { visitId: "v-42" };
    const { result } = renderHook(() => usePregnancyActivationContext(), {
      wrapper: ({ children }) => (
        <PregnancyActivationContext.Provider value={value}>
          {children}
        </PregnancyActivationContext.Provider>
      ),
    });
    expect(result.current).toEqual(value);
  });
});
