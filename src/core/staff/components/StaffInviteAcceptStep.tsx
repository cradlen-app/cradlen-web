"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/common/utils/utils";
import { apiAuthFetch } from "@/infrastructure/http/api";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useAvailableProfilesStore } from "@/features/auth/store/availableProfilesStore";
import { setPendingProfileSelection } from "@/features/auth/lib/profile-selection-session";
import {
  getActiveProfile,
  getBranchId,
  getDefaultBranch,
} from "@/features/auth/lib/current-user";
import type { CurrentUser } from "@/common/types/user.types";
import type { ApiResponse } from "@/common/types/api.types";
import { acceptStaffInvite } from "../lib/staff.api";
import type { InvitationPreview } from "../types/staff.api.types";
import {
  STAFF_INVITE_DAYS,
  STAFF_INVITE_DAY_LABELS,
} from "../lib/staff-invite.schemas";
import {
  buildBranchSchedule,
  getInviteErrorKey,
  makeDefaultBranchSchedule,
  type BranchScheduleState,
  type DayCode,
} from "./staff-invite.helpers";

export interface AcceptStepProps {
  preview: InvitationPreview;
  token: string;
  invitationId: string;
  onBack: () => void;
}

export function AcceptStep({ preview, token, invitationId, onBack }: AcceptStepProps) {
  const t = useTranslations("staff.invite");
  const router = useRouter();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setAvailableProfiles = useAvailableProfilesStore(
    (state) => state.setAvailableProfiles,
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [schedules, setSchedules] = useState<
    Record<string, BranchScheduleState>
  >(() =>
    Object.fromEntries(
      preview.branches.map((b) => [b.id, makeDefaultBranchSchedule()]),
    ),
  );

  const passwordsMatch =
    confirmPassword.length === 0 || password === confirmPassword;

  const toggleDay = (branchId: string, day: DayCode) => {
    setSchedules((prev) => {
      const branchState = prev[branchId];
      const next = new Set(branchState.activeDays);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return { ...prev, [branchId]: { ...branchState, activeDays: next } };
    });
  };

  const updateShift = (
    branchId: string,
    day: DayCode,
    field: "start" | "end",
    value: string,
  ) => {
    setSchedules((prev) => {
      const branchState = prev[branchId];
      return {
        ...prev,
        [branchId]: {
          ...branchState,
          shifts: {
            ...branchState.shifts,
            [day]: { ...branchState.shifts[day], [field]: value },
          },
        },
      };
    });
  };

  const acceptMutation = useMutation({
    mutationFn: () => {
      const schedule = preview.branches
        .map((b) => buildBranchSchedule(b.id, schedules[b.id]))
        .filter((s): s is NonNullable<typeof s> => s !== null);

      return acceptStaffInvite({
        invitation_id: invitationId,
        token,
        password,
        schedule: schedule.length > 0 ? schedule : undefined,
      });
    },
    onSuccess: async (response) => {
      if (response.data.profiles?.length) {
        setPendingProfileSelection({ profiles: response.data.profiles });
        setAvailableProfiles(response.data.profiles);
        toast.success(t("success"));
        router.replace("/select-profile");
        return;
      }
      if (response.data.authenticated) {
        setAuthenticated();
        try {
          const me = await apiAuthFetch<ApiResponse<CurrentUser>>("/auth/me");
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
    !acceptMutation.isPending;

  return (
    <div className="w-full max-w-xl space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex size-8 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition-colors hover:border-brand-primary/40 hover:text-brand-black"
          aria-label={t("preview.back")}
        >
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-brand-black">
            {t("title")}
          </h1>
          <p className="text-sm text-gray-500">{t("subtitle")}</p>
        </div>
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
            <p className="text-sm font-semibold text-brand-black">
              {t("createPassword")}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              {t("createPasswordHint")}
            </p>
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
                {showConfirm ? (
                  <Eye className="size-4" />
                ) : (
                  <EyeOff className="size-4" />
                )}
              </button>
            </div>
            {!passwordsMatch && confirmPassword.length > 0 && (
              <p className="text-xs text-red-500">{t("passwordMismatch")}</p>
            )}
          </div>
        </div>

        {/* Per-branch schedule */}
        {preview.branches.map((branch) => {
          const state = schedules[branch.id];
          return (
            <div
              key={branch.id}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="mb-3">
                <p className="text-sm font-semibold text-brand-black">
                  {t("setSchedule")} — {branch.name}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {t("scheduleHint")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {STAFF_INVITE_DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(branch.id, day)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                      state.activeDays.has(day)
                        ? "bg-brand-primary text-white"
                        : "border border-gray-200 bg-gray-50 text-gray-500 hover:border-brand-primary/40 hover:text-brand-black",
                    )}
                  >
                    {STAFF_INVITE_DAY_LABELS[day]}
                  </button>
                ))}
              </div>
              {state.activeDays.size > 0 && (
                <div className="mt-3 space-y-2.5">
                  {STAFF_INVITE_DAYS.filter((d) => state.activeDays.has(d)).map(
                    (day) => (
                      <div key={day} className="flex items-center gap-2">
                        <span className="w-8 shrink-0 text-xs font-medium text-gray-500">
                          {STAFF_INVITE_DAY_LABELS[day]}
                        </span>
                        <input
                          type="time"
                          value={state.shifts[day].start}
                          onChange={(e) =>
                            updateShift(branch.id, day, "start", e.target.value)
                          }
                          className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs text-brand-black outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                        />
                        <span className="text-xs text-gray-400">–</span>
                        <input
                          type="time"
                          value={state.shifts[day].end}
                          onChange={(e) =>
                            updateShift(branch.id, day, "end", e.target.value)
                          }
                          className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs text-brand-black outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                        />
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          );
        })}

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

