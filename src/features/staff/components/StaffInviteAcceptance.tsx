"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/features/auth/store/authStore";
import { acceptStaffInvite, previewStaffInvite } from "../lib/staff.api";
import { STAFF_INVITE_DAY_LABELS } from "../lib/staff-invite.schemas";
import {
  getRoleTranslationKey,
  normalizeApiRoleName,
} from "../lib/staff.utils";
import type {
  AcceptStaffInviteResponse,
  StaffInvitePreview,
  StaffInvitePreviewResponse,
} from "../types/staff.api.types";

const DEFAULT_AUTH_EXPIRES_IN = 60 * 60;
const DEFAULT_AUTH_REDIRECT = "/dashboard";

function unwrapPreview(
  response: StaffInvitePreviewResponse,
): StaffInvitePreview {
  return "data" in response ? response.data : response;
}

function unwrapTokens(response: AcceptStaffInviteResponse) {
  return "data" in response ? response.data : response;
}

function getInviteErrorKey(error: unknown) {
  if (!(error instanceof ApiError)) return "serverError";

  if (error.status === 401) return "invalid";
  if (error.status === 409) return "accepted";
  if (error.status === 410) return "expired";

  return "serverError";
}

function getFullName(invite: StaffInvitePreview) {
  return [invite.first_name, invite.last_name].filter(Boolean).join(" ");
}

function getBranchLabel(
  branch: NonNullable<StaffInvitePreview["branches"]>[number],
) {
  const details = branch.branch;

  if (branch.branch_name) return branch.branch_name;
  if (!details) return "";
  if (details.name) return details.name;

  return [details.address, details.city, details.governorate, details.country]
    .filter(Boolean)
    .join(", ");
}

function getOrganizationLabel(invite: StaffInvitePreview) {
  return invite.organization?.name ?? invite.organization_name ?? "-";
}

function getRoleLabel(invite: StaffInvitePreview) {
  return invite.role?.name ?? invite.role_name ?? "-";
}

function getInviterLabel(invite: StaffInvitePreview) {
  const inviter = invite.invited_by ?? invite.inviter ?? invite.created_by;

  if (!inviter) return "-";

  const name = [inviter.first_name, inviter.last_name]
    .filter(Boolean)
    .join(" ");
  return name || inviter.email || "-";
}

function getScheduleLabel(invite: StaffInvitePreview) {
  return invite.branches
    ?.flatMap((branch) => branch.schedule?.days ?? [])
    .map((day) => {
      const shifts = day.shifts
        .map((shift) => `${shift.start_time} - ${shift.end_time}`)
        .join(", ");

      return `${STAFF_INVITE_DAY_LABELS[day.day_of_week]}: ${shifts}`;
    })
    .join("\n");
}

