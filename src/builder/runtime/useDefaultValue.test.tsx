import type { ReactNode } from "react";
import { render, screen, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  TemplateExecutionContextProvider,
  useTemplateExecution,
} from "./TemplateExecutionContext";
import { useDefaultValue } from "./useDefaultValue";
import { useFieldValue } from "./useFieldState";
import type { FieldOption, FormFieldDto, FormTemplateDto } from "../templates/template.types";

function makeField(partial: Partial<FormFieldDto> & { code: string }): FormFieldDto {
  return {
    id: `f-${partial.code}`,
    label: partial.code,
    type: "TEXT",
    order: 0,
    required: false,
    binding: { namespace: "VISIT", path: partial.code },
    config: {},
    ...partial,
  } as FormFieldDto;
}

function templateFor(field: FormFieldDto): FormTemplateDto {
  return {
    id: "tpl",
    code: "tpl",
    name: "T",
    description: null,
    scope: "BOOK_VISIT",
    version: 1,
    activated_at: null,
    specialty_id: null,
    sections: [{ id: "s", code: "sec", name: "S", order: 0, config: {}, fields: [field] }],
  };
}

/** Renders the hook for a field and exposes the resulting field value + a setter. */
function Harness({
  field,
  options = [],
}: {
  field: FormFieldDto;
  options?: ReadonlyArray<FieldOption>;
}) {
  useDefaultValue(field, options);
  const value = useFieldValue(field.code);
  const { setFieldValue } = useTemplateExecution();
  return (
    <div>
      <output data-testid="value">{value === undefined ? "∅" : String(value)}</output>
      <button onClick={() => setFieldValue(field.code, "typed")}>set</button>
    </div>
  );
}

function renderHook(
  field: FormFieldDto,
  options: ReadonlyArray<FieldOption> = [],
  initialFormValues: Record<string, unknown> = {},
  wrapper?: (node: ReactNode) => ReactNode,
) {
  const inner = (
    <TemplateExecutionContextProvider template={templateFor(field)} initialFormValues={initialFormValues}>
      <Harness field={field} options={options} />
    </TemplateExecutionContextProvider>
  );
  return render(<>{wrapper ? wrapper(inner) : inner}</>);
}

function value() {
  return screen.getByTestId("value").textContent;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("useDefaultValue", () => {
  it("applies a literal default when the field is empty", () => {
    renderHook(makeField({ code: "priority", config: { ui: { default: "NORMAL" } } }));
    expect(value()).toBe("NORMAL");
  });

  it("does nothing when no default is configured", () => {
    renderHook(makeField({ code: "notes" }));
    expect(value()).toBe("∅");
  });

  it("does not overwrite a pre-filled value", () => {
    renderHook(
      makeField({ code: "priority", config: { ui: { default: "NORMAL" } } }),
      [],
      { priority: "HIGH" },
    );
    expect(value()).toBe("HIGH");
  });

  it("applies the first option for kind:first_option once options resolve", () => {
    renderHook(
      makeField({ code: "doctor", type: "SELECT", config: { ui: { default: { kind: "first_option" } } } }),
      [{ code: "doc-1", label: "Dr One" }, { code: "doc-2", label: "Dr Two" }],
    );
    expect(value()).toBe("doc-1");
  });

  it("waits (applies nothing) for first_option when options are empty", () => {
    renderHook(
      makeField({ code: "doctor", type: "SELECT", config: { ui: { default: { kind: "first_option" } } } }),
      [],
    );
    expect(value()).toBe("∅");
  });

  it("emits a YYYY-MM-DD value for kind:now on a DATE field", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 9, 13, 45)); // local 2026-03-09 13:45
    renderHook(makeField({ code: "visit_date", type: "DATE", config: { ui: { default: { kind: "now" } } } }));
    expect(value()).toBe("2026-03-09");
  });

  it("emits a YYYY-MM-DDTHH:mm value for kind:now on a non-DATE field", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 9, 13, 45));
    renderHook(makeField({ code: "visit_at", type: "DATETIME", config: { ui: { default: { kind: "now" } } } }));
    expect(value()).toBe("2026-03-09T13:45");
  });

  it("re-applies the default after the value is cleared (empty guard re-fires)", () => {
    renderHook(makeField({ code: "priority", config: { ui: { default: "NORMAL" } } }));
    expect(value()).toBe("NORMAL");
    // The user typing replaces it; the default does not clobber the typed value.
    act(() => {
      screen.getByText("set").click();
    });
    expect(value()).toBe("typed");
  });
});
