import { CircleCheck, Trash2 } from "lucide-react";
import { AlertDialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import type { SoftDeleteKey } from "./settings.types";
import type { SettingsT } from "./settings.utils";

type ConfirmDialogsProps = {
  cancelLabel: string;
  confirmDeactivate: boolean;
  confirmSoftDelete: SoftDeleteKey;
  onDeactivateChange: (open: boolean) => void;
  onDeactivateConfirm: () => void;
  onSoftDeleteConfirm: () => void;
  onSoftDeleteChange: (target: SoftDeleteKey) => void;
  t: SettingsT;
};

export function SettingsConfirmDialogs({
  cancelLabel,
  confirmDeactivate,
  confirmSoftDelete,
  onDeactivateChange,
  onDeactivateConfirm,
  onSoftDeleteConfirm,
  onSoftDeleteChange,
  t,
}: ConfirmDialogsProps) {
  return (
    <>
      <AlertDialog.Root
        open={!!confirmSoftDelete}
        onOpenChange={(open) => {
          if (!open) onSoftDeleteChange(null);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-60 bg-black/35" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-61 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl outline-none">
            <AlertDialog.Title className="text-lg font-medium text-brand-black">
              {confirmSoftDelete === "organization"
                ? t("organization.DeleteTitle")
                : t("branches.DeleteTitle")}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-gray-500">
              {confirmSoftDelete === "organization"
                ? t("organization.DeleteDescription")
                : t("branches.DeleteDescription")}
            </AlertDialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button type="button" variant="outline">
                  {cancelLabel}
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={(event) => {
                    event.preventDefault();
                    onSoftDeleteConfirm();
                  }}
                >
                  <Trash2 className="size-4" />
                  {t("softDeleteConfirm")}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      <AlertDialog.Root
        open={confirmDeactivate}
        onOpenChange={onDeactivateChange}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-60 bg-black/35" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-61 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl outline-none">
            <AlertDialog.Title className="text-lg font-medium text-brand-black">
              {t("danger.confirmTitle")}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-gray-500">
              {t("danger.confirmDescription")}
            </AlertDialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button type="button" variant="outline">
                  {cancelLabel}
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={(event) => {
                    event.preventDefault();
                    onDeactivateConfirm();
                  }}
                >
                  <CircleCheck className="size-4" />
                  {t("danger.confirm")}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
