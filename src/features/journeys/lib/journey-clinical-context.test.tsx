import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  JourneyClinicalContext,
  useJourneyClinicalContext,
} from "./journey-clinical-context";

describe("useJourneyClinicalContext", () => {
  it("returns null when used outside a provider", () => {
    const { result } = renderHook(() => useJourneyClinicalContext());
    expect(result.current).toBeNull();
  });

  it("returns the provided value when wrapped in a provider", () => {
    const value = { visitId: "v-1" };
    const { result } = renderHook(() => useJourneyClinicalContext(), {
      wrapper: ({ children }) => (
        <JourneyClinicalContext.Provider value={value}>
          {children}
        </JourneyClinicalContext.Provider>
      ),
    });
    expect(result.current).toEqual(value);
  });
});
