"use client";

import { useState } from "react";
import { NotebookPen } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { isEncounterLocked } from "@/common/errors/encounter-errors";
import { queryKeys } from "@/lib/queryKeys";
import { useVisitNotes } from "../../../hooks/useVisitNotes";
import { useCreateVisitNote } from "../../../hooks/useCreateVisitNote";
import { useUpdateVisitNote } from "../../../hooks/useUpdateVisitNote";
import { useDeleteVisitNote } from "../../../hooks/useDeleteVisitNote";
import { VisitNoteComposer } from "./VisitNoteComposer";
import { VisitNoteItem } from "./VisitNoteItem";
import { DeleteVisitNoteDialog } from "./DeleteVisitNoteDialog";

type Props = {
  visitId: string;
  /** Computed at the page from `isClinical(profile)`. */
  canWrite: boolean;
  /** COMPLETED or CANCELLED — existing notes freeze, new ones stay allowed. */
  isVisitClosed: boolean;
};

/**
 * The doctor's author-private notes for this visit: read, add, edit, delete.
 *
 * Hidden below `xl`. Both workspace pages nest this grid inside an
 * `overflow-hidden` flex column, so under `grid-cols-1` the Tabs' `h-full`
 * resolves against an auto row, collapses, and clips the panel — which is why
 * the column was authored as `xl:` originally. A small-screen presentation is a
 * follow-up, not a regression.
 */
export function VisitNotesRail({ visitId, canWrite, isVisitClosed }: Props) {
  const t = useTranslations("visits.workspace.notes");
  const queryClient = useQueryClient();

  const { data: notes, isLoading, isError, refetch } = useVisitNotes(visitId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  // Remounting the composer clears it — done on success, not on submit, so the
  // text stays visible until the refetch lands (no optimistic updates here).
  const [composerKey, setComposerKey] = useState(0);

  /**
   * The visit was closed in another tab between render and submit. Refresh the
   * visit so the header and this rail re-render frozen, and drop out of edit.
   */
  function handleMutationError(error: unknown, fallbackKey: string) {
    if (isEncounterLocked(error)) {
      toast.error(t("lockedError"));
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.byId(visitId) });
      setEditingId(null);
      setPendingDeleteId(null);
      return;
    }
    toast.error(t(fallbackKey));
  }

  const createNote = useCreateVisitNote(visitId, {
    onSuccess: () => setComposerKey((k) => k + 1),
    onError: (error) => handleMutationError(error, "addError"),
  });

  const updateNote = useUpdateVisitNote(visitId, {
    onSuccess: () => setEditingId(null),
    onError: (error) => handleMutationError(error, "updateError"),
  });

  const deleteNote = useDeleteVisitNote(visitId, {
    onSuccess: () => setPendingDeleteId(null),
    onError: (error) => handleMutationError(error, "deleteError"),
  });

  // Existing notes freeze once the visit closes; adding stays possible.
  const canMutateExisting = canWrite && !isVisitClosed;

  return (
    <aside className="hidden h-full flex-col overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-sm xl:flex">
      <header className="flex items-center gap-2 border-b border-gray-100 p-4">
        <NotebookPen className="size-4 text-brand-primary" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-gray-700">{t("title")}</h3>
      </header>

      {canWrite && (
        <div className="border-b border-gray-100">
          {isVisitClosed && (
            <p className="px-4 pt-4 text-[11px] text-gray-400">
              {t("closedHint")}
            </p>
          )}
          <VisitNoteComposer
            key={composerKey}
            isPending={createNote.isPending}
            onSubmit={(content) => createNote.mutate(content)}
          />
        </div>
      )}

      {isLoading && (
        <div className="space-y-2 p-4">
          <div className="h-12 animate-pulse rounded-xl bg-gray-50" />
          <div className="h-12 animate-pulse rounded-xl bg-gray-50" />
          <div className="h-12 animate-pulse rounded-xl bg-gray-50" />
        </div>
      )}

      {isError && (
        <div className="p-4">
          <p className="rounded-xl border border-red-100 bg-red-50/50 px-4 py-3 text-xs text-red-600">
            {t("loadError")}
          </p>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="mt-2"
            onClick={() => refetch()}
          >
            {t("retry")}
          </Button>
        </div>
      )}

      {!isLoading && !isError && notes?.length === 0 && (
        <p className="p-4 text-xs italic text-gray-400">{t("empty")}</p>
      )}

      {!!notes?.length && (
        <ul className="divide-y divide-gray-100">
          {notes.map((note) => (
            <VisitNoteItem
              key={note.id}
              note={note}
              canMutate={canMutateExisting}
              isEditing={editingId === note.id}
              isSaving={updateNote.isPending && editingId === note.id}
              onStartEdit={() => setEditingId(note.id)}
              onCancelEdit={() => setEditingId(null)}
              onSave={(content) =>
                updateNote.mutate({ noteId: note.id, content })
              }
              onDelete={() => setPendingDeleteId(note.id)}
            />
          ))}
        </ul>
      )}

      <DeleteVisitNoteDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        isPending={deleteNote.isPending}
        onConfirm={() => {
          if (pendingDeleteId) deleteNote.mutate(pendingDeleteId);
        }}
      />
    </aside>
  );
}
