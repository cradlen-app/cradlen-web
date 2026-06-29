import { beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SelectInput } from "./SelectInput";
import { TemplateExecutionContextProvider } from "../../runtime/TemplateExecutionContext";
import type {
  FieldOption,
  FormFieldDto,
  FormTemplateDto,
} from "../../templates/template.types";

// No optionsSource is used here → useDynamicOptions stays disabled and never
// fires a query, but it still reads the auth store, so provide a stub.
vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (
    selector: (s: { organizationId: string | null; branchId: string | null }) => unknown,
  ) => selector({ organizationId: "org-1", branchId: "branch-1" }),
}));

beforeAll(() => {
  // jsdom has no layout engine; the dropdown calls scrollIntoView on the active row.
  Element.prototype.scrollIntoView = vi.fn();
});

const OPTIONS: FieldOption[] = [
  { code: "A", label: "Apple" },
  { code: "B", label: "Banana" },
  { code: "C", label: "Cherry" },
];

function makeField(
  overrides: Partial<FormFieldDto> = {},
  options: FieldOption[] = OPTIONS,
): FormFieldDto {
  return {
    id: "f1",
    code: "fruit",
    label: "Fruit",
    type: "SELECT",
    order: 0,
    required: false,
    binding: { namespace: "VISIT", path: "fruit" },
    config: { ui: {}, validation: { options } },
    ...overrides,
  } as FormFieldDto;
}

function templateFor(field: FormFieldDto): FormTemplateDto {
  return {
    id: "tpl",
    code: "tpl",
    name: "T",
    description: null,
    scope: "ENCOUNTER",
    version: 1,
    activated_at: null,
    specialty_id: null,
    sections: [
      { id: "s", code: "sec", name: "S", order: 0, config: {}, fields: [field] },
    ],
  };
}

function renderSelect(
  field: FormFieldDto,
  value: unknown,
  onChange: (v: unknown) => void,
  required = false,
) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const utils = render(
    <QueryClientProvider client={qc}>
      <TemplateExecutionContextProvider template={templateFor(field)}>
        <SelectInput
          field={field}
          value={value}
          onChange={onChange}
          required={required}
          disabled={false}
        />
      </TemplateExecutionContextProvider>
    </QueryClientProvider>,
  );
  // The FieldShell wraps everything in a <label>, which pollutes accessible
  // names, so target the trigger by its ARIA hook instead.
  const trigger = () =>
    utils.container.querySelector(
      'button[aria-haspopup="listbox"]',
    ) as HTMLButtonElement;
  return { ...utils, trigger };
}

describe("SelectInput (dropdown variant)", () => {
  it("shows the placeholder when nothing is selected and opens the listbox", () => {
    const field = makeField({
      config: { ui: { placeholder: "Pick one" }, validation: { options: OPTIONS } },
    });
    const { trigger } = renderSelect(field, "", vi.fn());
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveTextContent("Pick one");
    fireEvent.click(trigger());
    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeInTheDocument();
    expect(within(listbox).getByText("Apple")).toBeInTheDocument();
  });

  it("renders the selected option's label", () => {
    const { trigger } = renderSelect(makeField(), "B", vi.fn());
    expect(trigger()).toHaveTextContent("Banana");
  });

  it("commits the picked option and closes the menu", () => {
    const onChange = vi.fn();
    const { trigger } = renderSelect(makeField(), "", onChange);
    fireEvent.click(trigger());
    const listbox = screen.getByRole("listbox");
    fireEvent.mouseDown(within(listbox).getByText("Cherry"));
    expect(onChange).toHaveBeenCalledWith("C");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("offers a clear (placeholder) row when optional and commits null", () => {
    const onChange = vi.fn();
    const field = makeField({
      config: { ui: { placeholder: "—" }, validation: { options: OPTIONS } },
    });
    const { trigger } = renderSelect(field, "A", onChange, false);
    fireEvent.click(trigger());
    const listbox = screen.getByRole("listbox");
    // The first button inside the listbox is the clear/placeholder entry.
    const clearRow = listbox.querySelector("button")!;
    expect(clearRow.getAttribute("role")).not.toBe("option");
    fireEvent.mouseDown(clearRow);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("does not render a clear row when the field is required", () => {
    const field = makeField({ required: true });
    const { trigger } = renderSelect(field, "A", vi.fn(), true);
    fireEvent.click(trigger());
    const listbox = screen.getByRole("listbox");
    const buttons = Array.from(listbox.querySelectorAll("button"));
    expect(buttons.every((b) => b.getAttribute("role") === "option")).toBe(true);
  });

  it("navigates with the keyboard and selects with Enter", () => {
    const onChange = vi.fn();
    const { trigger } = renderSelect(makeField(), "", onChange);
    const el = trigger();
    fireEvent.keyDown(el, { key: "ArrowDown" }); // opens, activeIndex → 0 (Apple)
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.keyDown(el, { key: "ArrowDown" }); // → Banana
    fireEvent.keyDown(el, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("B");
  });

  it("closes on Escape", () => {
    const { trigger } = renderSelect(makeField(), "", vi.fn());
    fireEvent.keyDown(trigger(), { key: "ArrowDown" });
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.keyDown(trigger(), { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("shows a 'No options' note when there are none", () => {
    const field = makeField({ config: { ui: {}, validation: { options: [] } } }, []);
    const { trigger } = renderSelect(field, "", vi.fn());
    fireEvent.click(trigger());
    expect(screen.getByText("No options")).toBeInTheDocument();
  });

  it("renders the segmented variant as a radiogroup and emits the picked code", () => {
    const onChange = vi.fn();
    const field = makeField({
      config: { ui: { variant: "segmented" }, validation: { options: OPTIONS } },
    });
    renderSelect(field, "A", onChange);
    const group = screen.getByRole("radiogroup", { name: "Fruit" });
    const radios = within(group).getAllByRole("radio");
    expect(radios).toHaveLength(3);
    expect(radios[0]).toHaveAttribute("aria-checked", "true");
    fireEvent.click(within(group).getByText("Banana"));
    expect(onChange).toHaveBeenCalledWith("B");
  });

  it("segmented: clicking the selected option clears it when optional", () => {
    const onChange = vi.fn();
    const field = makeField({
      config: { ui: { variant: "segmented" }, validation: { options: OPTIONS } },
    });
    renderSelect(field, "A", onChange, false);
    const group = screen.getByRole("radiogroup", { name: "Fruit" });
    fireEvent.click(within(group).getByText("Apple"));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
