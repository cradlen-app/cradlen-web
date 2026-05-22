import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FieldShell } from "./field-shell";

describe("FieldShell", () => {
  it("renders label above children by default (stacked)", () => {
    const { container } = render(
      <FieldShell label="Onset">
        <input />
      </FieldShell>
    );
    // default wrapper is a <label> with class "block"
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.tagName).toBe("LABEL");
    expect(wrapper.className).toContain("block");
  });

  it("renders label and children on the same row when inline=true", () => {
    const { container } = render(
      <FieldShell label="Complaint category" inline>
        <input />
      </FieldShell>
    );
    // inline wrapper is a <div> (not a label) with flex classes
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.tagName).toBe("DIV");
    expect(wrapper.className).toContain("flex");
    expect(wrapper.className).toContain("flex-row");
  });

  it("shows label text in both modes", () => {
    const { rerender } = render(
      <FieldShell label="My Field">
        <input />
      </FieldShell>
    );
    expect(screen.getByText("My Field")).toBeInTheDocument();

    rerender(
      <FieldShell label="My Field" inline>
        <input />
      </FieldShell>
    );
    expect(screen.getByText("My Field")).toBeInTheDocument();
  });

  it("shows error text in inline mode", () => {
    render(
      <FieldShell label="Complaint category" inline error="Required">
        <input />
      </FieldShell>
    );
    expect(screen.getByText("Required")).toBeInTheDocument();
  });
});