import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SelectInput } from "./SelectInput";
import { TemplateExecutionContextProvider } from "../../runtime/TemplateExecutionContext";
import * as carePathsApi from "@/features/care-paths/lib/care-paths.api";
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

describe("SelectInput case-path variant", () => {
  beforeEach(() => {
    vi.spyOn(carePathsApi, "fetchCarePaths").mockResolvedValue([
      { id: "1", code: "OBGYN_GENERAL", name: "General GYN", order: 1, description: null, specialty_id: "s1", organization_id: null, is_system: true, parent_id: null, episodes: [], history_section_codes: [] },
      { id: "2", code: "OBGYN_PREGNANCY", name: "Pregnancy", order: 2, description: null, specialty_id: "s1", organization_id: null, is_system: true, parent_id: null, episodes: [], history_section_codes: [] },
    ]);
  });

  function makeCasePathField(): FormFieldDto {
    return {
      id: "f-case-path",
      code: "case_path",
      label: "Case path",
      type: "SELECT",
      order: 0,
      required: false,
      binding: { namespace: "VISIT_ENCOUNTER", path: "case_path" },
      config: {
        ui: { variant: "case-path", specialtyCode: "OBGYN" },
        validation: {},
      },
    };
  }

  function renderCasePathField(value: string | null, onChange: (v: unknown) => void) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const field = makeCasePathField();
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

  it("renders care path buttons with aria-pressed", async () => {
    renderCasePathField("OBGYN_PREGNANCY", vi.fn());
    await waitFor(() => {
      const buttons = screen.getAllByRole("button", { pressed: false });
      expect(buttons.length).toBeGreaterThan(0);
    });
    const generalGynButton = screen.getByRole("button", { name: "General GYN" });
    expect(generalGynButton.getAttribute("aria-pressed")).toBe("false");
  });

  it("marks selected care path as aria-pressed=true", async () => {
    renderCasePathField("OBGYN_GENERAL", vi.fn());
    await waitFor(() => {
      const generalGynButton = screen.getByRole("button", { name: "General GYN" });
      expect(generalGynButton.getAttribute("aria-pressed")).toBe("true");
    });
  });

  it("calls onChange when an implemented care path button is clicked", async () => {
    const onChange = vi.fn();
    // Start on a different path so clicking General GYN (the implemented path) is
    // not a no-op (clicking the already-current path does nothing).
    renderCasePathField("OBGYN_PREGNANCY", onChange);
    await waitFor(() => {
      const generalGynButton = screen.getByRole("button", { name: "General GYN" });
      expect(generalGynButton).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "General GYN" }));
    expect(onChange).toHaveBeenCalledWith("OBGYN_GENERAL");
  });
});