export function StaffInviteAcceptance() {
  const t = useTranslations("staff.invite");
  const staffT = useTranslations("staff");
  const router = useRouter();
  const searchParams = useSearchParams();
  const setTokens = useAuthStore((state) => state.setTokens);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const token = searchParams.get("token") ?? "";
  const invitationId = searchParams.get("invite") ?? "";
  const hasParams = Boolean(token && invitationId);

  const previewQuery = useQuery({
    queryKey: ["staff-invite-preview", invitationId, token],
    queryFn: async () =>
      unwrapPreview(await previewStaffInvite(token, invitationId)),
    enabled: hasParams,
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: () =>
      acceptStaffInvite({
        invitation_id: invitationId,
        token,
        password,
      }),
    onSuccess: (response) => {
      const tokens = unwrapTokens(response);

      setTokens({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type ?? "Bearer",
        expires_in: tokens.expires_in ?? DEFAULT_AUTH_EXPIRES_IN,
      });
      toast.success(t("success"));
      router.replace(DEFAULT_AUTH_REDIRECT);
    },
    onError: (error) => {
      toast.error(t(`errors.${getInviteErrorKey(error)}`));
    },
  });

  const invite = previewQuery.data;
  const apiErrorKey = !hasParams
    ? "missing"
    : previewQuery.isError
      ? getInviteErrorKey(previewQuery.error)
      : null;
  const branchLabels = useMemo(
    () => invite?.branches?.map(getBranchLabel).filter(Boolean) ?? [],
    [invite],
  );
  const scheduleLabel = useMemo(
    () => (invite ? getScheduleLabel(invite) : ""),
    [invite],
  );
  const inviteeName = invite ? getFullName(invite) : "";
  const rawRoleLabel = invite ? getRoleLabel(invite) : "-";
  const roleLabel =
    rawRoleLabel === "-"
      ? "-"
      : staffT(getRoleTranslationKey(normalizeApiRoleName(rawRoleLabel)));

  const canSubmit =
    password.length >= 8 && hasParams && !!invite && !acceptMutation.isPending;

  return (
    <div className="w-full max-w-xl rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-5 text-center">
        <h1 className="text-xl font-semibold text-brand-black">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      {previewQuery.isPending && hasParams ? (
        <div className="space-y-3">
          <div className="h-16 animate-pulse rounded-xl bg-gray-50" />
          <div className="h-28 animate-pulse rounded-xl bg-gray-50" />
          <div className="h-12 animate-pulse rounded-xl bg-gray-50" />
        </div>
      ) : apiErrorKey ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
          {t(`errors.${apiErrorKey}`)}
        </div>
      ) : invite ? (
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSubmit) return;
            acceptMutation.mutate();
          }}
        >
          <section className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
            {(inviteeName || invite.email) && (
              <div className="mb-4">
                {inviteeName && (
                  <p className="text-sm font-semibold text-brand-black">
                    {inviteeName}
                  </p>
                )}
                {invite.email && (
                  <p className="mt-1 text-sm text-gray-500">{invite.email}</p>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-gray-400">{t("organization")}</p>
                <p className="mt-1 text-sm font-medium text-brand-black">
                  {getOrganizationLabel(invite)}
                </p>
              </div>
              {roleLabel !== "-" && (
                <div>
                  <p className="text-xs text-gray-400">{t("role")}</p>
                  <p className="mt-1 text-sm font-medium text-brand-black">
                    {roleLabel}
                  </p>
                </div>
              )}
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-400">{t("invitedBy")}</p>
                <p className="mt-1 text-sm font-medium text-brand-black">
                  {getInviterLabel(invite)}
                </p>
              </div>
              {branchLabels.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-400">{t("branches")}</p>
                  <p className="mt-1 text-sm font-medium text-brand-black">
                    {branchLabels.join(" | ")}
                  </p>
                </div>
              )}
              {scheduleLabel && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-400">{t("schedule")}</p>
                  <p className="mt-1 whitespace-pre-line text-sm font-medium text-brand-black">
                    {scheduleLabel}
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-2">
            <div>
              <label
                htmlFor="invitePassword"
                className="text-sm font-medium text-brand-black"
              >
                {invite.user_exists
                  ? t("existingPassword")
                  : t("createPassword")}
              </label>
              <p className="mt-1 text-xs text-gray-400">
                {invite.user_exists
                  ? t("existingPasswordHint")
                  : t("createPasswordHint")}
              </p>
            </div>
            <div className="relative">
              <input
                id="invitePassword"
                type={showPassword ? "text" : "password"}
                autoComplete={
                  invite.user_exists ? "current-password" : "new-password"
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={cn(
                  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pe-12 text-sm text-brand-black",
                  "outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20",
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute inset-e-3 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-50 hover:text-brand-black"
                aria-label={
                  showPassword ? t("hidePassword") : t("showPassword")
                }
              >
                {showPassword ? (
                  <Eye className="size-4" />
                ) : (
                  <EyeOff className="size-4" />
                )}
              </button>
            </div>
            {password.length > 0 && password.length < 8 && (
              <p className="text-xs text-red-500">{t("passwordMin")}</p>
            )}
          </section>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-full bg-brand-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-50"
          >
            {acceptMutation.isPending ? t("accepting") : t("accept")}
          </button>
        </form>
      ) : null}
    </div>
  );
}
