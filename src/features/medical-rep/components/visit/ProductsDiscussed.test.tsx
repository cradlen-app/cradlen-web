import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import { ProductsDiscussed, type SelectedMedication } from "./ProductsDiscussed";

const { searchFnMock, createMutateMock } = vi.hoisted(() => ({
  searchFnMock: vi.fn(),
  createMutateMock: vi.fn(),
}));

vi.mock("@/builder/fields/entity.registry", () => ({
  getEntitySearchFn: () => searchFnMock,
}));

vi.mock("@/features/medications/hooks/useManageMedications", () => ({
  useCreateMedication: () => ({ mutateAsync: createMutateMock, isPending: false }),
}));

vi.mock("@/features/medications/components/MedicationDrawer", () => ({
  MedicationDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="medication-drawer" /> : null,
}));

describe("ProductsDiscussed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchFnMock.mockResolvedValue([]);
  });

  it("renders selected medications as chips with strength", () => {
    const value: SelectedMedication[] = [
      { id: "m1", name: "Aspirin", strength: "100mg" },
      { id: "m2", name: "Ibuprofen" },
    ];

    renderWithIntl(<ProductsDiscussed value={value} onChange={vi.fn()} />);

    expect(screen.getByText("Aspirin (100mg)")).toBeInTheDocument();
    expect(screen.getByText("Ibuprofen")).toBeInTheDocument();
  });

  it("shows the empty copy when nothing is selected", () => {
    renderWithIntl(<ProductsDiscussed value={[]} onChange={vi.fn()} />);

    expect(screen.getByText("No products selected")).toBeInTheDocument();
  });

  it("removes a chip when its remove button is clicked", () => {
    const onChange = vi.fn();
    const value: SelectedMedication[] = [
      { id: "m1", name: "Aspirin" },
      { id: "m2", name: "Ibuprofen" },
    ];

    renderWithIntl(<ProductsDiscussed value={value} onChange={onChange} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);

    expect(onChange).toHaveBeenCalledWith([{ id: "m2", name: "Ibuprofen" }]);
  });

  it("offers an add-new option for an unmatched query", () => {
    renderWithIntl(<ProductsDiscussed value={[]} onChange={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("Search or add a medicine…"), {
      target: { value: "Novadrug" },
    });

    expect(screen.getByText('Add "Novadrug"')).toBeInTheDocument();
  });

  it("opens the medicine creation drawer from the add-new option", () => {
    renderWithIntl(<ProductsDiscussed value={[]} onChange={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("Search or add a medicine…"), {
      target: { value: "Novadrug" },
    });
    fireEvent.mouseDown(screen.getByText('Add "Novadrug"'));

    expect(screen.getByTestId("medication-drawer")).toBeInTheDocument();
  });

  it("hides the search box and remove buttons when disabled", () => {
    renderWithIntl(
      <ProductsDiscussed
        value={[{ id: "m1", name: "Aspirin" }]}
        onChange={vi.fn()}
        disabled
      />,
    );

    expect(
      screen.queryByPlaceholderText("Search or add a medicine…"),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });
});
