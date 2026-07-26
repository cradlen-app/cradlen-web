"use client";

import { useMemo } from "react";
import { NotebookPen } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { usePatientVisitNotes } from "../../../hooks/usePatientVisitNotes";
import { VisitNoteItem } from "./VisitNoteItem";
import type { PatientVisitNote } from "../../../types/visits-notes.types";

type Props = {
  patientId: string;
};

type VisitGroup = {
  visitId: string;
  scheduledAt: string;
  status: string;
  notes: PatientVisitNote[];
};

/**
 * Rows arrive ordered by visit then time, so a single pass produces contiguous
 * groups — no sorting, and no reliance on the server grouping (which does not
 * compose with pagination).
 */
function groupByVisit(notes: PatientVisitNote[]): VisitGroup[] {
  const groups: VisitGroup[] = [];
  for (const note of notes) {
    const last = groups[groups.length - 1];
    if (last?.visitId === note.visitId) {
      last.notes.push(note);
      continue;
    }
    groups.push({
      visitId: note.visitId,
      scheduledAt: note.visitScheduledAt,
      status: note.visitStatus,
      notes: [note],
    });
  }
  return groups;
}

/**
 * Read-only history of the caller's own notes for one patient, grouped under
 * the visit each was written in. No composer and no edit/delete: authoring
 * belongs where the clinical context is, which is the visit workspace.
 *
 * Hidden below `xl` for the same layout reason as `VisitNotesRail`.
 */
export function PatientNotesRail({ patientId }: Props) {
  const t = useTranslations("visits.workspace.notes");
  const locale = useLocale();

  const { data, isLoading, isError, refetch } = usePatientVisitNotes({
    patientId,
  });

  const groups = useMemo(() => groupByVisit(data?.items ?? []), [data?.items]);

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
      new Date(iso),
    );

  return (
    <aside className="hidden h-full flex-col overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-sm xl:flex">
      <header className="flex items-center gap-2 border-b border-gray-100 p-4">
        <NotebookPen className="size-4 text-brand-primary" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-gray-700">
          {t("patientTitle")}
        </h3>
      </header>

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

      {!isLoading && !isError && groups.length === 0 && (
        <p className="p-4 text-xs italic text-gray-400">{t("patientEmpty")}</p>
      )}

      {groups.map((group) => (
        <section key={group.visitId} className="border-b border-gray-100">
          <h4 className="flex items-center gap-2 px-4 pt-4 text-[11px] font-medium uppercase tracking-wide text-gray-400">
            {t("visitOn", { date: formatDate(group.scheduledAt) })}
            {group.status === "CANCELLED" && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] normal-case tracking-normal text-gray-500">
                {t("visitCancelled")}
              </span>
            )}
          </h4>
          <ul className="divide-y divide-gray-100">
            {group.notes.map((note) => (
              <VisitNoteItem key={note.id} note={note} canMutate={false} />
            ))}
          </ul>
        </section>
      ))}
    </aside>
  );
}
