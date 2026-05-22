"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog } from "radix-ui";
import { Loader2 } from "lucide-react";
import { FieldShell } from "@/builder/fields/field-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/common/utils/utils";
import { fetchCarePaths } from "@/features/care-paths/lib/care-paths.api";
import type { FieldInputProps } from "@/builder/fields/input-props";

// Only GENERAL_GYN has a full profile implementation today.
// Remove a code from this set when its profile tab is built.
const IMPLEMENTED_PATHS = new Set(["GENERAL_GYN"]);

export function CasePathInput({
  field,
  value,
  onChange,
  required,
  disabled,
  error,
  flagged,
}: FieldInputProps) {
  const specialtyCode = typeof field.config?.ui?.specialtyCode === "string"
    ? field.config.ui.specialtyCode
    : undefined;

  const { data: carePaths = [], isLoading, isError } = useQuery({
    queryKey: ["care-paths", specialtyCode],
    queryFn: ({ signal }) => fetchCarePaths(specialtyCode!, signal),
    enabled: !!specialtyCode,
    staleTime: 5 * 60 * 1000,
  });

  const current = (value as string | null | undefined) ?? "GENERAL_GYN";
  const [pending, setPending] = useState<string | null>(null);

  const handleClick = (code: string) => {
    if (code === current || disabled) return;
    if (!IMPLEMENTED_PATHS.has(code)) {
      setPending(code);
      return;
    }
    onChange(code);
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
        <div className="flex items-center gap-2 flex-wrap">
          {isLoading && <Loader2 className="size-3.5 animate-spin text-gray-400" />}
          {isError && <span className="text-[11px] text-red-400">Failed to load care paths</span>}
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

      <Dialog.Root open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
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
                <Button variant="outline" size="sm">Close</Button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
