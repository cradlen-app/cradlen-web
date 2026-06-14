"use client";

import { useRef } from "react";
import { Loader2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/common/utils/utils";
import { ApiError } from "@/infrastructure/http/api";
import { useUploadProof } from "../hooks/useSubscription";

const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];

export function ProofUploader({
  organizationId,
  paymentId,
  disabled,
}: {
  organizationId: string | undefined;
  paymentId: string;
  disabled?: boolean;
}) {
  const t = useTranslations("subscriptions");
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadProof(organizationId, paymentId);
  const busy = upload.isPending;

  const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(t("proof.typeError"));
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(t("proof.tooLarge"));
      return;
    }

    upload.mutate(file, {
      onSuccess: () => toast.success(t("proof.uploaded")),
      onError: (error) =>
        toast.error(
          error instanceof ApiError
            ? (error.messages[0] ?? t("proof.error"))
            : t("proof.error"),
        ),
    });
  };

  return (
    <>
      <button
        type="button"
        disabled={busy || disabled}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary/90 disabled:opacity-50",
        )}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Upload className="size-4" />
        )}
        {t("proof.add")}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={onPick}
      />
    </>
  );
}
