import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/render";
import { VisitNoteItem } from "./VisitNoteItem";
import type { VisitNote } from "../../../types/visits-notes.types";

const note: VisitNote = {
  id: "n-1",
  visitId: "v-1",
  content: "Fatigue x3 weeks, worse in evenings",
  addedAfterClose: false,
  createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
  updatedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
};

describe("VisitNoteItem", () => {
  it("renders the note content and a relative timestamp", () => {
    renderWithIntl(<VisitNoteItem note={note} canMutate />);

    expect(
      screen.getByText("Fatigue x3 weeks, worse in evenings"),
    ).toBeInTheDocument();
    expect(screen.getByText(/5 minutes ago/i)).toBeInTheDocument();
  });

  it("exposes the absolute time as a title for hover", () => {
    renderWithIntl(<VisitNoteItem note={note} canMutate />);

    expect(screen.getByText(/5 minutes ago/i)).toHaveAttribute("title");
  });

  it("shows the after-close badge only when the note was added after close", () => {
    const { unmount } = renderWithIntl(
      <VisitNoteItem note={note} canMutate={false} />,
    );
    expect(screen.queryByText("Added after close")).not.toBeInTheDocument();
    unmount();

    renderWithIntl(
      <VisitNoteItem note={{ ...note, addedAfterClose: true }} canMutate={false} />,
    );
    expect(screen.getByText("Added after close")).toBeInTheDocument();
  });

  it("hides edit and delete when the note cannot be mutated", () => {
    renderWithIntl(<VisitNoteItem note={note} canMutate={false} />);

    expect(
      screen.queryByRole("button", { name: "Edit note" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete note" }),
    ).not.toBeInTheDocument();
  });

  it("fires the edit and delete callbacks", async () => {
    const onStartEdit = vi.fn();
    const onDelete = vi.fn();
    renderWithIntl(
      <VisitNoteItem
        note={note}
        canMutate
        onStartEdit={onStartEdit}
        onDelete={onDelete}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Edit note" }));
    expect(onStartEdit).toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Delete note" }));
    expect(onDelete).toHaveBeenCalled();
  });

  it("saves the trimmed draft when editing", async () => {
    const onSave = vi.fn();
    renderWithIntl(
      <VisitNoteItem note={note} canMutate isEditing onSave={onSave} />,
    );

    const textarea = screen.getByRole("textbox", { name: "Edit note" });
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "  edited note  ");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledWith("edited note");
  });

  it("disables save when the draft is emptied", async () => {
    renderWithIntl(<VisitNoteItem note={note} canMutate isEditing />);

    await userEvent.clear(screen.getByRole("textbox", { name: "Edit note" }));

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});
