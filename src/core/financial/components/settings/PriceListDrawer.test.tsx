import { fireEvent, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

const { createMutate, updateMutate } = vi.hoisted(() => ({
  createMutate: vi.fn(),
  updateMutate: vi.fn(),
}));

vi.mock("../../hooks/useCreatePriceList", () => ({
  useCreatePriceList: () => ({ mutate: createMutate, isPending: false }),
}));
vi.mock("../../hooks/useUpdatePriceList", () => ({
  useUpdatePriceList: () => ({ mutate: updateMutate, isPending: false }),
}));
vi.mock("@/features/settings/lib/settings.api", () => ({
  listBranches: vi.fn(() => Promise.resolve({ data: [] })),
}));
vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (sel: (s: { organizationId: string }) => unknown) =>
    sel({ organizationId: "org-1" }),
}));

import { PriceListDrawer } from "./PriceListDrawer";

function render(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderWithIntl(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("PriceListDrawer", () => {
  beforeEach(() => {
    createMutate.mockReset();
    updateMutate.mockReset();
  });

  it("requires a name", async () => {
    render(<PriceListDrawer open mode="create" onOpenChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /create price list/i }));

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(createMutate).not.toHaveBeenCalled();
  });

  it("creates a price list with currency + is_default defaults", async () => {
    render(<PriceListDrawer open mode="create" onOpenChange={() => {}} />);

    fireEvent.change(
      screen.getByPlaceholderText("e.g. Standard Prices 2024"),
      { target: { value: "Standard 2026" } },
    );
    fireEvent.click(screen.getByRole("button", { name: /create price list/i }));

    await waitFor(() => expect(createMutate).toHaveBeenCalled());
    expect(createMutate.mock.calls[0][0]).toMatchObject({
      name: "Standard 2026",
      currency: "EGP",
      is_default: false,
    });
  });
});
