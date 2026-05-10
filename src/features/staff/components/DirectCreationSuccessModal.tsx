"use client";

import { useState } from "react";
import { Copy, UserRoundCog } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";

export type DirectCreationSuccessModalProps = {
  credentials: { email: string; password: string } | null;
  onClose: () => void;
};

export default function DirectCreationSuccessModal({
  credentials,
  onClose,
}: DirectCreationSuccessModalProps) {
  const t = useTranslations("staff.create");
  const [copied, setCopied] = useState<"email" | "password" | "both" | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  if (!credentials) return null;

  async function copy(value: string, key: "email" | "password" | "both") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  function handleClose() {
    setAcknowledged(false);
    onClose();
  }

  const both = `${credentials.email}\n${credentials.password}`;

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-60 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-61 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl outline-none">
          <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-brand-primary/10">
            <UserRoundCog className="size-5 text-brand-primary" aria-hidden="true" />
          </div>

          <Dialog.Title className="text-base font-semibold text-brand-black">
            {t("directSuccess.title")}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-xs text-gray-500">
            {t("directSuccess.hint")}
          </Dialog.Description>

          <div className="mt-4 space-y-3">
            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-500">
                {t("directSuccess.emailLabel")}
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-brand-black">
                  {credentials.email}
                </span>
                <button
                  type="button"
                  onClick={() => copy(credentials.email, "email")}
                  className="shrink-0 text-gray-400 transition-colors hover:text-brand-primary"
                  aria-label={t("directSuccess.copyEmail")}
                >
                  <Copy className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-500">
                {t("directSuccess.passwordLabel")}
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                <span className="min-w-0 flex-1 truncate font-mono text-sm font-medium text-brand-black">
                  {credentials.password}
                </span>
                <button
                  type="button"
                  onClick={() => copy(credentials.password, "password")}
                  className="shrink-0 text-gray-400 transition-colors hover:text-brand-primary"
                  aria-label={t("directSuccess.copyPassword")}
                >
                  <Copy className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => copy(both, "both")}
              className="w-full rounded-full border border-brand-primary/30 bg-white py-1.5 text-xs font-medium text-brand-primary transition-colors hover:bg-brand-primary/5"
            >
              {copied === "both" ? t("directSuccess.copied") : t("directSuccess.copyBoth")}
            </button>

            {copied && copied !== "both" && (
              <p className="text-[11px] text-brand-primary">
                {t("directSuccess.copied")}
              </p>
            )}
          </div>

          <label className="mt-4 flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 size-4 rounded border-gray-300 accent-brand-primary"
            />
            <span className="text-xs text-gray-600">{t("directSuccess.acknowledge")}</span>
          </label>

          <button
            type="button"
            onClick={handleClose}
            disabled={!acknowledged}
            className="mt-5 w-full rounded-full bg-brand-primary py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("directSuccess.done")}
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
