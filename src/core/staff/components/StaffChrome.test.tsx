import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import type { StaffFilter } from "../types/staff.types";

vi.mock("@/hooks/useDashboardPath", () => ({
  useDashboardPath: () => (path: string) => `/org-1/branch-1/dashboard${path}`,
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={typeof href === "string" ? href : "#"}>{children}</a>
  ),
}));

import { StaffToolbar } from "./StaffToolbar";
import { StaffHeader } from "./StaffHeader";

describe("StaffToolbar", () => {
  it("renders desktop filter tabs and reflects the active filter", async () => {
    const onFilterChange = vi.fn();
    renderWithIntl(
      <StaffToolbar
        activeFilter="all"
        search=""
        onFilterChange={onFilterChange}
        onSearchChange={vi.fn()}
      />,
    );
    const allTab = screen.getAllByRole("tab", { name: "All Staff" })[0];
    expect(allTab).toHaveAttribute("aria-selected", "true");

    await userEvent.click(screen.getAllByRole("tab", { name: "Owner" })[0]);
    expect(onFilterChange).toHaveBeenCalledWith("OWNER" as StaffFilter);
  });

  it("forwards search input changes", async () => {
    const onSearchChange = vi.fn();
    renderWithIntl(
      <StaffToolbar
        activeFilter="all"
        search=""
        onFilterChange={vi.fn()}
        onSearchChange={onSearchChange}
      />,
    );
    await userEvent.type(screen.getByRole("searchbox"), "a");
    expect(onSearchChange).toHaveBeenCalledWith("a");
  });
});

describe("StaffHeader", () => {
  it("hides management actions when canManage is false", () => {
    renderWithIntl(<StaffHeader canManage={false} />);
    expect(screen.getByText("Staff")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /New Staff/ }),
    ).not.toBeInTheDocument();
  });

  it("shows the invitations link and the create dropdown when canManage", async () => {
    const onInviteStaff = vi.fn();
    const onCreateDirectStaff = vi.fn();
    renderWithIntl(
      <StaffHeader
        canManage
        onInviteStaff={onInviteStaff}
        onCreateDirectStaff={onCreateDirectStaff}
      />,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "/org-1/branch-1/dashboard/staff/invitations",
    );
    expect(
      screen.getByRole("button", { name: /New Staff/ }),
    ).toBeInTheDocument();
  });
});
