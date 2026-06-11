import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

const { createMutate, updateMutate } = vi.hoisted(() => ({
  createMutate: vi.fn(),
  updateMutate: vi.fn(),
}));

vi.mock("../../hooks/useCreateService", () => ({
  useCreateService: () => ({ mutate: createMutate, isPending: false }),
}));
vi.mock("../../hooks/useUpdateService", () => ({
  useUpdateService: () => ({ mutate: updateMutate, isPending: false }),
}));
vi.mock("../../hooks/useCategories", () => ({
  useCategories: () => ({ categories: [] }),
}));
vi.mock("@/features/settings/hooks/useOrgSpecialties", () => ({
  useOrgSpecialties: () => ({ data: [] }),
}));
vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (sel: (s: { organizationId: string }) => unknown) =>
    sel({ organizationId: "org-1" }),
}));
vi.mock("./OrgSpecialtiesSelect", () => ({ OrgSpecialtiesSelect: () => null }));

import { ServiceDrawer } from "./ServiceDrawer";

describe("ServiceDrawer", () => {
  beforeEach(() => {
    createMutate.mockReset();
    updateMutate.mockReset();
  });

  it("blocks submit and shows an error when the name is empty", async () => {
    renderWithIntl(
      <ServiceDrawer open mode="create" onOpenChange={() => {}} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /create service/i }));

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(createMutate).not.toHaveBeenCalled();
  });

  it("creates a service with an auto-generated code and the form fields", async () => {
    renderWithIntl(
      <ServiceDrawer open mode="create" onOpenChange={() => {}} />,
    );

    fireEvent.change(screen.getByPlaceholderText("Service name"), {
      target: { value: "Blood Test" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create service/i }));

    await waitFor(() => expect(createMutate).toHaveBeenCalled());
    const payload = createMutate.mock.calls[0][0];
    expect(payload).toMatchObject({
      name: "Blood Test",
      service_type: "CONSULTATION",
    });
    expect(payload.code).toMatch(/^BLOOD-TEST-[A-Z0-9]{4}$/);
  });

  it("prefills and shows a read-only code in edit mode", () => {
    renderWithIntl(
      <ServiceDrawer
        open
        mode="edit"
        onOpenChange={() => {}}
        service={{
          id: "svc-1",
          organization_id: "org-1",
          code: "CONSULT-AB12",
          name: "Consultation",
          description: null,
          service_type: "CONSULTATION",
          is_active: true,
          specialty_ids: [],
          category_id: null,
          category: null,
          created_at: "2026-06-01T00:00:00.000Z",
          updated_at: "2026-06-01T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByDisplayValue("CONSULT-AB12")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Service name")).toHaveValue(
      "Consultation",
    );
  });
});
