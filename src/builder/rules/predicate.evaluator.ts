import type { Predicate, PredicateCondition, PredicateEffect } from "./predicates.types";

/**
 * Mirror of cradlen-api/src/builder/rules/predicate.evaluator.ts. Pure-TS.
 */
export function evaluate(
  condition: PredicateCondition,
  values: Record<string, unknown>,
): boolean {
  if ("eq" in condition) {
    return Object.entries(condition.eq).every(([k, v]) => values[k] === v);
  }
  if ("ne" in condition) {
    return Object.entries(condition.ne).every(([k, v]) => values[k] !== v);
  }
  if ("in" in condition) {
    return Object.entries(condition.in).every(([k, list]) =>
      list.includes(values[k]),
    );
  }
  if ("and" in condition) {
    return condition.and.every((sub) => evaluate(sub, values));
  }
  if ("or" in condition) {
    return condition.or.some((sub) => evaluate(sub, values));
  }
  const _exhaustive: never = condition;
  void _exhaustive;
  return false;
}

/**
 * Resolves a given effect against a predicate list. If no predicate of that
 * effect exists, returns `defaultValue`. Otherwise returns true iff ANY
 * matching predicate fires (visible/required/enabled/forbidden are all
 * monotonic — one rule firing turns the effect on).
 */
export function applyEffect(
  predicates: Predicate[] | undefined,
  effect: PredicateEffect,
  values: Record<string, unknown>,
  defaultValue: boolean,
): boolean {
  if (!predicates || predicates.length === 0) return defaultValue;
  const relevant = predicates.filter((p) => p.effect === effect);
  if (relevant.length === 0) return defaultValue;
  return relevant.some((p) => evaluate(p.when, values));
}

/**
 * Returns the first matching predicate's `message`, or undefined. Used for
 * surfacing rule-specific hints (e.g. "spouse_full_name is required when
 * marital_status is MARRIED").
 */
export function firstMatchingMessage(
  predicates: Predicate[] | undefined,
  effect: PredicateEffect,
  values: Record<string, unknown>,
): string | undefined {
  if (!predicates) return undefined;
  for (const p of predicates) {
    if (p.effect === effect && evaluate(p.when, values)) {
      return p.message;
    }
  }
  return undefined;
}
