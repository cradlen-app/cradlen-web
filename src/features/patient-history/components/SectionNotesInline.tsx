"use client";

import { useRef, useState } from "react";
import { ChevronDown, ChevronRight, NotebookPen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import type { NoteVisibility } from "../api/notes.api";
import {
  useCreateSectionNote,
  useDeleteSectionNote,
  useSectionNotes,
  useUpdateSectionNote,
} from "../api/useSectionNotes";

interface Props {
  patientId: string;
  sectionCode: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function NoteRow({
  id,
  content,
  createdAt,
  visibility,
  onDelete,
  onToggleVisibility,
}: {
  id: string;
  content: string;
  createdAt: string;
  visibility: NoteVisibility;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string, current: NoteVisibility) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const t = useTranslations("patient_history.workspace.notes");
  const isShared = visibility === "SHARED_GLOBAL";

  return (
    <div className="flex items-start gap-2 border-b border-gray-100 py-2 last:border-b-0">
      <span className="w-10 shrink-0 text-[11px] text-gray-400">
        {formatDate(createdAt)}
      </span>
      <p
        className={cn(
          "flex-1 text-xs text-brand-black",
          !expanded && "line-clamp-1",
        )}
      >
        {content}
      </p>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onToggleVisibility(id, visibility)}
          title={isShared ? t("visibility.shared") : t("visibility.private")}
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-medium transition-colors",
            isShared
              ? "bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200",
          )}
        >
          {isShared ? t("visibility.shared") : t("visibility.private")}
        </button>
        <button
          type="button"
          onClick={() => onDelete(id)}
          className="text-gray-300 transition-colors hover:text-red-400"
        >
          <Trash2 size={12} />
        </button>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-gray-400 transition-colors hover:text-gray-600"
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>
    </div>
  );
}

export function SectionNotesInline({ patientId, sectionCode }: Props) {
  const t = useTranslations("patient_history.workspace.notes");
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftVisibility, setDraftVisibility] = useState<NoteVisibility>("PRIVATE_TO_ORG");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data } = useSectionNotes(patientId, sectionCode, true);
  const createMut = useCreateSectionNote(patientId, sectionCode);
  const updateMut = useUpdateSectionNote(patientId, sectionCode);
  const deleteMut = useDeleteSectionNote(patientId, sectionCode);

  const notes = data?.visible ?? [];

  async function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    try {
      await createMut.mutateAsync({ content: trimmed, visibility: draftVisibility });
      setDraft("");
      setDraftVisibility("PRIVATE_TO_ORG");
      setComposing(false);
      toast.success(t("savedToast"));
    } catch {
      toast.error(t("errorToast"));
    }
  }

  async function handleDelete(noteId: string) {
    try {
      await deleteMut.mutateAsync({ noteId });
      toast.success(t("deletedToast"));
    } catch {
      toast.error(t("errorToast"));
    }
  }

  async function handleToggleVisibility(noteId: string, current: NoteVisibility) {
    const next: NoteVisibility =
      current === "PRIVATE_TO_ORG" ? "SHARED_GLOBAL" : "PRIVATE_TO_ORG";
    try {
      await updateMut.mutateAsync({ noteId, visibility: next });
    } catch {
      toast.error(t("errorToast"));
    }
  }

  function openCompose() {
    setComposing(true);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-gray-100">
      {notes.length > 0 && (
        <div className="px-3 pt-2">
          {notes.map((note) => (
            <NoteRow
              key={note.id}
              id={note.id}
              content={note.content}
              createdAt={note.created_at}
              visibility={note.visibility}
              onDelete={handleDelete}
              onToggleVisibility={handleToggleVisibility}
            />
          ))}
        </div>
      )}

      {composing ? (
        <div className="px-3 pb-3 pt-2">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("placeholder")}
            rows={3}
            className="w-full resize-none rounded border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-brand-primary"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex overflow-hidden rounded border border-gray-200 text-[10px]">
              <button
                type="button"
                onClick={() => setDraftVisibility("PRIVATE_TO_ORG")}
                className={cn(
                  "px-2 py-1",
                  draftVisibility === "PRIVATE_TO_ORG"
                    ? "bg-gray-100 font-medium text-brand-black"
                    : "text-gray-500",
                )}
              >
                {t("visibility.private")}
              </button>
              <button
                type="button"
                onClick={() => setDraftVisibility("SHARED_GLOBAL")}
                className={cn(
                  "px-2 py-1",
                  draftVisibility === "SHARED_GLOBAL"
                    ? "bg-brand-primary text-white"
                    : "text-gray-500",
                )}
              >
                {t("visibility.shared")}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setComposing(false); setDraft(""); setDraftVisibility("PRIVATE_TO_ORG"); }}
                className="text-[11px] text-gray-400 hover:text-gray-600"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!draft.trim() || createMut.isPending}
                className="rounded bg-brand-primary px-3 py-1 text-[11px] font-medium text-white disabled:opacity-50"
              >
                {t("save")}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openCompose}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
        >
          <NotebookPen size={13} />
          <span>{t("addNote")}</span>
        </button>
      )}
    </div>
  );
}
