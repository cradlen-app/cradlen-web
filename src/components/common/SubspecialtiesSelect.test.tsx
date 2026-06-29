import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render";
import {
  SubspecialtiesSelect,
  type SubspecialtyOption,
} from "./SubspecialtiesSelect";

const options: SubspecialtyOption[] = [
  { code: "fetal", name: "Fetal Medicine" },
  { code: "onco", name: "Gyn Oncology" },
];

describe("SubspecialtiesSelect", () => {
  it("renders the placeholder and opens the option list", () => {
    renderWithIntl(
      <SubspecialtiesSelect
        options={options}
        value={[]}
        onChange={() => {}}
        placeholder="Choose sub"
      />,
    );
    expect(screen.getByText("Choose sub")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Fetal Medicine")).toBeInTheDocument();
    expect(screen.getByText("Gyn Oncology")).toBeInTheDocument();
  });

  it("toggles a value on and off", () => {
    const onChange = vi.fn();
    const { rerender } = renderWithIntl(
      <SubspecialtiesSelect options={options} value={[]} onChange={onChange} />,
    );
    fireEvent.click(screen.getAllByRole("button")[0]);
    fireEvent.click(screen.getByText("Fetal Medicine"));
    expect(onChange).toHaveBeenCalledWith(["fetal"]);

    rerender(
      <SubspecialtiesSelect
        options={options}
        value={["fetal"]}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getAllByRole("button")[0]);
    // "Fetal Medicine" now exists as chip + option; the option list one toggles off.
    fireEvent.click(screen.getByText("Gyn Oncology"));
    expect(onChange).toHaveBeenLastCalledWith(["fetal", "onco"]);
  });

  it("does not open when disabled", () => {
    renderWithIntl(
      <SubspecialtiesSelect
        options={options}
        value={[]}
        onChange={() => {}}
        disabled
      />,
    );
    const trigger = screen.getByRole("button");
    expect(trigger).toBeDisabled();
    fireEvent.click(trigger);
    expect(screen.queryByText("Fetal Medicine")).not.toBeInTheDocument();
  });

  it("shows the em-dash empty state when there are no options", () => {
    renderWithIntl(
      <SubspecialtiesSelect options={[]} value={[]} onChange={() => {}} />,
    );
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("removes a selected chip via its X button", () => {
    const onChange = vi.fn();
    renderWithIntl(
      <SubspecialtiesSelect
        options={options}
        value={["fetal"]}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove Fetal Medicine" }));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
