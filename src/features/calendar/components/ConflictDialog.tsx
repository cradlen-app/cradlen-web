"use client";

import { AlertTriangle } from "lucide-react";
import { Dialog } from "radix-ui";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { Conflict } from "../types/calendar.types";

type Props = {
  open: boolean;
  conflicts: Conflict[];
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConflictDialog({ open, conflicts, onConfirm, onCancel }: Props) {
  const t = useTranslations("calendar");

  return (
    <Dialog.Root open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby="conflict-desc"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-50">
              <AlertTriangle className="size-4 text-amber-500" aria-hidden />
            </span>
            <Dialog.Title className="text-base font-semibold text-brand-black">
              {t("conflict.title")}
            </Dialog.Title>
          </div>

          <p id="conflict-desc" className="mb-4 text-sm text-gray-500">
            {t("conflict.description")}
          </p>

          <ul className="mb-5 space-y-2">
            {conflicts.map((c, i) => (
              <li
                key={i}
                className="rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2 text-xs text-gray-700"
              >
                <span className="font-medium capitalize">{c.kind.toLowerCase()}</span>
                {" — "}
                {c.summary}
              </li>
            ))}
          </ul>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              {t("conflict.cancel")}
            </Button>
            <Button size="sm" onClick={onConfirm}>
              {t("conflict.confirm")}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
