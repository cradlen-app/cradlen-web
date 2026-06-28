import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TemplateExecutionContextProvider } from "../runtime/TemplateExecutionContext";
import { FieldRenderer, FULL_WIDTH_TYPES } from "./FieldRenderer";
import type { FormFieldDto, FormFieldType, FormTemplateDto } from "../templates/template.types";

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

function renderField(
  field: FormFieldDto,
  props: Partial<{ displayOnly: boolean; hardReadOnly: boolean; error: string }> = {},
  initialFormValues: Record<string, unknown> = {},
  initialSystemValues: Record<string, unknown> = {},
) {
  const template: FormTemplateDto = {
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
  return render(
    <TemplateExecutionContextProvider
      template={template}
      initialFormValues={initialFormValues}
      initialSystemValues={initialSystemValues}
    >
      <FieldRenderer field={field} {...props} />
    </TemplateExecutionContextProvider>,
  );
}

describe("FieldRenderer — conditional visibility", () => {
  it("renders nothing when a visible predicate is unsatisfied", () => {
    const field = makeField({
      code: "secret",
      config: { logic: { predicates: [{ effect: "visible", when: { eq: { show: true } } }] } },
    });
    const { container } = renderField(field);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("renders the input once the visible predicate is satisfied", () => {
    const field = makeField({
      code: "secret",
      config: { logic: { predicates: [{ effect: "visible", when: { eq: { show: true } } }] } },
    });
    renderField(field, {}, {}, { show: true });
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});

describe("FieldRenderer — enabled / required predicates", () => {
  it("disables the input when an enabled predicate is unsatisfied", () => {
    const field = makeField({
      code: "locked",
      config: { logic: { predicates: [{ effect: "enabled", when: { eq: { unlock: true } } }] } },
    });
    renderField(field);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("marks the field required when a required predicate fires", () => {
    const field = makeField({
      code: "needed",
      config: { logic: { predicates: [{ effect: "required", when: { eq: { mode: "FULL" } } }] } },
    });
    renderField(field, {}, {}, { mode: "FULL" });
    // FieldShell renders an asterisk for required fields.
    expect(screen.getByText("*")).toBeInTheDocument();
  });
});

describe("FieldRenderer — unsupported type", () => {
  it("renders a warning for an unknown field type", () => {
    const field = makeField({ code: "weird", type: "WIDGET" as FormFieldType });
    renderField(field);
    expect(screen.getByText(/Unsupported field type/)).toBeInTheDocument();
    expect(screen.getByText(/weird/)).toBeInTheDocument();
  });
});

describe("FieldRenderer — column span", () => {
  function spanClassOf(field: FormFieldDto): string {
    const { container } = renderField(field);
    const wrapper = container.querySelector("[class*='col-span-']");
    return wrapper?.className ?? "";
  }

  it("honors an explicit colSpan", () => {
    expect(spanClassOf(makeField({ code: "a", config: { ui: { colSpan: 4 } } }))).toContain("col-span-4");
  });

  it("defaults a plain TEXT input to half-width", () => {
    expect(spanClassOf(makeField({ code: "a" }))).toContain("col-span-6");
  });

  it("defaults a TEXTAREA to full-width", () => {
    expect(spanClassOf(makeField({ code: "a", type: "TEXTAREA" }))).toContain("col-span-12");
  });

  it("falls back to half-width for an out-of-range explicit colSpan", () => {
    expect(spanClassOf(makeField({ code: "a", config: { ui: { colSpan: 99 } } }))).toContain("col-span-6");
  });
});

describe("FieldRenderer — displayOnly", () => {
  it("renders the value as static text (no input) for a plain field", () => {
    const field = makeField({ code: "greeting" });
    renderField(field, { displayOnly: true }, { greeting: "Hello" });
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});

describe("FieldRenderer — error surfacing", () => {
  it("shows the error message under the input", () => {
    const field = makeField({ code: "name" });
    renderField(field, { error: "Name is required" });
    expect(screen.getByText("Name is required")).toBeInTheDocument();
  });
});

describe("FULL_WIDTH_TYPES", () => {
  it("lists the full-width field types", () => {
    expect(FULL_WIDTH_TYPES.has("TEXTAREA")).toBe(true);
    expect(FULL_WIDTH_TYPES.has("MULTISELECT")).toBe(true);
    expect(FULL_WIDTH_TYPES.has("ENTITY_SEARCH")).toBe(true);
    expect(FULL_WIDTH_TYPES.has("TEXT")).toBe(false);
  });
});
