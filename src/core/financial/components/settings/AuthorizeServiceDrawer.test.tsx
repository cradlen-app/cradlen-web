import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

const { useServicesMock, authorizeMutate } = vi.hoisted(() => ({
  useServicesMock: vi.fn(),
  authorizeMutate: vi.fn(),
}));

vi.mock("../../hooks/useServices", () => ({
  useServices: () => useServicesMock(),
}));
vi.mock("../../hooks/useAuthorizations", () => ({
  useAuthorizeServices: () => ({ mutate: authorizeMutate, isPending: false }),
}));

import { AuthorizeServiceDrawer } from "./AuthorizeServiceDrawer";

describe("AuthorizeServiceDrawer", () => {
  beforeEach(() => {
    authorizeMutate.mockReset();
    useServicesMock.mockReturnValue({
      services: [{ id: "s1", name: "Consultation", code: "CONS-1" }],
    });
  });

  it("disables submit until a service is chosen, then authorizes the selected services", () => {
    renderWithIntl(
      <AuthorizeServiceDrawer
        open
        profileId="prov-1"
        branches={[]}
        onOpenChange={() => {}}
      />,
    );

    const submit = screen.getByRole("button", { name: /authorize service/i });
    expect(submit).toBeDisabled();

    // Services now use a checkbox-dropdown MultiSelect: open it, then tick one.
    fireEvent.click(screen.getByText("Select services…"));
    fireEvent.click(screen.getByText("Consultation"));

    expect(submit).toBeEnabled();
    fireEvent.click(submit);

    expect(authorizeMutate).toHaveBeenCalledWith(
      { service_ids: ["s1"], branch_id: undefined, duration_minutes: undefined },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });
});
