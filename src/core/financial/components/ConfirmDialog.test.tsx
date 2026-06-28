import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

import { ConfirmDialog } from "./ConfirmDialog";

function setup(overrides: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  const onConfirm = vi.fn();
  const onOpenChange = vi.fn();
  renderWithIntl(
    <ConfirmDialog
      open
      onOpenChange={onOpenChange}
      title="Remove item?"
      description="This cannot be undone."
      confirmLabel="Remove"
      onConfirm={onConfirm}
      {...overrides}
    />,
  );
  return { onConfirm, onOpenChange };
}

describe("ConfirmDialog", () => {
  it("renders the title, description and confirm label", () => {
    setup();
    expect(screen.getByText("Remove item?")).toBeInTheDocument();
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("invokes onConfirm when the action button is clicked", () => {
    const { onConfirm } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("disables both buttons and shows a spinner while pending", () => {
    setup({ isPending: true });
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    // The confirm label is swapped for a spinner, so it is no longer found by name.
    expect(
      screen.queryByRole("button", { name: "Remove" }),
    ).not.toBeInTheDocument();
  });

  it("does not render when closed", () => {
    renderWithIntl(
      <ConfirmDialog
        open={false}
        onOpenChange={() => {}}
        title="Hidden"
        description="Hidden body"
        confirmLabel="Go"
        onConfirm={() => {}}
      />,
    );
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });
});
