"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/features/auth/store/authStore";
import { setPendingProfileSelection } from "@/features/auth/lib/profile-selection-session";
import { acceptStaffInvite, previewStaffInvite } from "../lib/staff.api";
import { STAFF_INVITE_DAYS, STAFF_INVITE_DAY_LABELS } from "../lib/staff-invite.schemas";
import {
  getRoleTranslationKey,
  normalizeApiRoleName,
} from "../lib/staff.utils";
import type {
  ApiStaffBranchSchedule,
  StaffInvitePreview,
  StaffInvitePreviewResponse,
} from "../types/staff.api.types";

type DayCode = (typeof STAFF_INVITE_DAYS)[number];

const DEFAULT_SHIFTS: Record<DayCode, { start: string; end: string }> =
  Object.fromEntries(
    STAFF_INVITE_DAYS.map((d) => [d, { start: "09:00", end: "17:00" }]),
  ) as Record<DayCode, { start: string; end: string }>;

const DEFAULT_AUTH_REDIRECT = "/dashboard";

function unwrapPreview(response: StaffInvitePreviewResponse): StaffInvitePreview {
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

function getOrganizationLabel(invite: StaffInvitePreview) {
  return invite.organization?.name ?? invite.organization_name ?? "-";
}

function getRoleLabel(invite: StaffInvitePreview) {
  return invite.role?.name ?? invite.role_name ?? "-";
}

function getInviterLabel(invite: StaffInvitePreview) {
  const inviter = invite.invited_by ?? invite.inviter ?? invite.created_by;
  if (!inviter) return "-";
  const name = [inviter.first_name, inviter.last_name].filter(Boolean).join(" ");
  return name || inviter.email || "-";
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

export function StaffInviteAcceptance() {
  const t = useTranslations("staff.invite");
  const staffT = useTranslations("staff");
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeDays, setActiveDays] = useState<Set<DayCode>>(new Set());
  const [shifts, setShifts] = useState<Record<DayCode, { start: string; end: string }>>(
    DEFAULT_SHIFTS,
  );

  const token = searchParams.get("token") ?? "";
  const invitationId = searchParams.get("invitation") ?? searchParams.get("invite") ?? "";
  const hasParams = Boolean(token && invitationId);

  const previewQuery = useQuery({
    queryKey: ["staff-invite-preview", invitationId, token],
    queryFn: async () => unwrapPreview(await previewStaffInvite(token, invitationId)),
    enabled: hasParams,
    retry: false,
  });

  const invite = previewQuery.data;

  function buildSchedule(): ApiStaffBranchSchedule[] | undefined {
    if (activeDays.size === 0) return undefined;

    const days = STAFF_INVITE_DAYS.filter((d) => activeDays.has(d)).map((d) => ({
      day_of_week: d,
      shifts: [{ start_time: shifts[d].start, end_time: shifts[d].end }],
    }));

    const branchIds = (invite?.branches ?? [])
      .map((b) => b.branch_id ?? b.id ?? b.branch?.id)
      .filter((id): id is string => Boolean(id));

    if (!branchIds.length) return undefined;
    return branchIds.map((branch_id) => ({ branch_id, days }));
  }

  const acceptMutation = useMutation({
    mutationFn: () =>
      acceptStaffInvite({
        invitation_id: invitationId,
        token,
        password,
        schedule: buildSchedule(),
      }),
    onSuccess: (response) => {
      if (response.data.profiles?.length) {
        setPendingProfileSelection({ profiles: response.data.profiles });
        toast.success(t("success"));
        router.replace("/select-profile");
        return;
      }
      if (response.data.authenticated) {
        setAuthenticated();
      }
      toast.success(t("success"));
      router.replace(DEFAULT_AUTH_REDIRECT);
    },
    onError: (error) => {
      toast.error(t(`errors.${getInviteErrorKey(error)}`));
    },
  });

  const toggleDay = (day: DayCode) => {
    setActiveDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const updateShift = (day: DayCode, field: "start" | "end", value: string) => {
    setShifts((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const apiErrorKey = !hasParams
    ? "missing"
    : previewQuery.isError
      ? getInviteErrorKey(previewQuery.error)
      : null;

  const branchLabels = invite?.branches?.map(getBranchLabel).filter(Boolean) ?? [];
  const rawRoleLabel = invite ? getRoleLabel(invite) : "-";
  const roleLabel =
    rawRoleLabel === "-"
      ? "-"
      : staffT(getRoleTranslationKey(normalizeApiRoleName(rawRoleLabel)));

  const canSubmit =
    password.length >= 8 && hasParams && !!invite && !acceptMutation.isPending;

  return (
    <div className="w-full max-w-xl space-y-4">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-brand-black">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      {previewQuery.isPending && hasParams ? (
        <div className="space-y-3">
          <div className="h-24 animate-pulse rounded-2xl bg-gray-50" />
          <div className="h-20 animate-pulse rounded-2xl bg-gray-50" />
          <div className="h-32 animate-pulse rounded-2xl bg-gray-50" />
          <div className="h-12 animate-pulse rounded-2xl bg-gray-50" />
        </div>
      ) : apiErrorKey ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-center text-sm text-red-600">
          {t(`errors.${apiErrorKey}`)}
        </div>
      ) : invite ? (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) acceptMutation.mutate();
          }}
        >
          {/* Invite details */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
            {(getFullName(invite) || invite.email) && (
              <div className="mb-3">
                {getFullName(invite) && (
                  <p className="text-sm font-semibold text-brand-black">
                    {getFullName(invite)}
                  </p>
                )}
                {invite.email && (
                  <p className="mt-0.5 text-sm text-gray-500">{invite.email}</p>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div>
                <p className="text-xs text-gray-400">{t("organization")}</p>
                <p className="mt-0.5 text-sm font-medium text-brand-black">
                  {getOrganizationLabel(invite)}
                </p>
              </div>
              {roleLabel !== "-" && (
                <div>
                  <p className="text-xs text-gray-400">{t("role")}</p>
                  <p className="mt-0.5 text-sm font-medium text-brand-black">
                    {roleLabel}
                  </p>
                </div>
              )}
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-400">{t("invitedBy")}</p>
                <p className="mt-0.5 text-sm font-medium text-brand-black">
                  {getInviterLabel(invite)}
                </p>
              </div>
              {branchLabels.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-400">{t("branches")}</p>
                  <p className="mt-0.5 text-sm font-medium text-brand-black">
                    {branchLabels.join(" · ")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Password */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3">
              <p className="text-sm font-semibold text-brand-black">
                {invite.user_exists ? t("existingPassword") : t("createPassword")}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                {invite.user_exists ? t("existingPasswordHint") : t("createPasswordHint")}
              </p>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete={invite.user_exists ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(
                  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pe-12 text-sm text-brand-black",
                  "outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20",
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-e-3 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-50 hover:text-brand-black"
                aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              >
                {showPassword ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </button>
            </div>
            {password.length > 0 && password.length < 8 && (
              <p className="mt-1.5 text-xs text-red-500">{t("passwordMin")}</p>
            )}
          </div>

          {/* Schedule (optional) */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3">
              <p className="text-sm font-semibold text-brand-black">{t("setSchedule")}</p>
              <p className="mt-0.5 text-xs text-gray-400">{t("scheduleHint")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {STAFF_INVITE_DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    activeDays.has(day)
                      ? "bg-brand-primary text-white"
                      : "border border-gray-200 bg-gray-50 text-gray-500 hover:border-brand-primary/40 hover:text-brand-black",
                  )}
                >
                  {STAFF_INVITE_DAY_LABELS[day]}
                </button>
              ))}
            </div>
            {activeDays.size > 0 && (
              <div className="mt-3 space-y-2.5">
                {STAFF_INVITE_DAYS.filter((d) => activeDays.has(d)).map((day) => (
                  <div key={day} className="flex items-center gap-2">
                    <span className="w-8 shrink-0 text-xs font-medium text-gray-500">
                      {STAFF_INVITE_DAY_LABELS[day]}
                    </span>
                    <input
                      type="time"
                      value={shifts[day].start}
                      onChange={(e) => updateShift(day, "start", e.target.value)}
                      className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs text-brand-black outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                    />
                    <span className="text-xs text-gray-400">–</span>
                    <input
                      type="time"
                      value={shifts[day].end}
                      onChange={(e) => updateShift(day, "end", e.target.value)}
                      className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs text-brand-black outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

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
