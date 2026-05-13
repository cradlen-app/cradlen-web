/**
 * Mirror of cradlen-api/src/builder/rules/predicates.ts. The frontend and
 * server read the same predicate shape and run them through the same
 * evaluator. Port verbatim when the API changes.
 */

export type PredicateCondition =
  | { eq: Record<string, unknown> }
  | { in: Record<string, unknown[]> }
  | { ne: Record<string, unknown> }
  | { and: PredicateCondition[] }
  | { or: PredicateCondition[] };

export type PredicateEffect = "visible" | "required" | "forbidden" | "enabled";

export interface Predicate {
  effect: PredicateEffect;
  when: PredicateCondition;
  message?: string;
}
