import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";

import { renderWithIntl } from "@/test/render";
import { PatientNotesRail } from "./PatientNotesRail";
import { usePatientVisitNotes } from "../../../hooks/usePatientVisitNotes";
import type { PatientVisitNote } from "../../../types/visits-notes.types";

vi.mock("../../../hooks/usePatientVisitNotes", () => ({
  usePatientVisitNotes: vi.fn(),
}));

function makeNote(
  overrides: Partial<PatientVisitNote> = {},
): PatientVisitNote {
  return {
    id: "n-1",
    visitId: "v-1",
    content: "A note",
    addedAfterClose: false,
    createdAt: "2026-06-12T10:00:00.000Z",
    updatedAt: "2026-06-12T10:00:00.000Z",
    visitScheduledAt: "2026-06-12T09:00:00.000Z",
    visitStatus: "COMPLETED",
    ...overrides,
  };
}

function mockQuery(
  state: Partial<{
    items: PatientVisitNote[];
    isLoading: boolean;
    isError: boolean;
  }> = {},
) {
  vi.mocked(usePatientVisitNotes).mockReturnValue({
    data: { items: state.items ?? [], total: state.items?.length ?? 0 },
    isLoading: state.isLoading ?? false,
    isError: state.isError ?? false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof usePatientVisitNotes>);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockQuery();
});

describe("PatientNotesRail", () => {
  it("renders the patient-specific empty state", () => {
    renderWithIntl(<PatientNotesRail patientId="p-1" />);

    expect(
      screen.getByText("You haven't written any notes for this patient."),
    ).toBeInTheDocument();
  });

  it("renders the error state with a retry action", () => {
    mockQuery({ isError: true });
    renderWithIntl(<PatientNotesRail patientId="p-1" />);

    expect(screen.getByText("Failed to load notes.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("groups notes under one heading per visit, in the order received", () => {
    mockQuery({
      items: [
        makeNote({ id: "a", visitId: "v-2", content: "newer-1", visitScheduledAt: "2026-06-12T09:00:00.000Z" }),
        makeNote({ id: "b", visitId: "v-2", content: "newer-2", visitScheduledAt: "2026-06-12T09:00:00.000Z" }),
        makeNote({ id: "c", visitId: "v-1", content: "older-1", visitScheduledAt: "2026-03-14T09:00:00.000Z" }),
      ],
    });
    renderWithIntl(<PatientNotesRail patientId="p-1" />);

    const headings = screen.getAllByRole("heading", { level: 4 });
    expect(headings).toHaveLength(2);
    expect(headings[0]).toHaveTextContent("Visit on Jun 12, 2026");
    expect(headings[1]).toHaveTextContent("Visit on Mar 14, 2026");
  });

  it("keeps notes from the same visit contiguous under their group", () => {
    mockQuery({
      items: [
        makeNote({ id: "a", visitId: "v-2", content: "newer-1" }),
        makeNote({ id: "b", visitId: "v-2", content: "newer-2" }),
        makeNote({
          id: "c",
          visitId: "v-1",
          content: "older-1",
          visitScheduledAt: "2026-03-14T09:00:00.000Z",
        }),
      ],
    });
    const { container } = renderWithIntl(<PatientNotesRail patientId="p-1" />);

    const sections = container.querySelectorAll("section");
    expect(within(sections[0] as HTMLElement).getAllByRole("listitem")).toHaveLength(2);
    expect(within(sections[1] as HTMLElement).getAllByRole("listitem")).toHaveLength(1);
  });

  it("marks a cancelled visit's group", () => {
    mockQuery({ items: [makeNote({ visitStatus: "CANCELLED" })] });
    renderWithIntl(<PatientNotesRail patientId="p-1" />);

    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });

  // Authoring belongs in the visit workspace, where the clinical context is.
  it("is strictly read-only — no composer, no edit, no delete", () => {
    mockQuery({ items: [makeNote()] });
    renderWithIntl(<PatientNotesRail patientId="p-1" />);

    expect(
      screen.queryByRole("textbox", { name: "Add note" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit note" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete note" }),
    ).not.toBeInTheDocument();
  });
});
