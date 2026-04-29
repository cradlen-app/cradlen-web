"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api";
import { useRouter } from "@/i18n/navigation";
import { setPendingProfileSelection } from "@/features/auth/lib/profile-selection-session";
import type { UserProfile } from "@/types/user.types";

type JoinPreviewResponse = {
  data?: {
    account_name?: string;
    role?: string;
  };
};

type JoinAcceptResponse = {
  data: {
    profiles?: UserProfile[];
  };
  meta?: Record<string, unknown>;
};

export function JoinCodePage() {
  const t = useTranslations("staff.joinCode");
  const router = useRouter();
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState<JoinPreviewResponse["data"] | null>(
    null,
  );
  const [previewUnavailable, setPreviewUnavailable] = useState(false);

  const previewMutation = useMutation({
    mutationFn: (value: string) =>
      apiFetch<JoinPreviewResponse>("/join-codes/preview", {
        method: "POST",
        body: JSON.stringify({ code: value }),
      }),
    onSuccess: (response) => {
      setPreview(response.data ?? null);
      setPreviewUnavailable(false);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 404) {
        setPreviewUnavailable(true);
        return;
      }
      toast.error(t("previewError"));
    },
  });

  const acceptMutation = useMutation({
    mutationFn: () =>
      apiFetch<JoinAcceptResponse>("/join-codes/accept", {
        method: "POST",
        body: JSON.stringify({ code }),
      }),
    onSuccess: (response) => {
      setPendingProfileSelection({ profiles: response.data.profiles ?? [] });
      router.replace("/select-profile");
    },
    onError: () => toast.error(t("acceptError")),
  });

  function handlePreview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = code.trim();
    if (!value) return;
    previewMutation.mutate(value);
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-5 text-center">
        <h1 className="text-xl font-semibold text-brand-black">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      <form onSubmit={handlePreview} className="space-y-4">
        <div>
          <label htmlFor="joinCode" className="text-sm text-brand-black">
            {t("code")}
          </label>
          <input
            id="joinCode"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-sm tracking-[0.2em] text-brand-black outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          />
        </div>
        <button
          type="submit"
          disabled={previewMutation.isPending || !code.trim()}
          className="w-full rounded-full border border-brand-primary py-3 text-sm font-semibold text-brand-primary transition-colors hover:bg-brand-primary/5 disabled:opacity-50"
        >
          {previewMutation.isPending ? t("checking") : t("preview")}
        </button>
      </form>

      {(preview || previewUnavailable) && (
        <section className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm">
          {preview ? (
            <div className="space-y-2">
              <p className="font-medium text-brand-black">
                {preview.account_name ?? t("unknownAccount")}
              </p>
              {preview.role && <p className="text-gray-500">{preview.role}</p>}
            </div>
          ) : (
            <p className="text-gray-500">{t("previewUnavailable")}</p>
          )}
        </section>
      )}

      <button
        type="button"
        disabled={acceptMutation.isPending || !code.trim()}
        onClick={() => acceptMutation.mutate()}
        className="mt-5 w-full rounded-full bg-brand-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-50"
      >
        {acceptMutation.isPending ? t("accepting") : t("accept")}
      </button>
    </div>
  );
}
