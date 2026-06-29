"use client";

import type { ReactNode } from "react";
import { AlertDialog, Dialog } from "radix-ui";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { getStaffFullName } from "../lib/staff.utils";
import type { StaffMember } from "../types/staff.types";

/** Height of the fixed mobile bottom tab bar; mobile sheets stop above it. */
const BOTTOM_NAV_HEIGHT = 64;

/** Full-height mobile sheet wrapping the selected member's overview. */
export function MobileStaffOverviewDialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  const t = useTranslations("staff.overview");
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{ top: "4rem", bottom: BOTTOM_NAV_HEIGHT }}
          className="fixed inset-x-0 z-50 bg-black/40 lg:hidden"
        />
        <Dialog.Content
          aria-describedby={undefined}
          style={{ top: "4rem", bottom: BOTTOM_NAV_HEIGHT }}
          className="fixed inset-x-0 z-50 flex flex-col bg-white outline-none lg:hidden"
        >
          <Dialog.Title className="sr-only">{t("title")}</Dialog.Title>
          <Dialog.Close
            aria-label={t("cancel")}
            className="absolute end-3 top-3 z-10 inline-flex size-8 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-sm transition-colors hover:bg-gray-100 hover:text-brand-black"
          >
            <X className="size-4" aria-hidden="true" />
          </Dialog.Close>
          <div className="flex-1 overflow-y-auto">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * Confirmation for removing a staff member from a branch. When it's the member's
 * last branch (full deletion), a typed-name confirmation is required.
 */
export function RemoveStaffDialog({
  member,
  branchName,
  isLastBranch,
  confirmText,
  onConfirmTextChange,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  member: StaffMember | null;
  branchName?: string;
  isLastBranch: boolean;
  confirmText: string;
  onConfirmTextChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const t = useTranslations("staff.overview");
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-60 bg-black/35" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-61 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl outline-none">
          <AlertDialog.Title className="text-lg font-medium text-brand-black">
            {t(isLastBranch ? "removeLastTitle" : "removeTitle")}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-gray-500">
            {t(isLastBranch ? "removeLastDescription" : "removeDescription", {
              name: member ? getStaffFullName(member) : t("thisStaffMember"),
              branch: branchName ?? "",
            })}
          </AlertDialog.Description>
          {isLastBranch && member && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-gray-500">
                {t("typedConfirmHint", { name: getStaffFullName(member) })}
              </p>
              <input
                type="text"
                autoFocus
                value={confirmText}
                onChange={(e) => onConfirmTextChange(e.target.value)}
                placeholder={getStaffFullName(member)}
                className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200"
              />
            </div>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button type="button" variant="outline">
                {t("cancel")}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                type="button"
                variant="destructive"
                onClick={(event) => {
                  event.preventDefault();
                  onConfirm();
                }}
                disabled={
                  isPending ||
                  !member ||
                  (isLastBranch &&
                    confirmText.trim() !== getStaffFullName(member).trim())
                }
              >
                {isPending ? t("removing") : t("remove")}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
