import { describe, expect, it } from "vitest";
import { applyEffect, evaluate, firstMatchingMessage } from "./predicate.evaluator";
import type { Predicate, PredicateCondition } from "./predicates.types";

describe("evaluate — contains", () => {
  it("matches when the array value includes the target", () => {
    expect(evaluate({ contains: { tags: "ANC" } }, { tags: ["ANC", "PNC"] })).toBe(true);
  });

  it("is false when the array does not include the target", () => {
    expect(evaluate({ contains: { tags: "X" } }, { tags: ["ANC"] })).toBe(false);
  });

  it("is false when the value is not an array", () => {
    expect(evaluate({ contains: { tags: "ANC" } }, { tags: "ANC" })).toBe(false);
    expect(evaluate({ contains: { tags: "ANC" } }, {})).toBe(false);
  });

  it("requires every contains key to match", () => {
    expect(
      evaluate({ contains: { a: 1, b: 2 } }, { a: [1], b: [3] }),
    ).toBe(false);
  });
});

describe("evaluate — in / ne edge values", () => {
  it("ne is true when the key is absent (undefined !== value)", () => {
    expect(evaluate({ ne: { a: 1 } }, {})).toBe(true);
  });

  it("nested and/or short-circuit correctly", () => {
    expect(evaluate({ and: [{ eq: { a: 1 } }, { eq: { b: 2 } }] }, { a: 1, b: 9 })).toBe(false);
    expect(evaluate({ or: [{ eq: { a: 9 } }, { eq: { b: 9 } }] }, { a: 1, b: 2 })).toBe(false);
  });

  it("returns false for an unrecognized condition shape (exhaustive fallback)", () => {
    // Deliberately malformed condition — none of the known keys are present.
    const bogus = {} as unknown as PredicateCondition;
    expect(evaluate(bogus, { a: 1 })).toBe(false);
  });
});

describe("applyEffect — empty predicate list", () => {
  it("returns the default when given an empty array", () => {
    expect(applyEffect([], "visible", {}, true)).toBe(true);
    expect(applyEffect([], "required", {}, false)).toBe(false);
  });
});

describe("firstMatchingMessage — edge branches", () => {
  it("returns undefined when predicates is undefined", () => {
    expect(firstMatchingMessage(undefined, "required", {})).toBeUndefined();
  });

  it("returns undefined when the matching predicate has no message", () => {
    const preds: Predicate[] = [{ effect: "required", when: { eq: { a: 1 } } }];
    expect(firstMatchingMessage(preds, "required", { a: 1 })).toBeUndefined();
  });

  it("skips non-matching effects and conditions and returns the first true match's message", () => {
    const preds: Predicate[] = [
      { effect: "visible", when: { eq: { a: 1 } }, message: "wrong-effect" },
      { effect: "required", when: { eq: { a: 9 } }, message: "not-firing" },
      { effect: "required", when: { eq: { a: 1 } }, message: "the-one" },
    ];
    expect(firstMatchingMessage(preds, "required", { a: 1 })).toBe("the-one");
  });
});
