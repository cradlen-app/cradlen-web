import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MultiSelectInput } from "./MultiSelectInput";
import { TemplateExecutionContextProvider } from "../../runtime/TemplateExecutionContext";
import type { FormFieldDto, FormTemplateDto } from "../../templates/template.types";
import type { FieldInputProps } from "../input-props";

function makeField(variant?: string): FormFieldDto {
  return {
    id: "f1",
    code: "complaint_category",
    label: "Complaint category",
    type: "MULTISELECT",
    binding: { namespace: "VISIT_ENCOUNTER", path: "chief_complaint_meta.categories" },
    config: {
      ui: variant ? { variant } : {},
      validation: {
        options: [
          { code: "ROUTINE_CHECK", label: "Routine check" },
          { code: "PAIN", label: "Pain" },
        ],
      },
      logic: {},
    },
    order: 1,
    required: false,
  } as unknown as FormFieldDto;
}

function makeTemplate(field: FormFieldDto): FormTemplateDto {
  return {
    id: "t",
    code: "test",
    name: "Test",
    description: null,
    scope: "PATIENT_HISTORY",
    version: 1,
    activated_at: null,
    specialty_id: null,
    sections: [
      {
        id: "s",
        code: "sec",
        name: "Sec",
        order: 0,
        config: {},
        fields: [field],
      },
    ],
  };
}

function renderField(field: FormFieldDto) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TemplateExecutionContextProvider template={makeTemplate(field)}>
        <MultiSelectInput
          field={field as unknown as FieldInputProps["field"]}
          value={[]}
          onChange={vi.fn()}
          required={false}
          disabled={false}
        />
      </TemplateExecutionContextProvider>
    </QueryClientProvider>,
  );
}

describe("MultiSelectInput", () => {
  it("passes inline=true to FieldShell when variant is checkboxes", () => {
    const { container } = renderField(makeField("checkboxes"));
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.tagName).toBe("DIV");
    expect(wrapper.className).toContain("flex");
  });

  it("does NOT pass inline when variant is default (pills)", () => {
    const { container } = renderField(makeField());
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.tagName).toBe("LABEL");
  });
});
