import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render";
import { MultiSelect, type MultiSelectOption } from "./MultiSelect";

const options: MultiSelectOption[] = [
  { value: "a", label: "Apple" },
  { value: "b", label: "Banana" },
  { value: "c", label: "Cherry" },
];

describe("MultiSelect", () => {
  it("shows the placeholder when nothing is selected and toggles the list open", () => {
    renderWithIntl(
      <MultiSelect
        options={options}
        value={[]}
        onChange={() => {}}
        placeholder="Pick fruit"
      />,
    );

    expect(screen.getByText("Pick fruit")).toBeInTheDocument();
    // Options not rendered until opened.
    expect(screen.queryByText("Apple")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Banana")).toBeInTheDocument();
  });

  it("adds a value when an unchecked option is clicked", () => {
    const onChange = vi.fn();
    renderWithIntl(
      <MultiSelect options={options} value={["a"]} onChange={onChange} />,
    );

    // open via the main trigger (first button)
    fireEvent.click(screen.getAllByRole("button")[0]);
    fireEvent.click(screen.getByText("Banana"));

    expect(onChange).toHaveBeenCalledWith(["a", "b"]);
  });

  it("removes a value when a checked option is clicked again", () => {
    const onChange = vi.fn();
    renderWithIntl(
      <MultiSelect options={options} value={["a", "b"]} onChange={onChange} />,
    );

    fireEvent.click(screen.getAllByRole("button")[0]);
    // Target the option button (exact name "Apple"), not the chip/trigger.
    fireEvent.click(screen.getByRole("button", { name: "Apple" }));

    expect(onChange).toHaveBeenCalledWith(["b"]);
  });

  it("renders selected values as chips and removes via the chip X", () => {
    const onChange = vi.fn();
    renderWithIntl(
      <MultiSelect options={options} value={["a", "c"]} onChange={onChange} />,
    );

    // Chip labels are visible without opening.
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Cherry")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove Apple" }));
    expect(onChange).toHaveBeenCalledWith(["c"]);
  });

  it("falls back to the raw value when no matching label exists", () => {
    renderWithIntl(
      <MultiSelect options={options} value={["zzz"]} onChange={() => {}} />,
    );
    expect(screen.getByText("zzz")).toBeInTheDocument();
  });

  it("shows the empty text when there are no options", () => {
    renderWithIntl(
      <MultiSelect
        options={[]}
        value={[]}
        onChange={() => {}}
        emptyText="Nothing here"
      />,
    );
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("closes when clicking outside", () => {
    renderWithIntl(
      <div>
        <MultiSelect options={options} value={[]} onChange={() => {}} />
        <span data-testid="outside">outside</span>
      </div>,
    );
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.getByText("Apple")).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByText("Apple")).not.toBeInTheDocument();
  });
});
