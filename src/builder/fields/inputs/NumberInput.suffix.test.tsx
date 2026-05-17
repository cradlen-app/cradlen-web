import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NumberInput } from "./NumberInput";
import type { FormFieldDto } from "../../templates/template.types";

function makeField(extra: Partial<FormFieldDto["config"]> = {}): FormFieldDto {
  return {
    id: "f-bp",
    code: "systolic_bp",
    label: "BP (systolic)",
    type: "NUMBER",
    order: 0,
    required: false,
    binding: { namespace: "VISIT_VITALS", path: "systolic_bp" },
    config: { ui: {}, validation: {}, ...extra },
  };
}

describe("NumberInput suffix", () => {
  it("renders the suffix glyph when ui.suffix is set", () => {
    const field = makeField({ ui: { suffix: "mmHg" } });
    render(
      <NumberInput
        field={field}
        value={120}
        onChange={vi.fn()}
        required={false}
        disabled={false}
      />,
    );
    expect(screen.getByText("mmHg")).toBeTruthy();
  });

  it("omits the suffix when ui.suffix is not set", () => {
    const field = makeField();
    render(
      <NumberInput
        field={field}
        value={null}
        onChange={vi.fn()}
        required={false}
        disabled={false}
      />,
    );
    expect(screen.queryByText("mmHg")).toBeNull();
  });

  it("still emits numeric values via onChange", () => {
    const onChange = vi.fn();
    render(
      <NumberInput
        field={makeField({ ui: { suffix: "mmHg" } })}
        value={null}
        onChange={onChange}
        required={false}
        disabled={false}
      />,
    );
    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "140" } });
    expect(onChange).toHaveBeenLastCalledWith(140);
  });
});
