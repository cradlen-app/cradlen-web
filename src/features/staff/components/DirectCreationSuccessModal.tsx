"use client";

import { useState } from "react";
import { Copy, UserRoundCog } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";

export type DirectCreationSuccessModalProps = {
  email: string | null;
  onClose: () => void;
};

export default function DirectCreationSuccessModal({
  email,
  onClose,
}: DirectCreationSuccessModalProps) {
  const t = useTranslations("staff.create");
  const [copied, setCopied] = useState(false);

  if (!email) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(email!);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-60 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-61 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl outline-none">
          <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-brand-primary/10">
            <UserRoundCog
              className="size-5 text-brand-primary"
              aria-hidden="true"
            />
          </div>

          <Dialog.Title className="text-base font-semibold text-brand-black">
            {t("directSuccess.title")}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-xs text-gray-500">
            {t("directSuccess.hint")}
          </Dialog.Description>

          <div className="mt-4">
            <p className="mb-1.5 text-xs font-medium text-gray-500">
              {t("directSuccess.emailLabel")}
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-brand-black">
                {email}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 text-gray-400 transition-colors hover:text-brand-primary"
                aria-label="Copy email"
              >
                <Copy className="size-4" aria-hidden="true" />
              </button>
            </div>
            {copied && (
              <p className="mt-1 text-[11px] text-brand-primary">
                {t("directSuccess.copied")}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full rounded-full bg-brand-primary py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90"
          >
            {t("directSuccess.done")}
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
