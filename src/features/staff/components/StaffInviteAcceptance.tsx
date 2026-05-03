"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { ApiError, apiAuthFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/features/auth/store/authStore";
import { setPendingProfileSelection } from "@/features/auth/lib/profile-selection-session";
import {
  getActiveProfile,
  getBranchId,
  getDefaultBranch,
} from "@/features/auth/lib/current-user";
import type { CurrentUser } from "@/types/user.types";
import { acceptStaffInvite } from "../lib/staff.api";
import { STAFF_INVITE_DAYS, STAFF_INVITE_DAY_LABELS } from "../lib/staff-invite.schemas";

type DayCode = (typeof STAFF_INVITE_DAYS)[number];

const DEFAULT_SHIFTS: Record<DayCode, { start: string; end: string }> =
  Object.fromEntries(
    STAFF_INVITE_DAYS.map((d) => [d, { start: "09:00", end: "17:00" }]),
  ) as Record<DayCode, { start: string; end: string }>;

function getInviteErrorKey(error: unknown) {
  if (!(error instanceof ApiError)) return "serverError";
  if (error.status === 401) return "invalid";
  if (error.status === 409) return "accepted";
  if (error.status === 410) return "expired";
  return "serverError";
}

function buildSchedule(
  activeDays: Set<DayCode>,
  shifts: Record<DayCode, { start: string; end: string }>,
) {
  if (activeDays.size === 0) return undefined;

  const days = STAFF_INVITE_DAYS.filter((d) => activeDays.has(d)).map((d) => ({
    day_of_week: d,
    shifts: [{ start_time: shifts[d].start, end_time: shifts[d].end }],
  }));

  return [{ days }];
}

export function StaffInviteAcceptance() {
  const t = useTranslations("staff.invite");
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeDays, setActiveDays] = useState<Set<DayCode>>(new Set());
  const [shifts, setShifts] = useState(DEFAULT_SHIFTS);

  const token = searchParams.get("token") ?? "";
  const invitationId = searchParams.get("invitation") ?? searchParams.get("invite") ?? "";
  const hasParams = Boolean(token && invitationId);

  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;

  const acceptMutation = useMutation({
    mutationFn: () =>
      acceptStaffInvite({
        invitation_id: invitationId,
        token,
        password,
        schedule: buildSchedule(activeDays, shifts),
      }),
    onSuccess: async (response) => {
      if (response.data.profiles?.length) {
        setPendingProfileSelection({ profiles: response.data.profiles });
        toast.success(t("success"));
        router.replace("/select-profile");
        return;
      }
      if (response.data.authenticated) {
        setAuthenticated();
        try {
          const me = await apiAuthFetch<{ data: CurrentUser }>("/auth/me");
          const profile = getActiveProfile(me.data);
          const branch = getDefaultBranch(profile);
          const branchId = getBranchId(branch);
          if (profile?.organization.id && branchId) {
            toast.success(t("success"));
            router.replace(`/${profile.organization.id}/${branchId}/dashboard`);
            return;
          }
        } catch {
          // fall through to generic redirect
        }
      }
      toast.success(t("success"));
      router.replace("/");
    },
    onError: (error) => {
      toast.error(t(`errors.${getInviteErrorKey(error)}`));
    },
  });

  const canSubmit =
    password.length >= 8 &&
    password === confirmPassword &&
    hasParams &&
    !acceptMutation.isPending;

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

  if (!hasParams) {
    return (
      <div className="w-full max-w-xl">
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-center text-sm text-red-600">
          {t("errors.missing")}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl space-y-4">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-brand-black">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) acceptMutation.mutate();
        }}
      >
        {/* Password */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3">
            <p className="text-sm font-semibold text-brand-black">{t("createPassword")}</p>
            <p className="mt-0.5 text-xs text-gray-400">{t("createPasswordHint")}</p>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t("createPassword")}
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
              <p className="text-xs text-red-500">{t("passwordMin")}</p>
            )}
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t("confirmPassword")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={cn(
                  "w-full rounded-xl border bg-white px-4 py-3 pe-12 text-sm text-brand-black",
                  "outline-none transition-colors focus:ring-2 focus:ring-brand-primary/20",
                  !passwordsMatch
                    ? "border-red-300 focus:border-red-400"
                    : "border-gray-200 focus:border-brand-primary",
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute inset-e-3 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-50 hover:text-brand-black"
                aria-label={showConfirm ? t("hidePassword") : t("showPassword")}
              >
                {showConfirm ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </button>
            </div>
            {!passwordsMatch && confirmPassword.length > 0 && (
              <p className="text-xs text-red-500">{t("passwordMismatch")}</p>
            )}
          </div>
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
    </div>
  );
}
