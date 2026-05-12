"use client";

import { useTranslations } from "next-intl";
import { AlertDialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import type { ApiStaffInvitation } from "../types/staff.api.types";

export type DeleteInvitationModalProps = {
  invitation: ApiStaffInvitation | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

export default function DeleteInvitationModal({
  invitation,
  isDeleting,
  onConfirm,
  onOpenChange,
}: DeleteInvitationModalProps) {
  const t = useTranslations("staff.invitations");

  return (
    <AlertDialog.Root
      open={!!invitation}
      onOpenChange={(open) => {
        if (!open) onOpenChange(false);
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-60 bg-black/35" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-61 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl outline-none">
          <AlertDialog.Title className="text-lg font-medium text-brand-black">
            {t("deleteTitle")}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-gray-500">
            {t("deleteDescription", {
              email: invitation?.email ?? t("thisInvitation"),
            })}
          </AlertDialog.Description>
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
                disabled={isDeleting}
              >
                {isDeleting ? t("deleting") : t("delete")}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
