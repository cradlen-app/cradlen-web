import { describe, expect, it } from "vitest";
import { applyEffect, evaluate, firstMatchingMessage } from "./predicate.evaluator";
import type { Predicate } from "./predicates.types";

describe("evaluate", () => {
  it("eq matches all keys exactly", () => {
    expect(evaluate({ eq: { a: 1, b: "x" } }, { a: 1, b: "x" })).toBe(true);
    expect(evaluate({ eq: { a: 1, b: "x" } }, { a: 1, b: "y" })).toBe(false);
    expect(evaluate({ eq: { a: 1 } }, {})).toBe(false);
  });

  it("ne returns true only if every key differs", () => {
    expect(evaluate({ ne: { a: 1 } }, { a: 2 })).toBe(true);
    expect(evaluate({ ne: { a: 1 } }, { a: 1 })).toBe(false);
  });

  it("in checks list membership", () => {
    expect(evaluate({ in: { a: [1, 2, 3] } }, { a: 2 })).toBe(true);
    expect(evaluate({ in: { a: [1, 2, 3] } }, { a: 4 })).toBe(false);
  });

  it("and / or compose", () => {
    expect(
      evaluate(
        { and: [{ eq: { a: 1 } }, { ne: { b: 2 } }] },
        { a: 1, b: 3 },
      ),
    ).toBe(true);
    expect(
      evaluate(
        { or: [{ eq: { a: 99 } }, { eq: { b: 2 } }] },
        { a: 1, b: 2 },
      ),
    ).toBe(true);
  });
});

describe("applyEffect", () => {
  const preds: Predicate[] = [
    { effect: "visible", when: { eq: { visitor_type: "PATIENT" } } },
    { effect: "required", when: { eq: { marital_status: "MARRIED" } } },
  ];

  it("returns default when no predicate of that effect exists", () => {
    expect(applyEffect(preds, "enabled", {}, true)).toBe(true);
    expect(applyEffect(undefined, "required", {}, false)).toBe(false);
  });

  it("returns true when a matching predicate fires", () => {
    expect(applyEffect(preds, "visible", { visitor_type: "PATIENT" }, false)).toBe(true);
    expect(applyEffect(preds, "required", { marital_status: "MARRIED" }, false)).toBe(true);
  });

  it("returns false when predicate exists but does not fire", () => {
    expect(applyEffect(preds, "visible", { visitor_type: "MEDICAL_REP" }, true)).toBe(false);
  });
});

describe("firstMatchingMessage", () => {
  it("returns the first matching message", () => {
    const preds: Predicate[] = [
      {
        effect: "forbidden",
        when: { eq: { x: 1 } },
        message: "no x=1",
      },
    ];
    expect(firstMatchingMessage(preds, "forbidden", { x: 1 })).toBe("no x=1");
    expect(firstMatchingMessage(preds, "forbidden", { x: 2 })).toBeUndefined();
  });
});
