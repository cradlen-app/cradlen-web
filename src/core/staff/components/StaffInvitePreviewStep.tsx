"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { declineStaffInvite } from "../lib/staff.api";
import type { InvitationPreview } from "../types/staff.api.types";

export interface PreviewStepProps {
  preview: InvitationPreview;
  token: string;
  invitationId: string;
  onAccept: () => void;
}

export function PreviewStep({
  preview,
  token,
  invitationId,
  onAccept,
}: PreviewStepProps) {
  const t = useTranslations("staff.invite");
  const router = useRouter();

  const declineMutation = useMutation({
    mutationFn: () => declineStaffInvite(invitationId, token),
    onSuccess: () => {
      toast.success(t("declineSuccess"));
      router.replace("/sign-in");
    },
    onError: () => {
      toast.error(t("errors.serverError"));
    },
  });

  const expiresAt = new Date(preview.expires_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="w-full max-w-xl space-y-4">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-brand-black">
          {t("preview.title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{t("preview.subtitle")}</p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
        {/* Invitee name */}
        <div className="text-center pb-3 border-b border-gray-100">
          <p className="text-base font-semibold text-brand-black">
            {preview.first_name} {preview.last_name}
          </p>
          <p className="text-sm text-gray-400">{preview.email}</p>
        </div>

        {/* Details grid */}
        <dl className="space-y-3">
          <div className="flex gap-3">
            <dt className="w-28 shrink-0 text-xs font-medium text-gray-400">
              {t("organization")}
            </dt>
            <dd className="text-xs text-brand-black">
              {preview.organization.name}
            </dd>
          </div>

          <div className="flex gap-3">
            <dt className="w-28 shrink-0 text-xs font-medium text-gray-400">
              {t("branches")}
            </dt>
            <dd className="text-xs text-brand-black">
              <ul className="space-y-0.5">
                {preview.branches.map((b) => (
                  <li key={b.id}>
                    {b.name}
                    {b.city ? ` — ${b.city}` : ""}
                  </li>
                ))}
              </ul>
            </dd>
          </div>

          <div className="flex gap-3">
            <dt className="w-28 shrink-0 text-xs font-medium text-gray-400">
              {t("role")}
            </dt>
            <dd className="text-xs text-brand-black">
              {preview.role?.name ?? "-"}
            </dd>
          </div>

          <div className="flex gap-3">
            <dt className="w-28 shrink-0 text-xs font-medium text-gray-400">
              {t("invitedBy")}
            </dt>
            <dd className="text-xs text-brand-black">
              {preview.invited_by.first_name} {preview.invited_by.last_name}
            </dd>
          </div>

          <div className="flex gap-3">
            <dt className="w-28 shrink-0 text-xs font-medium text-gray-400">
              {t("preview.expires")}
            </dt>
            <dd className="text-xs text-brand-black">{expiresAt}</dd>
          </div>
        </dl>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => declineMutation.mutate()}
          disabled={declineMutation.isPending}
          className="flex-1 rounded-full border border-gray-200 py-3 text-sm font-semibold text-gray-500 transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-50"
        >
          {declineMutation.isPending
            ? t("preview.declining")
            : t("preview.decline")}
        </button>
        <button
          type="button"
          onClick={onAccept}
          className="flex-2 rounded-full bg-brand-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90"
        >
          {t("preview.accept")}
        </button>
      </div>
    </div>
  );
}

