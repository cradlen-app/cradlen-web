import { screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import { PatientsToolbar } from "./PatientsToolbar";

describe("PatientsToolbar", () => {
  it("renders the filter tabs with translated labels", () => {
    renderWithIntl(
      <PatientsToolbar
        activeFilter="all"
        search=""
        onFilterChange={vi.fn()}
        onSearchChange={vi.fn()}
      />,
    );
    // Desktop pill group exposes role=tab buttons; "All" + the three statuses.
    expect(screen.getAllByRole("tab", { name: "All" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("tab", { name: "Active" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Completed" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Cancelled" })).toBeInTheDocument();
  });

  it("marks the active filter via aria-selected", () => {
    renderWithIntl(
      <PatientsToolbar
        activeFilter="ACTIVE"
        search=""
        onFilterChange={vi.fn()}
        onSearchChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("tab", { name: "Active" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("reports a filter change when a tab is clicked", () => {
    const onFilterChange = vi.fn();
    renderWithIntl(
      <PatientsToolbar
        activeFilter="all"
        search=""
        onFilterChange={onFilterChange}
        onSearchChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Completed" }));
    expect(onFilterChange).toHaveBeenCalledWith("COMPLETED");
  });

  it("reports search input changes", () => {
    const onSearchChange = vi.fn();
    renderWithIntl(
      <PatientsToolbar
        activeFilter="all"
        search=""
        onFilterChange={vi.fn()}
        onSearchChange={onSearchChange}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText("Search patients..."), {
      target: { value: "jane" },
    });
    expect(onSearchChange).toHaveBeenCalledWith("jane");
  });

  it("hides the scope toggle when scope is undefined", () => {
    renderWithIntl(
      <PatientsToolbar
        activeFilter="all"
        search=""
        onFilterChange={vi.fn()}
        onSearchChange={vi.fn()}
      />,
    );
    expect(screen.queryByRole("tab", { name: "This branch" })).not.toBeInTheDocument();
  });

  it("renders and toggles the OWNER scope control when provided", () => {
    const onScopeChange = vi.fn();
    renderWithIntl(
      <PatientsToolbar
        activeFilter="all"
        search=""
        onFilterChange={vi.fn()}
        onSearchChange={vi.fn()}
        scope="branch"
        onScopeChange={onScopeChange}
      />,
    );
    const orgTab = screen.getByRole("tab", { name: "All patients" });
    expect(screen.getByRole("tab", { name: "This branch" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    fireEvent.click(orgTab);
    expect(onScopeChange).toHaveBeenCalledWith("org");
  });
});
