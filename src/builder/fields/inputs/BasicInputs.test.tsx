import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TextInput } from "./TextInput";
import { TextareaInput } from "./TextareaInput";
import { BooleanInput } from "./BooleanInput";
import { NumberInput, DecimalInput } from "./NumberInput";
import { ComputedInput } from "./ComputedInput";
import { DateInput, DateTimeInput } from "./DateInput";
import { TemplateExecutionContextProvider } from "../../runtime/TemplateExecutionContext";
import type {
  FormFieldDto,
  FormTemplateDto,
} from "../../templates/template.types";

function makeField(partial: Partial<FormFieldDto> & { code: string }): FormFieldDto {
  return {
    id: `f-${partial.code}`,
    label: partial.label ?? partial.code,
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
    sections: [
      { id: "s", code: "sec", name: "S", order: 0, config: {}, fields: [field] },
    ],
  };
}

function renderInContext(
  field: FormFieldDto,
  node: React.ReactNode,
  initialFormValues: Record<string, unknown> = {},
) {
  return render(
    <TemplateExecutionContextProvider
      template={templateFor(field)}
      initialFormValues={initialFormValues}
    >
      {node}
    </TemplateExecutionContextProvider>,
  );
}

describe("TextInput", () => {
  it("renders the current string value and fires onChange on edit", () => {
    const onChange = vi.fn();
    const field = makeField({ code: "name", label: "Name" });
    render(
      <TextInput
        field={field}
        value="Mona"
        onChange={onChange}
        required={false}
        disabled={false}
      />,
    );
    const input = screen.getByDisplayValue("Mona") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Mira" } });
    expect(onChange).toHaveBeenCalledWith("Mira");
  });

  it("coerces a non-string value to an empty string and applies validation attrs", () => {
    const field = makeField({
      code: "name",
      label: "Name",
      required: true,
      config: {
        ui: { placeholder: "Type here" },
        validation: { maxLength: 10, minLength: 2, pattern: "[a-z]+" },
      },
    });
    const { container } = render(
      <TextInput
        field={field}
        value={42}
        onChange={vi.fn()}
        required
        disabled={false}
      />,
    );
    const input = container.querySelector("input")!;
    expect(input.value).toBe("");
    expect(input).toHaveAttribute("placeholder", "Type here");
    expect(input).toHaveAttribute("maxlength", "10");
    expect(input).toHaveAttribute("minlength", "2");
    expect(input).toHaveAttribute("pattern", "[a-z]+");
    // required marker
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("shows the field error", () => {
    const field = makeField({ code: "name", label: "Name" });
    render(
      <TextInput
        field={field}
        value=""
        onChange={vi.fn()}
        required={false}
        disabled={false}
        error="Required field"
      />,
    );
    expect(screen.getByText("Required field")).toBeInTheDocument();
  });
});

describe("TextareaInput", () => {
  it("renders value and fires onChange", () => {
    const onChange = vi.fn();
    const field = makeField({ code: "notes", label: "Notes", type: "TEXTAREA" });
    const { container } = render(
      <TextareaInput
        field={field}
        value="hello"
        onChange={onChange}
        required={false}
        disabled={false}
      />,
    );
    const ta = container.querySelector("textarea")!;
    expect(ta.value).toBe("hello");
    fireEvent.change(ta, { target: { value: "world" } });
    expect(onChange).toHaveBeenCalledWith("world");
  });

  it("renders an empty textarea for a non-string value", () => {
    const field = makeField({ code: "notes", label: "Notes", type: "TEXTAREA" });
    const { container } = render(
      <TextareaInput
        field={field}
        value={null}
        onChange={vi.fn()}
        required={false}
        disabled={false}
      />,
    );
    expect(container.querySelector("textarea")!.value).toBe("");
  });
});

describe("BooleanInput", () => {
  it("reflects checked state and emits boolean on toggle", () => {
    const onChange = vi.fn();
    const field = makeField({ code: "consent", label: "Consent", type: "BOOLEAN" });
    render(
      <BooleanInput
        field={field}
        value={false}
        onChange={onChange}
        required={false}
        disabled={false}
      />,
    );
    const box = screen.getByRole("checkbox") as HTMLInputElement;
    expect(box.checked).toBe(false);
    fireEvent.click(box);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("renders inline (no extra label spacer) for a full-width boolean", () => {
    const field = makeField({ code: "consent", label: "Consent", type: "BOOLEAN" });
    const { container } = render(
      <BooleanInput
        field={field}
        value
        onChange={vi.fn()}
        required={false}
        disabled={false}
      />,
    );
    // full-width returns the bare <label> control as the root node
    expect((container.firstChild as HTMLElement).tagName).toBe("LABEL");
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(true);
  });

  it("wraps with a label spacer and renders a flag dot when colSpan < 12 and flagged", () => {
    const field = makeField({
      code: "consent",
      label: "Consent",
      type: "BOOLEAN",
      config: { ui: { colSpan: 6 } },
    });
    const { container } = render(
      <BooleanInput
        field={field}
        value={false}
        onChange={vi.fn()}
        required
        disabled={false}
        flagged
      />,
    );
    expect((container.firstChild as HTMLElement).tagName).toBe("DIV");
    expect(container.querySelector('[title="Flagged"]')).toBeInTheDocument();
  });
});

describe("NumberInput / DecimalInput", () => {
  it("parses numeric input and emits a number", () => {
    const onChange = vi.fn();
    const field = makeField({ code: "weight", label: "Weight", type: "NUMBER" });
    const { container } = render(
      <NumberInput
        field={field}
        value={5}
        onChange={onChange}
        required={false}
        disabled={false}
      />,
    );
    const input = container.querySelector("input")!;
    expect(input.value).toBe("5");
    fireEvent.change(input, { target: { value: "12" } });
    expect(onChange).toHaveBeenCalledWith(12);
  });

  it("emits null when cleared", () => {
    const onChange = vi.fn();
    const field = makeField({ code: "weight", label: "Weight", type: "NUMBER" });
    const { container } = render(
      <NumberInput
        field={field}
        value={5}
        onChange={onChange}
        required={false}
        disabled={false}
      />,
    );
    fireEvent.change(container.querySelector("input")!, { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("renders an empty input for null/undefined and applies min/max/step", () => {
    const field = makeField({
      code: "temp",
      label: "Temp",
      type: "NUMBER",
      config: { ui: { step: 0.1, suffix: "°C" }, validation: { min: 30, max: 45 } },
    });
    const { container } = render(
      <NumberInput
        field={field}
        value={null}
        onChange={vi.fn()}
        required={false}
        disabled={false}
      />,
    );
    const input = container.querySelector("input")!;
    expect(input.value).toBe("");
    expect(input).toHaveAttribute("min", "30");
    expect(input).toHaveAttribute("max", "45");
    // field-level ui.step wins over the factory default
    expect(input).toHaveAttribute("step", "0.1");
    expect(screen.getByText("°C")).toBeInTheDocument();
  });

  it("DecimalInput defaults its step to 0.1", () => {
    const field = makeField({ code: "dose", label: "Dose", type: "DECIMAL" });
    const { container } = render(
      <DecimalInput
        field={field}
        value={null}
        onChange={vi.fn()}
        required={false}
        disabled={false}
      />,
    );
    expect(container.querySelector("input")).toHaveAttribute("step", "0.1");
  });
});

describe("ComputedInput", () => {
  it("computes BMI from derived inputs and displays the rounded value", () => {
    const field = makeField({
      code: "bmi",
      label: "BMI",
      type: "COMPUTED",
      config: {
        ui: { derivedFrom: ["weight_kg", "height_cm"], suffix: "kg/m²" },
        logic: { formula: "weight_kg / ((height_cm / 100) ^ 2)" },
      },
    });
    const { container } = renderInContext(
      field,
      <ComputedInput
        field={field}
        value={undefined}
        onChange={vi.fn()}
        required={false}
        disabled={false}
      />,
      { weight_kg: 70, height_cm: 175 },
    );
    // 70 / 1.75^2 = 22.857… → 22.9
    expect(container.querySelector("input")!.value).toBe("22.9");
    expect(screen.getByText("kg/m²")).toBeInTheDocument();
  });

  it("shows an em-dash placeholder when the formula cannot be evaluated", () => {
    const field = makeField({
      code: "bmi",
      label: "BMI",
      type: "COMPUTED",
      config: {
        ui: { derivedFrom: ["weight_kg", "height_cm"] },
        logic: { formula: "weight_kg / ((height_cm / 100) ^ 2)" },
      },
    });
    const { container } = renderInContext(
      field,
      <ComputedInput
        field={field}
        value={undefined}
        onChange={vi.fn()}
        required={false}
        disabled={false}
      />,
      {},
    );
    const input = container.querySelector("input")!;
    expect(input.value).toBe("—");
    expect(input).toHaveAttribute("readonly");
  });
});

describe("DateInput", () => {
  it("normalizes an ISO datetime to a yyyy-MM-dd value", () => {
    const field = makeField({ code: "dob", label: "DOB", type: "DATE" });
    const { container } = renderInContext(
      field,
      <DateInput
        field={field}
        value="1999-12-17T00:00:00.000Z"
        onChange={vi.fn()}
        required={false}
        disabled={false}
      />,
    );
    const input = container.querySelector('input[type="date"]') as HTMLInputElement;
    expect(input.value).toBe("1999-12-17");
  });

  it("emits the raw date value on change", () => {
    const onChange = vi.fn();
    const field = makeField({ code: "dob", label: "DOB", type: "DATE" });
    const { container } = renderInContext(
      field,
      <DateInput
        field={field}
        value=""
        onChange={onChange}
        required={false}
        disabled={false}
      />,
    );
    const input = container.querySelector('input[type="date"]')!;
    fireEvent.change(input, { target: { value: "2026-01-02" } });
    expect(onChange).toHaveBeenCalledWith("2026-01-02");
  });

  it("caps the picker at today via notInFuture and floors via maxAgeYears", () => {
    const field = makeField({
      code: "dob",
      label: "DOB",
      type: "DATE",
      config: { validation: { notInFuture: true, maxAgeYears: 120 } },
    });
    const { container } = renderInContext(
      field,
      <DateInput
        field={field}
        value=""
        onChange={vi.fn()}
        required={false}
        disabled={false}
      />,
    );
    const input = container.querySelector('input[type="date"]') as HTMLInputElement;
    expect(input.getAttribute("max")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(input.getAttribute("min")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // min (today − 120y) precedes max (today)
    expect(input.getAttribute("min")! < input.getAttribute("max")!).toBe(true);
  });
});

describe("DateTimeInput", () => {
  it("renders a datetime-local input and emits its value", () => {
    const onChange = vi.fn();
    const field = makeField({ code: "at", label: "At", type: "DATETIME" });
    const { container } = renderInContext(
      field,
      <DateTimeInput
        field={field}
        value="2026-01-02T08:30"
        onChange={onChange}
        required={false}
        disabled={false}
      />,
    );
    const input = container.querySelector(
      'input[type="datetime-local"]',
    ) as HTMLInputElement;
    expect(input.value).toBe("2026-01-02T08:30");
    fireEvent.change(input, { target: { value: "2026-01-03T09:00" } });
    expect(onChange).toHaveBeenCalledWith("2026-01-03T09:00");
  });

  it("renders empty for a non-string value", () => {
    const field = makeField({ code: "at", label: "At", type: "DATETIME" });
    const { container } = renderInContext(
      field,
      <DateTimeInput
        field={field}
        value={null}
        onChange={vi.fn()}
        required={false}
        disabled={false}
      />,
    );
    expect(
      (container.querySelector('input[type="datetime-local"]') as HTMLInputElement)
        .value,
    ).toBe("");
  });
});
