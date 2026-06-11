import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

const { createMutate, updateMutate } = vi.hoisted(() => ({
  createMutate: vi.fn(),
  updateMutate: vi.fn(),
}));

vi.mock("../../hooks/useCreateProviderOverride", () => ({
  useCreateProviderOverride: () => ({ mutate: createMutate, isPending: false }),
}));
vi.mock("../../hooks/useUpdateProviderOverride", () => ({
  useUpdateProviderOverride: () => ({ mutate: updateMutate, isPending: false }),
}));
vi.mock("../../lib/services.api", () => ({
  fetchServices: vi.fn(() => Promise.resolve({ data: [] })),
}));
vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (sel: (s: { organizationId: string }) => unknown) =>
    sel({ organizationId: "org-1" }),
}));

import { ProviderOverrideDrawer } from "./ProviderOverrideDrawer";

describe("ProviderOverrideDrawer", () => {
  beforeEach(() => {
    createMutate.mockReset();
    updateMutate.mockReset();
  });

  it("requires a service before submitting", async () => {
    renderWithIntl(
      <ProviderOverrideDrawer
        open
        mode="create"
        profileId="prov-1"
        onOpenChange={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /add override/i }));

    expect(await screen.findByText(/service is required/i)).toBeInTheDocument();
    expect(createMutate).not.toHaveBeenCalled();
  });
});
