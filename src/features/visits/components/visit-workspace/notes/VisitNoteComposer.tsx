"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VISIT_NOTE_MAX_LENGTH } from "../../../types/visits-notes.types";

/** Show the character counter only as the cap comes into view. */
const COUNTER_VISIBLE_FROM = 1600;

type Props = {
  isPending: boolean;
  onSubmit: (content: string) => void;
};

/**
 * The add-a-note box. The parent clears it by remounting on success (see
 * `composerKey` in the rail) — clearing on submit would make the note appear to
 * vanish until the invalidated query refetches, since the repo uses no
 * optimistic updates.
 */
export function VisitNoteComposer({ isPending, onSubmit }: Props) {
  const t = useTranslations("visits.workspace.notes");
  const [content, setContent] = useState("");

  const trimmed = content.trim();
  const atCap = content.length >= VISIT_NOTE_MAX_LENGTH;

  return (
    <form
      className="p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!trimmed || isPending) return;
        onSubmit(trimmed);
      }}
    >
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t("placeholder")}
        maxLength={VISIT_NOTE_MAX_LENGTH}
        rows={3}
        aria-label={t("add")}
        className="text-sm"
      />
      <div className="mt-2 flex items-center gap-2">
        {content.length >= COUNTER_VISIBLE_FROM && (
          // dir="ltr" keeps the "1750/2000" slash from reordering under RTL.
          <span
            dir="ltr"
            className={
              atCap ? "text-[11px] text-amber-600" : "text-[11px] text-gray-400"
            }
          >
            {t("counter", {
              count: content.length,
              max: VISIT_NOTE_MAX_LENGTH,
            })}
          </span>
        )}
        <Button
          type="submit"
          size="xs"
          className="ms-auto"
          disabled={isPending || trimmed.length === 0}
        >
          {isPending ? t("adding") : t("add")}
        </Button>
      </div>
    </form>
  );
}
