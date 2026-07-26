"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatRelativeTime } from "@/common/utils/relative-time";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VISIT_NOTE_MAX_LENGTH } from "../../../types/visits-notes.types";
import type { VisitNote } from "../../../types/visits-notes.types";

type Props = {
  note: VisitNote;
  /** False on a closed visit and on the read-only patient rail. */
  canMutate: boolean;
  isEditing?: boolean;
  isSaving?: boolean;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  onSave?: (content: string) => void;
  onDelete?: () => void;
};

/**
 * One note row, shared by both rails. Purely presentational — the container
 * owns which note is being edited so only one editor can be open at a time.
 */
export function VisitNoteItem({
  note,
  canMutate,
  isEditing = false,
  isSaving = false,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: Props) {
  const t = useTranslations("visits.workspace.notes");
  const locale = useLocale();
  const [draft, setDraft] = useState(note.content);

  const absolute = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(note.createdAt));

  if (isEditing) {
    const trimmed = draft.trim();
    return (
      <li className="p-4">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onCancelEdit?.();
          }}
          maxLength={VISIT_NOTE_MAX_LENGTH}
          rows={3}
          autoFocus
          aria-label={t("edit")}
          className="text-sm"
        />
        <div className="mt-2 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => onCancelEdit?.()}
            disabled={isSaving}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            size="xs"
            onClick={() => onSave?.(trimmed)}
            disabled={isSaving || trimmed.length === 0}
          >
            {isSaving ? t("saving") : t("save")}
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="group p-4">
      <p className="whitespace-pre-wrap text-sm text-gray-700">
        {note.content}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <time
          dateTime={note.createdAt}
          title={absolute}
          className="text-[11px] text-gray-400"
        >
          {formatRelativeTime(note.createdAt, locale)}
        </time>
        {note.addedAfterClose && (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            {t("addedAfterClose")}
          </span>
        )}
        {canMutate && (
          <span className="ms-auto flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={t("edit")}
              onClick={() => onStartEdit?.()}
            >
              <Pencil className="size-3.5" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={t("delete")}
              onClick={() => onDelete?.()}
            >
              <Trash2 className="size-3.5 text-red-500" aria-hidden="true" />
            </Button>
          </span>
        )}
      </div>
    </li>
  );
}
