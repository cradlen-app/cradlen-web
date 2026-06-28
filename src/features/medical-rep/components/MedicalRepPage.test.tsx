import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import type { MedicalRep } from "../types/medical-rep.types";

const { useMedicalRepsMock, useCurrentUserMock, pushMock } = vi.hoisted(() => ({
  useMedicalRepsMock: vi.fn(),
  useCurrentUserMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock("../hooks/useMedicalReps", () => ({
  useMedicalReps: (params: unknown) => useMedicalRepsMock(params),
}));

vi.mock("@/features/auth/hooks/useCurrentUser", () => ({
  useCurrentUser: () => useCurrentUserMock(),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (selector: (s: unknown) => unknown) =>
    selector({ organizationId: "org-1", branchId: "branch-1" }),
}));

import { MedicalRepPage } from "./MedicalRepPage";

function makeRep(over: Partial<MedicalRep> = {}): MedicalRep {
  return {
    id: "r1",
    full_name: "Sara Adel",
    company_name: "Pharma Co",
    national_id: null,
    phone_number: "0100",
    specialty_focus: null,
    products: [],
    last_visit_date: null,
    visits_count: 1,
    ...over,
  };
}

function mockReps(reps: MedicalRep[], total: number) {
  useMedicalRepsMock.mockReturnValue({
    data: { data: reps, meta: { page: 1, limit: 10, total, hasMore: false } },
    isLoading: false,
  });
}

describe("MedicalRepPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCurrentUserMock.mockReturnValue({ data: undefined });
  });

  it("renders the title and search box", () => {
    mockReps([makeRep()], 1);

    renderWithIntl(<MedicalRepPage />);

    expect(screen.getByRole("heading", { name: "Medical Rep" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search ....")).toBeInTheDocument();
  });

  it("renders reps through the table", () => {
    mockReps([makeRep({ full_name: "Sara Adel" })], 1);

    renderWithIntl(<MedicalRepPage />);

    expect(screen.getByText("Sara Adel")).toBeInTheDocument();
  });

  it("shows the result summary", () => {
    mockReps([makeRep()], 1);

    renderWithIntl(<MedicalRepPage />);

    expect(screen.getByText(/of 1 results/)).toBeInTheDocument();
  });

  it("renders pagination controls when there is more than one page", () => {
    mockReps(
      Array.from({ length: 10 }, (_, i) => makeRep({ id: `r${i}` })),
      25,
    );

    renderWithIntl(<MedicalRepPage />);

    expect(screen.getByLabelText("Next page")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
  });

  it("updates the search input value on change", () => {
    mockReps([makeRep()], 1);

    renderWithIntl(<MedicalRepPage />);
    const input = screen.getByPlaceholderText("Search ....");
    fireEvent.change(input, { target: { value: "pharma" } });

    expect(input).toHaveValue("pharma");
  });
});
