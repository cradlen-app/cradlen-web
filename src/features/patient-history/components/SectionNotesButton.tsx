"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { MessageSquareText, Trash2, X } from "lucide-react";
import { cn } from "@/common/utils/utils";
import {
  useCreateSectionNote,
  useDeleteSectionNote,
  useSectionNotes,
  useUpdateSectionNote,
} from "../api/useSectionNotes";
import type { NoteVisibility } from "../api/notes.api";

interface Props {
  patientId: string;
  sectionCode: string;
  groupName: string;
}

export function SectionNotesButton({ patientId, sectionCode, groupName }: Props) {
  const t = useTranslations("patient_history.workspace.notes");
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<NoteVisibility>("PRIVATE_TO_ORG");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading } = useSectionNotes(patientId, sectionCode, open);
  const createMut = useCreateSectionNote(patientId, sectionCode);
  const updateMut = useUpdateSectionNote(patientId, sectionCode);
  const deleteMut = useDeleteSectionNote(patientId, sectionCode);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleSave() {
    const trimmed = content.trim();
    if (!trimmed) return;
    try {
      await createMut.mutateAsync({ content: trimmed, visibility });
      setContent("");
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

  async function handleToggleVisibility(
    noteId: string,
    current: NoteVisibility,
  ) {
    const next: NoteVisibility =
      current === "PRIVATE_TO_ORG" ? "SHARED_GLOBAL" : "PRIVATE_TO_ORG";
    try {
      await updateMut.mutateAsync({ noteId, visibility: next });
    } catch {
      toast.error(t("errorToast"));
    }
  }

  const notes = data?.visible ?? [];
  const redacted = data?.redacted_by_org ?? [];

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        aria-label={t("button")}
        title={t("button")}
        onClick={() => setOpen((v) => !v)}
        className="rounded p-1 text-gray-400 transition-colors hover:text-gray-600"
      >
        <MessageSquareText size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
            <span className="text-xs font-semibold text-brand-black">
              {groupName}
            </span>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="rounded p-0.5 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto px-3 py-2">
            {isLoading ? (
              <p className="py-4 text-center text-[11px] text-gray-400">…</p>
            ) : notes.length === 0 ? (
              <p className="py-4 text-center text-[11px] text-gray-400">
                {t("empty")}
              </p>
            ) : (
              <ul className="space-y-2">
                {notes.map((note) => (
                  <li
                    key={note.id}
                    className="rounded border border-gray-100 px-2 py-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleVisibility(note.id, note.visibility)
                        }
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                          note.visibility === "SHARED_GLOBAL"
                            ? "bg-brand-primary/10 text-brand-primary"
                            : "bg-gray-100 text-gray-600",
                        )}
                      >
                        {note.visibility === "SHARED_GLOBAL"
                          ? t("visibility.shared")
                          : t("visibility.private")}
                      </button>
                      <button
                        type="button"
                        aria-label={t("delete")}
                        onClick={() => handleDelete(note.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-brand-black">
                      {note.content}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {redacted.length > 0 && (
              <p className="mt-2 text-[10px] text-gray-400">
                {t("redactedHint", {
                  count: redacted.reduce((sum, r) => sum + r.count, 0),
                })}
              </p>
            )}
          </div>

          <div className="border-t border-gray-100 px-3 py-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("placeholder")}
              rows={3}
              className="w-full resize-none rounded border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-brand-primary"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex overflow-hidden rounded border border-gray-200 text-[10px]">
                <button
                  type="button"
                  onClick={() => setVisibility("PRIVATE_TO_ORG")}
                  className={cn(
                    "px-2 py-1",
                    visibility === "PRIVATE_TO_ORG"
                      ? "bg-gray-100 font-medium text-brand-black"
                      : "text-gray-500",
                  )}
                >
                  {t("visibility.private")}
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility("SHARED_GLOBAL")}
                  className={cn(
                    "px-2 py-1",
                    visibility === "SHARED_GLOBAL"
                      ? "bg-brand-primary text-white"
                      : "text-gray-500",
                  )}
                >
                  {t("visibility.shared")}
                </button>
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={!content.trim() || createMut.isPending}
                className="rounded bg-brand-primary px-3 py-1 text-[11px] font-medium text-white disabled:opacity-50"
              >
                {t("save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}