import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/render";
import { VisitNotesRail } from "./VisitNotesRail";
import { useVisitNotes } from "../../../hooks/useVisitNotes";
import { useCreateVisitNote } from "../../../hooks/useCreateVisitNote";
import { useUpdateVisitNote } from "../../../hooks/useUpdateVisitNote";
import { useDeleteVisitNote } from "../../../hooks/useDeleteVisitNote";
import type { VisitNote } from "../../../types/visits-notes.types";

vi.mock("../../../hooks/useVisitNotes", () => ({ useVisitNotes: vi.fn() }));
vi.mock("../../../hooks/useCreateVisitNote", () => ({
  useCreateVisitNote: vi.fn(),
}));
vi.mock("../../../hooks/useUpdateVisitNote", () => ({
  useUpdateVisitNote: vi.fn(),
}));
vi.mock("../../../hooks/useDeleteVisitNote", () => ({
  useDeleteVisitNote: vi.fn(),
}));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const createMutate = vi.fn();

function makeNote(overrides: Partial<VisitNote> = {}): VisitNote {
  return {
    id: "n-1",
    visitId: "v-1",
    content: "Fatigue x3 weeks",
    addedAfterClose: false,
    createdAt: new Date(Date.now() - 60_000).toISOString(),
    updatedAt: new Date(Date.now() - 60_000).toISOString(),
    ...overrides,
  };
}

function mockQuery(
  state: Partial<{
    data: VisitNote[];
    isLoading: boolean;
    isError: boolean;
  }> = {},
) {
  vi.mocked(useVisitNotes).mockReturnValue({
    data: state.data ?? [],
    isLoading: state.isLoading ?? false,
    isError: state.isError ?? false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useVisitNotes>);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockQuery();
  vi.mocked(useCreateVisitNote).mockReturnValue({
    mutate: createMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useCreateVisitNote>);
  vi.mocked(useUpdateVisitNote).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateVisitNote>);
  vi.mocked(useDeleteVisitNote).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteVisitNote>);
});

function render(props: Partial<React.ComponentProps<typeof VisitNotesRail>> = {}) {
  return renderWithIntl(
    <VisitNotesRail
      visitId="v-1"
      canWrite
      isVisitClosed={false}
      {...props}
    />,
  );
}

describe("VisitNotesRail", () => {
  it("renders the empty state when there are no notes", () => {
    render();
    expect(screen.getByText("No notes yet.")).toBeInTheDocument();
  });

  it("renders the error state with a retry action", () => {
    mockQuery({ isError: true });
    render();

    expect(screen.getByText("Failed to load notes.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("renders the notes it is given, newest first as returned", () => {
    mockQuery({
      data: [
        makeNote({ id: "n-2", content: "Second" }),
        makeNote({ id: "n-1", content: "First" }),
      ],
    });
    render();

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Second");
    expect(items[1]).toHaveTextContent("First");
  });

  it("submits the trimmed content", async () => {
    render();

    await userEvent.type(
      screen.getByRole("textbox", { name: "Add note" }),
      "  Recheck CBC  ",
    );
    await userEvent.click(screen.getByRole("button", { name: "Add note" }));

    expect(createMutate).toHaveBeenCalledWith("Recheck CBC");
  });

  it("keeps submit disabled for whitespace-only content", async () => {
    render();

    await userEvent.type(screen.getByRole("textbox", { name: "Add note" }), "   ");

    expect(screen.getByRole("button", { name: "Add note" })).toBeDisabled();
    expect(createMutate).not.toHaveBeenCalled();
  });

  it("shows the character counter only as the cap approaches", async () => {
    render();
    const textarea = screen.getByRole("textbox", { name: "Add note" });

    await userEvent.type(textarea, "short");
    expect(screen.queryByText(/\/2000/)).not.toBeInTheDocument();

    // Typing 1600 chars through userEvent is slow; set it directly.
    await userEvent.clear(textarea);
    await userEvent.paste("x".repeat(1700));
    expect(screen.getByText("1700/2000")).toBeInTheDocument();
  });

  it("hides the composer when the caller cannot write", () => {
    render({ canWrite: false });

    expect(
      screen.queryByRole("textbox", { name: "Add note" }),
    ).not.toBeInTheDocument();
  });

  // Append-only: existing notes freeze, but adding stays possible.
  it("on a closed visit keeps the composer but drops edit/delete", () => {
    mockQuery({ data: [makeNote()] });
    render({ isVisitClosed: true });

    expect(screen.getByRole("textbox", { name: "Add note" })).toBeInTheDocument();
    expect(
      screen.getByText(/This visit is closed\./i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit note" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete note" }),
    ).not.toBeInTheDocument();
  });
});
