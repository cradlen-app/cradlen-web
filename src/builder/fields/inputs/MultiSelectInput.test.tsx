import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MultiSelectInput } from "./MultiSelectInput";
import { TemplateExecutionContextProvider } from "../../runtime/TemplateExecutionContext";
import type { FormFieldDto, FormTemplateDto } from "../../templates/template.types";

function makeField(variant?: "checkboxes"): FormFieldDto {
  return {
    id: "f1",
    code: "items",
    label: "Items",
    type: "MULTISELECT",
    order: 0,
    required: false,
    binding: { namespace: "PATIENT_OBGYN_HISTORY", path: "items" },
    config: {
      ui: variant ? { variant } : {},
      validation: {
        options: [
          { code: "A", label: "Apple" },
          { code: "B", label: "Banana" },
        ],
      },
    },
  };
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

function renderField(field: FormFieldDto, onChange: (v: unknown) => void) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <TemplateExecutionContextProvider template={makeTemplate(field)}>
        <MultiSelectInput
          field={field}
          value={[]}
          onChange={onChange}
          required={false}
          disabled={false}
        />
      </TemplateExecutionContextProvider>
    </QueryClientProvider>,
  );
}

describe("MultiSelectInput", () => {
  it("renders native checkboxes when ui.variant='checkboxes'", () => {
    const onChange = vi.fn();
    renderField(makeField("checkboxes"), onChange);
    const boxes = screen.getAllByRole("checkbox");
    expect(boxes).toHaveLength(2);
    expect(boxes[0]).not.toBeChecked();
  });

  it("renders pill toggle buttons by default", () => {
    const onChange = vi.fn();
    renderField(makeField(), onChange);
    expect(screen.queryByRole("checkbox")).toBeNull();
    const buttons = screen.getAllByRole("button");
    expect(buttons.map((b) => b.textContent)).toEqual(["Apple", "Banana"]);
  });

  it("toggles via checkbox variant", () => {
    const onChange = vi.fn();
    renderField(makeField("checkboxes"), onChange);
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    expect(onChange).toHaveBeenCalledWith(["A"]);
  });
});