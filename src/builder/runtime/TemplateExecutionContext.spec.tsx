import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  TemplateExecutionContextProvider,
  useTemplateExecution,
} from "./TemplateExecutionContext";
import type { FormTemplateDto } from "../templates/template.types";

/**
 * Characterization tests for `lockFilledControllerByTarget` — the map that makes
 * an entity-search fill target render read-only. This logic had no coverage; the
 * collision/over-listing branches are pinned here so a future refactor can't
 * change them silently. Where the behavior is a deliberate "trust the author"
 * choice (last-writer-wins, lock targets outside fillFields), the test documents
 * it rather than asserting an ideal.
 */

type SearchEntity = {
  fillFields?: Record<string, unknown>;
  lockFilled?: boolean;
  lockFilledFields?: string[];
};

function searchField(code: string, searchEntity: SearchEntity) {
  return { code, config: { ui: { searchEntity } } };
}

function makeTemplate(fields: unknown[]): FormTemplateDto {
  return {
    id: "t",
    code: "c",
    name: "n",
    version: 1,
    scope: "VISIT_CLINICAL",
    sections: [
      {
        id: "s",
        code: "sec",
        name: "S",
        order: 0,
        is_repeatable: false,
        config: {},
        fields,
      },
    ],
  } as unknown as FormTemplateDto;
}

function LockProbe() {
  const { lockFilledControllerByTarget } = useTemplateExecution();
  return (
    <div data-testid="lockmap">
      {JSON.stringify(lockFilledControllerByTarget)}
    </div>
  );
}

function lockMapOf(template: FormTemplateDto): Record<string, string> {
  render(
    <TemplateExecutionContextProvider template={template}>
      <LockProbe />
    </TemplateExecutionContextProvider>,
  );
  return JSON.parse(screen.getByTestId("lockmap").textContent ?? "{}");
}

describe("lockFilledControllerByTarget", () => {
  it("locks every filled sibling to its controller when lockFilled is true", () => {
    const t = makeTemplate([
      searchField("patient_search", {
        fillFields: { patient_name: "name", patient_dob: "dob" },
        lockFilled: true,
      }),
    ]);
    expect(lockMapOf(t)).toEqual({
      patient_name: "patient_search",
      patient_dob: "patient_search",
    });
  });

  it("narrows the lock to lockFilledFields when provided", () => {
    const t = makeTemplate([
      searchField("patient_search", {
        fillFields: { patient_name: "name", patient_dob: "dob", patient_phone: "phone" },
        lockFilledFields: ["patient_name"],
      }),
    ]);
    expect(lockMapOf(t)).toEqual({ patient_name: "patient_search" });
  });

  it("locks nothing when neither lockFilled nor lockFilledFields is set", () => {
    const t = makeTemplate([
      searchField("patient_search", {
        fillFields: { patient_name: "name" },
      }),
    ]);
    expect(lockMapOf(t)).toEqual({});
  });

  it("last controller in template order wins when two searches target the same field", () => {
    // Edge config: two searches both fill `shared`. The map collapses to a
    // single controller — currently the later field. Documented, not ideal.
    const t = makeTemplate([
      searchField("search_a", { fillFields: { shared: "x" }, lockFilled: true }),
      searchField("search_b", { fillFields: { shared: "y" }, lockFilled: true }),
    ]);
    expect(lockMapOf(t)).toEqual({ shared: "search_b" });
  });

  it("includes lockFilledFields targets even if they are not in fillFields", () => {
    // `ghost` is never filled by this search but is still registered as locked.
    // This trusts the template author; a misconfig would lock an unfilled field.
    const t = makeTemplate([
      searchField("patient_search", {
        fillFields: { patient_name: "name" },
        lockFilledFields: ["patient_name", "ghost"],
      }),
    ]);
    expect(lockMapOf(t)).toEqual({
      patient_name: "patient_search",
      ghost: "patient_search",
    });
  });
});
