import { screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import type { Medication } from "../types/medications.types";

const {
  useMedicationsMock,
  useMedicationFacetsMock,
  useCreateMock,
  useUpdateMock,
  useDeleteMock,
} = vi.hoisted(() => ({
  useMedicationsMock: vi.fn(),
  useMedicationFacetsMock: vi.fn(),
  useCreateMock: vi.fn(),
  useUpdateMock: vi.fn(),
  useDeleteMock: vi.fn(),
}));

vi.mock("../hooks/useMedications", () => ({
  useMedications: (...a: unknown[]) => useMedicationsMock(...a),
}));
vi.mock("../hooks/useMedicationFacets", () => ({
  useMedicationFacets: () => useMedicationFacetsMock(),
}));
vi.mock("../hooks/useManageMedications", () => ({
  useCreateMedication: () => useCreateMock(),
  useUpdateMedication: () => useUpdateMock(),
  useDeleteMedication: () => useDeleteMock(),
}));

vi.mock("./MedicationsTable", () => ({
  MedicationsTable: ({
    medications,
    isLoading,
  }: {
    medications: Medication[];
    isLoading: boolean;
  }) => (
    <div data-testid="table">
      {isLoading ? "loading" : `${medications.length} rows`}
    </div>
  ),
}));
vi.mock("./MedicationDrawer", () => ({
  MedicationDrawer: ({ open }: { open: boolean }) => (
    <div data-testid="drawer">{open ? "open" : "closed"}</div>
  ),
}));
vi.mock("./DeleteMedicationDialog", () => ({
  DeleteMedicationDialog: ({ medication }: { medication: Medication | null }) => (
    <div data-testid="delete-dialog">{medication ? medication.name : "none"}</div>
  ),
}));

import { MedicationsPage } from "./MedicationsPage";

function makeMed(id: string): Medication {
  return {
    id,
    code: `M-${id}`,
    name: `Med ${id}`,
  } as Medication;
}

function setMedications({
  rows = [makeMed("1"), makeMed("2")],
  total = 2,
  isLoading = false,
}: { rows?: Medication[]; total?: number; isLoading?: boolean } = {}) {
  useMedicationsMock.mockReturnValue({
    data: { data: rows, meta: { total } },
    isLoading,
  });
}

describe("MedicationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMedications();
    useMedicationFacetsMock.mockReturnValue({
      data: { categories: ["Antibiotic"], forms: ["Tablet"] },
    });
    useCreateMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    useUpdateMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    useDeleteMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  });

  it("renders the header and the table with the paged rows", () => {
    renderWithIntl(<MedicationsPage />);
    expect(
      screen.getByRole("heading", { name: "Medicines" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("table")).toHaveTextContent("2 rows");
  });

  it("passes a loading state through to the table", () => {
    setMedications({ rows: [], total: 0, isLoading: true });
    renderWithIntl(<MedicationsPage />);
    expect(screen.getByTestId("table")).toHaveTextContent("loading");
  });

  it("requeries with the typed search term and resets to page 1", () => {
    renderWithIntl(<MedicationsPage />);
    const input = screen.getByPlaceholderText("Search by name, code…");
    fireEvent.change(input, { target: { value: "amox" } });
    const lastCall = useMedicationsMock.mock.calls.at(-1)?.[0] as {
      search: string;
      page: number;
    };
    expect(lastCall.search).toBe("amox");
    expect(lastCall.page).toBe(1);
  });

  it("hides pagination when there is a single page", () => {
    setMedications({ rows: [makeMed("1")], total: 1 });
    renderWithIntl(<MedicationsPage />);
    expect(
      screen.queryByRole("button", { name: "Next page" }),
    ).not.toBeInTheDocument();
  });

  it("advances the page and refetches when Next is clicked", () => {
    setMedications({
      rows: Array.from({ length: 10 }, (_, i) => makeMed(String(i))),
      total: 25,
    });
    renderWithIntl(<MedicationsPage />);
    const next = screen.getByRole("button", { name: "Next page" });
    const prev = screen.getByRole("button", { name: "Previous page" });
    expect(prev).toBeDisabled();
    fireEvent.click(next);
    const lastCall = useMedicationsMock.mock.calls.at(-1)?.[0] as { page: number };
    expect(lastCall.page).toBe(2);
  });

  it("opens the add drawer when the add button is clicked", () => {
    renderWithIntl(<MedicationsPage />);
    expect(screen.getByTestId("drawer")).toHaveTextContent("closed");
    fireEvent.click(screen.getByRole("button", { name: /New Medicine/i }));
    expect(screen.getByTestId("drawer")).toHaveTextContent("open");
  });
});
