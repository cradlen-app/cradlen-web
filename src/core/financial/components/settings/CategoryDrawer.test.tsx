import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

const { createMutate, updateMutate } = vi.hoisted(() => ({
  createMutate: vi.fn(),
  updateMutate: vi.fn(),
}));

vi.mock("../../hooks/useCategories", () => ({
  useCreateCategory: () => ({ mutate: createMutate, isPending: false }),
  useUpdateCategory: () => ({ mutate: updateMutate, isPending: false }),
}));

import { CategoryDrawer } from "./CategoryDrawer";

describe("CategoryDrawer", () => {
  beforeEach(() => {
    createMutate.mockReset();
    updateMutate.mockReset();
  });

  it("requires a name", async () => {
    renderWithIntl(
      <CategoryDrawer open mode="create" onOpenChange={() => {}} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /create category/i }));

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(createMutate).not.toHaveBeenCalled();
  });

  it("creates a category with an auto-generated code", async () => {
    renderWithIntl(
      <CategoryDrawer open mode="create" onOpenChange={() => {}} />,
    );

    fireEvent.change(screen.getByPlaceholderText("Category name"), {
      target: { value: "Laboratory" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create category/i }));

    await waitFor(() => expect(createMutate).toHaveBeenCalled());
    const payload = createMutate.mock.calls[0][0];
    expect(payload).toMatchObject({ name: "Laboratory" });
    expect(payload.code).toMatch(/^LABORATORY-[A-Z0-9]{4}$/);
  });
});
