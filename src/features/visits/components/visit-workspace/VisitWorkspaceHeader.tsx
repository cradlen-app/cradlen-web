"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";

type Props = {
  canComplete: boolean;
  canCancel: boolean;
  isMutating: boolean;
  onComplete: () => void;
  onCancel: () => void;
};

export function VisitWorkspaceHeader({
  canComplete,
  canCancel,
  isMutating,
  onComplete,
  onCancel,
}: Props) {
  const t = useTranslations("visits.workspace.header");

  if (!canComplete && !canCancel) return null;

  return (
    <header className="flex items-center justify-end gap-2">
      {canCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={isMutating}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full border border-red-200 bg-white px-4 text-xs font-semibold text-red-600",
            "hover:bg-red-50 disabled:opacity-60",
          )}
        >
          <XCircle className="size-3.5" aria-hidden="true" />
          {t("cancelVisit")}
        </button>
      )}
      {canComplete && (
        <button
          type="button"
          onClick={onComplete}
          disabled={isMutating}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-primary px-4 text-xs font-semibold text-white",
            "hover:bg-brand-primary/90 disabled:opacity-60",
          )}
        >
          {isMutating ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
          )}
          {t("complete")}
        </button>
      )}
    </header>
  );
}
