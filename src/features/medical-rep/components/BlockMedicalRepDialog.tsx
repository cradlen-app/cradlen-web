"use client";

import { AlertDialog } from "radix-ui";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { MedicalRep } from "../types/medical-rep.types";

interface Props {
  rep: MedicalRep | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function BlockMedicalRepDialog({ rep, onOpenChange, onConfirm, isPending }: Props) {
  const t = useTranslations("medicalRep.blockDialog");
  const isBlocking = rep?.status === "active";

  return (
    <AlertDialog.Root
      open={!!rep}
      onOpenChange={(open) => {
        if (!open) onOpenChange(false);
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-60 bg-black/35" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-61 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl outline-none">
          <AlertDialog.Title className="text-lg font-medium text-brand-black">
            {isBlocking ? t("blockTitle") : t("unblockTitle")}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-gray-500">
            {isBlocking
              ? t("blockDescription", { name: rep?.full_name ?? "" })
              : t("unblockDescription", { name: rep?.full_name ?? "" })}
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
                variant={isBlocking ? "destructive" : "default"}
                onClick={(e) => {
                  e.preventDefault();
                  onConfirm();
                }}
                disabled={isPending}
              >
                {isPending ? "…" : t("confirm")}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
