import { beforeEach, describe, expect, it } from "vitest";
import { loadInstructions, saveInstructions } from "./instructions-store";
import type { PaymentInstructions } from "./subscriptions.types";

const instructions: PaymentInstructions = {
  provider: "INSTAPAY",
  pay_to: "clinic@instapay",
  amount: "1200",
  currency: "EGP",
  reference: "REF-1",
  note: "Pay within 24h",
};

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("instructions-store", () => {
  it("round-trips saved instructions for a payment id", () => {
    saveInstructions("pay-1", instructions);
    expect(loadInstructions("pay-1")).toEqual(instructions);
  });

  it("scopes storage per payment id", () => {
    saveInstructions("pay-1", instructions);
    expect(loadInstructions("pay-2")).toBeNull();
  });

  it("returns null when nothing was saved", () => {
    expect(loadInstructions("missing")).toBeNull();
  });

  it("returns null when the stored value is corrupt JSON", () => {
    window.sessionStorage.setItem(
      "subscription-payment-instructions:pay-3",
      "{not-json",
    );
    expect(loadInstructions("pay-3")).toBeNull();
  });

  it("persists under a namespaced sessionStorage key", () => {
    saveInstructions("pay-9", instructions);
    expect(
      window.sessionStorage.getItem(
        "subscription-payment-instructions:pay-9",
      ),
    ).toBe(JSON.stringify(instructions));
  });
});
