import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SelectInput } from "./SelectInput";
import { TemplateExecutionContextProvider } from "../../runtime/TemplateExecutionContext";
import type { FormFieldDto, FormTemplateDto } from "../../templates/template.types";

function makeField(): FormFieldDto {
  return {
    id: "f-case-path",
    code: "case_path",
    label: "Case path",
    type: "SELECT",
    order: 0,
    required: false,
    binding: { namespace: "VISIT_ENCOUNTER", path: "case_path" },
    config: {
      ui: { variant: "segmented" },
      validation: {
        options: [
          { code: "GENERAL_GYN", label: "General GYN" },
          { code: "PREGNANCY", label: "Pregnancy" },
          { code: "SURGERY", label: "Surgery" },
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
    scope: "ENCOUNTER",
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

function renderField(value: string | null, onChange: (v: unknown) => void) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const field = makeField();
  return render(
    <QueryClientProvider client={qc}>
      <TemplateExecutionContextProvider template={makeTemplate(field)}>
        <SelectInput
          field={field}
          value={value}
          onChange={onChange}
          required={false}
          disabled={false}
        />
      </TemplateExecutionContextProvider>
    </QueryClientProvider>,
  );
}

describe("SelectInput segmented variant", () => {
  it("renders one radio per option", () => {
    renderField(null, vi.fn());
    const buttons = screen.getAllByRole("radio");
    expect(buttons).toHaveLength(3);
    expect(buttons.map((b) => b.textContent)).toEqual([
      "General GYN",
      "Pregnancy",
      "Surgery",
    ]);
  });

  it("marks the selected option as aria-checked", () => {
    renderField("PREGNANCY", vi.fn());
    const pregnancy = screen.getByRole("radio", { name: "Pregnancy" });
    expect(pregnancy.getAttribute("aria-checked")).toBe("true");
    const surgery = screen.getByRole("radio", { name: "Surgery" });
    expect(surgery.getAttribute("aria-checked")).toBe("false");
  });

  it("invokes onChange with the option code when clicked", () => {
    const onChange = vi.fn();
    renderField(null, onChange);
    fireEvent.click(screen.getByRole("radio", { name: "Surgery" }));
    expect(onChange).toHaveBeenCalledWith("SURGERY");
  });
});
