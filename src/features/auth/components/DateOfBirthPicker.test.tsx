import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Dialog } from "radix-ui";
import { DateOfBirthPicker } from "./DateOfBirthPicker";

/**
 * Mounts the picker inside a modal Radix Dialog — the exact scenario that broke
 * in the settings edit-profile drawer (popover portaled out of the dialog's
 * focus scope, and dropdowns lacking an id/name).
 */
function renderInDialog(value = "", onChange = vi.fn()) {
  render(
    <Dialog.Root open>
      <Dialog.Portal>
        <Dialog.Content>
          <DateOfBirthPicker
            id="dob"
            label="Date of birth"
            placeholder="Select your date of birth"
            value={value}
            onChange={onChange}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>,
  );
  return { onChange };
}

describe("DateOfBirthPicker inside a modal Dialog", () => {
  it("opens the calendar and renders month/year dropdowns with a name attribute", () => {
    renderInDialog();

    fireEvent.click(screen.getByText("Select your date of birth"));

    // Calendar renders (react-day-picker exposes a grid).
    expect(screen.getByRole("grid")).toBeInTheDocument();

    // The caption dropdowns must carry a name/id so React 19 doesn't warn
    // ("a form field element should have an id or name attribute").
    const selects = document.querySelectorAll("select");
    expect(selects.length).toBeGreaterThan(0);
    selects.forEach((select) => {
      expect(select.getAttribute("name")).toBeTruthy();
      expect(select.getAttribute("id")).toBeTruthy();
    });
  });

  it("prefills the display when the value is a full ISO datetime", () => {
    // Backend date fields arrive as "1999-09-01T00:00:00.000Z"; the trigger must
    // still render the date (not the placeholder) despite the trailing time part.
    renderInDialog("1999-09-01T00:00:00.000Z");

    expect(screen.getByText("1 Sep 1999")).toBeInTheDocument();
    expect(
      screen.queryByText("Select your date of birth"),
    ).not.toBeInTheDocument();
  });

  it("emits an ISO date string when a day is picked", () => {
    const { onChange } = renderInDialog("1990-05-20");

    fireEvent.click(screen.getByText("20 May 1990"));

    const grid = screen.getByRole("grid");
    const dayButton = within(grid)
      .getAllByRole("button")
      .find((b) => !b.hasAttribute("disabled"));
    expect(dayButton).toBeDefined();
    fireEvent.click(dayButton!);

    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
  });
});
