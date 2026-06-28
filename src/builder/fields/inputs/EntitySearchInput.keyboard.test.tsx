import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EntitySearchInput } from "./EntitySearchInput";
import { TemplateExecutionContextProvider } from "../../runtime/TemplateExecutionContext";
import type { EntityResult } from "../entity.registry";
import type { FormFieldDto, FormTemplateDto } from "../../templates/template.types";

const searchFn = vi.fn<(query: string) => Promise<EntityResult[]>>();

// Override the entity lookup so typing yields a deterministic suggestion set
// without hitting the network.
vi.mock("../entity.registry", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../entity.registry")>();
  return { ...actual, getEntitySearchFn: () => searchFn };
});

function makeTemplate(): FormTemplateDto {
  const entityField: FormFieldDto = {
    id: "f1",
    code: "patient_name",
    label: "Patient",
    type: "ENTITY_SEARCH",
    order: 0,
    required: false,
    binding: { namespace: "VISIT", path: "patient_name" },
    config: {
      ui: { searchEntity: { kind: "patient", idTarget: "patient_id" } },
    },
  };
  const idField: FormFieldDto = {
    id: "f2",
    code: "patient_id",
    label: "Patient id",
    type: "TEXT",
    order: 1,
    required: false,
    binding: { namespace: "VISIT", path: "patient_id" },
    config: {},
  };
  return {
    id: "t",
    code: "test",
    name: "Test",
    description: null,
    scope: "BOOK_VISIT",
    version: 1,
    activated_at: null,
    specialty_id: null,
    sections: [
      { id: "s", code: "sec", name: "Sec", order: 0, config: {}, fields: [entityField, idField] },
    ],
  };
}

function renderInput() {
  const template = makeTemplate();
  const field = template.sections[0].fields[0];
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TemplateExecutionContextProvider template={template}>
        <EntitySearchInput
          field={field}
          value=""
          onChange={vi.fn()}
          required={false}
          disabled={false}
        />
      </TemplateExecutionContextProvider>
    </QueryClientProvider>,
  );
}

describe("EntitySearchInput — keyboard a11y", () => {
  beforeEach(() => {
    // jsdom doesn't implement scrollIntoView, which the active-option effect calls.
    Element.prototype.scrollIntoView = vi.fn();
    searchFn.mockReset();
    searchFn.mockResolvedValue([
      { id: "p1", label: "John Doe", subtitle: "MRN 1" },
      { id: "p2", label: "Jane Roe", subtitle: "MRN 2" },
    ]);
  });

  it("exposes combobox roles and reflects expanded state", async () => {
    renderInput();
    const input = screen.getByRole("combobox");
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(input).toHaveAttribute("aria-autocomplete", "list");

    fireEvent.change(input, { target: { value: "jo" } });

    const options = await screen.findAllByRole("option");
    expect(options).toHaveLength(2);
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(input).toHaveAttribute("aria-controls", screen.getByRole("listbox").id);
  });

  it("navigates with arrows and selects with Enter", async () => {
    renderInput();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "jo" } });
    const options = await screen.findAllByRole("option");

    // No option highlighted until the first ArrowDown.
    expect(input).not.toHaveAttribute("aria-activedescendant");

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(options[0]).toHaveAttribute("aria-selected", "true");
    expect(input).toHaveAttribute("aria-activedescendant", options[0].id);

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(options[1]).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(input, { key: "Enter" });
    expect(input).toHaveValue("Jane Roe");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("closes the listbox on Escape", async () => {
    renderInput();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "jo" } });
    await screen.findAllByRole("option");

    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
