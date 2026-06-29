import { describe, expect, it } from "vitest";
import en from "./en.json";
import ar from "./ar.json";

/**
 * Guards English/Arabic message parity. Every key present in one locale must
 * exist in the other, so a feature shipped with only `en.json` updated (or only
 * `ar.json`) fails CI instead of rendering a raw key path to users. See
 * AGENTS.md § "Localization Rules" — `en.json` and `ar.json` must stay
 * key-compatible.
 */
function flattenKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("message catalog parity (en ↔ ar)", () => {
  const enKeys = new Set(flattenKeys(en));
  const arKeys = new Set(flattenKeys(ar));

  it("has no English keys missing from Arabic", () => {
    const missing = [...enKeys].filter((key) => !arKeys.has(key)).sort();
    expect(missing, `Keys in en.json but not ar.json:\n${missing.join("\n")}`).toEqual([]);
  });

  it("has no Arabic keys missing from English", () => {
    const missing = [...arKeys].filter((key) => !enKeys.has(key)).sort();
    expect(missing, `Keys in ar.json but not en.json:\n${missing.join("\n")}`).toEqual([]);
  });
});
