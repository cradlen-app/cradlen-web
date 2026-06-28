import { screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import { CreatableSelect } from "./CreatableSelect";

const OPTIONS = ["Tablet", "Capsule", "Syrup"];

function setup(value = "", onChange = vi.fn()) {
  renderWithIntl(
    <CreatableSelect
      value={value}
      onChange={onChange}
      options={OPTIONS}
      placeholder="Pick one"
      addOptionLabel={(v) => `Add "${v}"`}
    />,
  );
  return { onChange };
}

describe("CreatableSelect", () => {
  it("shows the placeholder when no value is selected", () => {
    setup("");
    expect(screen.getByText("Pick one")).toBeInTheDocument();
  });

  it("shows the current value on the trigger", () => {
    setup("Capsule");
    expect(screen.getByText("Capsule")).toBeInTheDocument();
  });

  it("opens the popover and lists all options", () => {
    setup("");
    fireEvent.click(screen.getByRole("button"));
    for (const opt of OPTIONS) {
      expect(screen.getByText(opt)).toBeInTheDocument();
    }
  });

  it("filters options by the search query", () => {
    setup("");
    fireEvent.click(screen.getByRole("button"));
    fireEvent.change(screen.getByPlaceholderText("Search…"), {
      target: { value: "cap" },
    });
    expect(screen.getByText("Capsule")).toBeInTheDocument();
    expect(screen.queryByText("Tablet")).not.toBeInTheDocument();
  });

  it("selects an existing option and reports it via onChange", () => {
    const { onChange } = setup("");
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Syrup"));
    expect(onChange).toHaveBeenCalledWith("Syrup");
  });

  it("offers a create-custom entry for an unknown query and selects it", () => {
    const { onChange } = setup("");
    fireEvent.click(screen.getByRole("button"));
    fireEvent.change(screen.getByPlaceholderText("Search…"), {
      target: { value: "Lozenge" },
    });
    const custom = screen.getByText('Add "Lozenge"');
    fireEvent.click(custom);
    expect(onChange).toHaveBeenCalledWith("Lozenge");
  });

  it("does not offer a create entry when the query exactly matches an option", () => {
    setup("");
    fireEvent.click(screen.getByRole("button"));
    fireEvent.change(screen.getByPlaceholderText("Search…"), {
      target: { value: "tablet" },
    });
    expect(screen.queryByText(/^Add "/)).not.toBeInTheDocument();
  });

  it("shows a no-results message when a whitespace query matches nothing and offers no custom add", () => {
    setup("");
    fireEvent.click(screen.getByRole("button"));
    // A whitespace-only query trims to empty (no custom add) yet matches no
    // option literally → the empty "No results" branch renders.
    fireEvent.change(screen.getByPlaceholderText("Search…"), {
      target: { value: "   " },
    });
    expect(screen.getByText("No results")).toBeInTheDocument();
    expect(screen.queryByText(/^Add "/)).not.toBeInTheDocument();
  });
});
