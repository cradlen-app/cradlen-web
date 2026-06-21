"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FieldShell } from "@/builder/fields/field-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/common/utils/utils";
import { useCarePaths } from "@/features/care-paths/lib/useCarePaths";
import { activatePregnancy } from "@/features/journeys/lib/pregnancy.api";
import { usePregnancyActivationContext } from "@/features/examination/lib/pregnancy-activation-context";
import type { FieldInputProps } from "@/builder/fields/input-props";

const PREGNANCY_CODE = "OBGYN_PREGNANCY";

// Care paths with a full profile implementation. OBGYN_PREGNANCY routes through
// the activation drawer (creates the profile + reveals the Pregnancy tab); the
// rest still surface the inert "coming soon" notice. Add a code here when its
// profile tab is built.
const IMPLEMENTED_PATHS = new Set(["OBGYN_GENERAL", PREGNANCY_CODE]);

export function CasePathInput({
  field,
  value,
  onChange,
  required,
  disabled,
  error,
  flagged,
}: FieldInputProps) {
  const specialtyCode =
    typeof field.config?.ui?.specialtyCode === "string"
      ? field.config.ui.specialtyCode
      : undefined;

  const { data: carePaths = [], isLoading, isError } = useCarePaths(specialtyCode);
  const tPreg = useTranslations("pregnancy");
  const pregnancyCtx = usePregnancyActivationContext();
  const qc = useQueryClient();

  const current = (value as string | null | undefined) ?? "OBGYN_GENERAL";
  const [pending, setPending] = useState<string | null>(null);
  const [pendingPregnancy, setPendingPregnancy] = useState(false);
  const [activating, setActivating] = useState(false);

  const handleClick = (code: string) => {
    if (code === current || disabled) return;
    // Pregnancy goes through the activation drawer (creates the profile +
    // reveals the Pregnancy tab). Without a visit in scope, fall back to the
    // inert "coming soon" notice rather than silently setting the care path.
    if (code === PREGNANCY_CODE) {
      if (pregnancyCtx) setPendingPregnancy(true);
      else setPending(code);
      return;
    }
    if (!IMPLEMENTED_PATHS.has(code)) {
      setPending(code);
      return;
    }
    onChange(code);
  };

  const handleCreatePregnancy = async () => {
    if (!pregnancyCtx) return;
    setActivating(true);
    try {
      await activatePregnancy(pregnancyCtx.visitId);
      onChange(PREGNANCY_CODE);
      await qc.invalidateQueries({
        queryKey: ["visit-journey", pregnancyCtx.visitId],
      });
      toast.success(tPreg("created"));
      setPendingPregnancy(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : tPreg("createError");
      toast.error(message);
    } finally {
      setActivating(false);
    }
  };

  const pendingName = pending
    ? (carePaths.find((cp) => cp.code === pending)?.name ?? pending)
    : null;

  return (
    <>
      <FieldShell
        label={field.label}
        required={required}
        error={error}
        flagged={flagged}
        inline
      >
        <div className="flex items-center justify-around flex-wrap gap-2">
          {isLoading && (
            <Loader2 className="size-3.5 animate-spin text-gray-400" />
          )}
          {isError && (
            <span className="text-[11px] text-red-400">
              Failed to load care paths
            </span>
          )}
          {carePaths.map((cp) => (
            <button
              key={cp.code}
              type="button"
              role="button"
              aria-pressed={cp.code === current}
              disabled={disabled}
              onClick={() => handleClick(cp.code)}
              className={cn(
                "text-xs font-medium transition-colors",
                cp.code === current
                  ? "px-3 py-1 rounded bg-brand-primary text-white"
                  : "px-1 text-gray-500 hover:text-brand-primary",
              )}
            >
              {cp.name}
            </button>
          ))}
        </div>
      </FieldShell>

      <Dialog.Root
        open={!!pending}
        onOpenChange={(open) => !open && setPending(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-60 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-61 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl outline-none">
            <Dialog.Title className="flex items-center gap-2 text-sm text-teal-600">
              {"\u{1F6A7}"} {pendingName} profile
              <span className="inline-block bg-yellow-100 text-yellow-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                Coming soon
              </span>
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-gray-600">
              A dedicated {pendingName?.toLowerCase()} care path profile is on
              its way. For now, continue with General GYN.
            </Dialog.Description>
            <div className="mt-4 flex justify-end">
              <Dialog.Close asChild>
                <Button variant="outline" size="sm">
                  Close
                </Button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root
        open={pendingPregnancy}
        onOpenChange={(open) => {
          if (!open && !activating) setPendingPregnancy(false);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-60 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-61 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl outline-none">
            <Dialog.Title className="flex items-center gap-2 text-sm font-medium text-teal-600">
              {"\u{1F514}"} {tPreg("activateTitle")}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-gray-600">
              {tPreg("activatePrompt")}
            </Dialog.Description>
            <div className="mt-5 flex justify-center gap-3">
              <Button
                size="sm"
                className="bg-brand-primary"
                disabled={activating}
                onClick={handleCreatePregnancy}
              >
                {activating ? (
                  <Loader2 size={14} className="mr-1 animate-spin" />
                ) : null}
                {tPreg("create")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={activating}
                onClick={() => setPendingPregnancy(false)}
              >
                {tPreg("notNow")}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
