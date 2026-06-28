import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";

import { renderWithIntl } from "@/test/render";
import type { Visit } from "../../types/visits.types";

// Locale-aware Link → plain anchor so we can assert hrefs.
vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

// Breadcrumbs pulls its own navigation graph; stub to surface labels only.
vi.mock("@/components/ui/breadcrumbs", () => ({
  Breadcrumbs: ({ items }: { items: Array<{ label: string }> }) => (
    <nav data-testid="breadcrumbs">{items.map((i) => i.label).join(" / ")}</nav>
  ),
}));

import { VisitWorkspaceHeader } from "./VisitWorkspaceHeader";

const visit = {
  id: "v-1",
  patient: { id: "p-1", fullName: "Sara Mahmoud" },
} as unknown as Visit;

function setup(over: Partial<React.ComponentProps<typeof VisitWorkspaceHeader>> = {}) {
  const props = {
    visit,
    organizationId: "org-1",
    branchId: "br-1",
    canComplete: false,
    isMutating: false,
    onComplete: vi.fn(),
    showInvoice: false,
    onInvoice: vi.fn(),
    showAddService: false,
    onAddService: vi.fn(),
    ...over,
  };
  renderWithIntl(<VisitWorkspaceHeader {...props} />);
  return props;
}

describe("VisitWorkspaceHeader", () => {
  it("renders the back link pointing at the visits list", () => {
    setup();
    const back = screen.getByRole("link", { name: /back to visits/i });
    expect(back).toHaveAttribute(
      "href",
      "/org-1/br-1/dashboard/visits",
    );
  });

  it("renders breadcrumbs including the patient name", () => {
    setup();
    expect(screen.getByTestId("breadcrumbs")).toHaveTextContent("Sara Mahmoud");
  });

  it("hides all action buttons when every flag is off", () => {
    setup();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows and wires the add-service, invoice and complete buttons", () => {
    const props = setup({
      showAddService: true,
      showInvoice: true,
      canComplete: true,
    });
    fireEvent.click(screen.getByRole("button", { name: /add service/i }));
    fireEvent.click(screen.getByRole("button", { name: /invoice/i }));
    fireEvent.click(screen.getByRole("button", { name: /mark complete/i }));
    expect(props.onAddService).toHaveBeenCalledTimes(1);
    expect(props.onInvoice).toHaveBeenCalledTimes(1);
    expect(props.onComplete).toHaveBeenCalledTimes(1);
  });

  it("disables action buttons while mutating", () => {
    setup({ showAddService: true, canComplete: true, isMutating: true });
    expect(screen.getByRole("button", { name: /add service/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /mark complete/i })).toBeDisabled();
  });
});
