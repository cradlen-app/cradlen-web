import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

import { InvoicePanelButton } from "./InvoicePanelButton";

describe("InvoicePanelButton", () => {
  it("hides the badge and uses the plain aria label when no visits are pending", () => {
    renderWithIntl(<InvoicePanelButton onClick={() => {}} pendingCount={0} />);
    const button = screen.getByRole("button", { name: "Open billing panel" });
    expect(button).toBeInTheDocument();
    // No numeric badge rendered.
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("shows the pending count badge and a count-aware aria label", () => {
    renderWithIntl(<InvoicePanelButton onClick={() => {}} pendingCount={3} />);
    expect(
      screen.getByRole("button", {
        name: "Open billing panel — 3 visits pending",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("caps the badge at 99+", () => {
    renderWithIntl(<InvoicePanelButton onClick={() => {}} pendingCount={150} />);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("fires onClick when pressed", () => {
    const onClick = vi.fn();
    renderWithIntl(<InvoicePanelButton onClick={onClick} pendingCount={1} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
