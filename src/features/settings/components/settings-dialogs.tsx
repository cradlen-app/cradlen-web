import { useState } from "react";
import { Trash2 } from "lucide-react";
import { AlertDialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import type { OrganizationBranch } from "../lib/settings.api";
import type { SoftDeleteKey } from "./settings.types";
import type { SettingsT } from "./settings.utils";

type ConfirmDialogsProps = {
  branches: OrganizationBranch[];
  cancelLabel: string;
  confirmSoftDelete: SoftDeleteKey;
  organizationName: string;
  onSoftDeleteConfirm: () => void;
  onSoftDeleteChange: (target: SoftDeleteKey) => void;
  t: SettingsT;
};

export function SettingsConfirmDialogs({
  branches,
  cancelLabel,
  confirmSoftDelete,
  organizationName,
  onSoftDeleteConfirm,
  onSoftDeleteChange,
  t,
}: ConfirmDialogsProps) {
  const [typed, setTyped] = useState("");

  const isOrg = confirmSoftDelete?.type === "organization";
  const targetBranch = confirmSoftDelete?.type === "branch"
    ? branches.find((b) => b.id === confirmSoftDelete.branchId)
    : undefined;
  const isLastBranch = confirmSoftDelete?.type === "branch" && branches.length <= 1;
  const willPromoteOldest =
    confirmSoftDelete?.type === "branch" &&
    !!targetBranch?.is_main &&
    branches.length > 1;
  const oldestSibling = willPromoteOldest
    ? branches
        .filter((b) => b.id !== targetBranch?.id)
        .slice()
        .sort((a, b) => a.id.localeCompare(b.id))[0]
    : undefined;

  const requiresTypedConfirm = isOrg || isLastBranch;
  const expectedConfirmation = isOrg
    ? organizationName
    : isLastBranch
      ? organizationName
      : "";
  const typedMatches =
    !requiresTypedConfirm ||
    typed.trim().toLowerCase() === expectedConfirmation.trim().toLowerCase();

  function title() {
    if (isOrg) return t("organization.deleteTitle");
    if (isLastBranch) return t("branches.deleteLastTitle");
    return t("branches.deleteTitle");
  }

  function description() {
    if (isOrg) return t("organization.deleteDescription");
    if (isLastBranch) return t("branches.deleteLastDescription");
    if (willPromoteOldest && oldestSibling) {
      return t("branches.deleteMainDescription", { name: oldestSibling.name });
    }
    return t("branches.deleteDescription");
  }

  return (
    <AlertDialog.Root
      open={!!confirmSoftDelete}
      onOpenChange={(open) => {
        if (!open) {
          setTyped("");
          onSoftDeleteChange(null);
        }
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-60 bg-black/35" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-61 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl outline-none">
          <AlertDialog.Title className="text-lg font-medium text-brand-black">
            {title()}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-gray-500">
            {description()}
          </AlertDialog.Description>

          {requiresTypedConfirm && (
            <div className="mt-4 grid gap-1.5">
              <label htmlFor="settings-confirm-input" className="text-xs text-gray-600">
                {t("typedConfirmHint", { name: expectedConfirmation })}
              </label>
              <input
                id="settings-confirm-input"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-black outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                placeholder={expectedConfirmation}
                autoComplete="off"
              />
            </div>
          )}

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
                disabled={!typedMatches}
                onClick={(event) => {
                  event.preventDefault();
                  if (!typedMatches) return;
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
  );
}
