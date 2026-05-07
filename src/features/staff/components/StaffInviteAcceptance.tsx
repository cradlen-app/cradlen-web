"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
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
import type { ApiResponse } from "@/types/api.types";
import type { InvitationPreview } from "../types/staff.api.types";
import {
  getInvitationPreview,
  declineStaffInvite,
  acceptStaffInvite,
} from "../lib/staff.api";
import {
  STAFF_INVITE_DAYS,
  STAFF_INVITE_DAY_LABELS,
} from "../lib/staff-invite.schemas";

type DayCode = (typeof STAFF_INVITE_DAYS)[number];

type ShiftTime = { start: string; end: string };

type BranchScheduleState = {
  activeDays: Set<DayCode>;
  shifts: Record<DayCode, ShiftTime>;
};

const DEFAULT_SHIFTS: Record<DayCode, ShiftTime> = Object.fromEntries(
  STAFF_INVITE_DAYS.map((d) => [d, { start: "09:00", end: "17:00" }]),
) as Record<DayCode, ShiftTime>;

function makeDefaultBranchSchedule(): BranchScheduleState {
  return { activeDays: new Set(), shifts: { ...DEFAULT_SHIFTS } };
}

function buildBranchSchedule(branchId: string, state: BranchScheduleState) {
  if (state.activeDays.size === 0) return null;
  return {
    branch_id: branchId,
    days: STAFF_INVITE_DAYS.filter((d) => state.activeDays.has(d)).map((d) => ({
      day_of_week: d,
      shifts: [
        { start_time: state.shifts[d].start, end_time: state.shifts[d].end },
      ],
    })),
  };
}

function getPreviewErrorKey(error: unknown) {
  if (!(error instanceof ApiError)) return "serverError";
  if (error.status === 401) return "invalid";
  if (error.status === 409) return "accepted";
  if (error.status === 410) return "expired";
  return "serverError";
}

function getInviteErrorKey(error: unknown) {
  if (!(error instanceof ApiError)) return "serverError";
  if (error.status === 401) return "invalid";
  if (error.status === 409) return "accepted";
  if (error.status === 410) return "expired";
  return "serverError";
}

// — Preview Step —

interface PreviewStepProps {
  preview: InvitationPreview;
  token: string;
  invitationId: string;
  onAccept: () => void;
}

function PreviewStep({
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
              {preview.roles.map((r) => r.name).join(", ")}
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

// — Accept Step —

interface AcceptStepProps {
  preview: InvitationPreview;
  token: string;
  invitationId: string;
  onBack: () => void;
}

function AcceptStep({ preview, token, invitationId, onBack }: AcceptStepProps) {
  const t = useTranslations("staff.invite");
  const router = useRouter();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

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

// — Root component —

export function StaffInviteAcceptance() {
  const t = useTranslations("staff.invite");
  const searchParams = useSearchParams();

  const token = searchParams.get("token") ?? "";
  const invitationId =
    searchParams.get("invitation") ?? searchParams.get("invite") ?? "";
  const hasParams = Boolean(token && invitationId);

  const [step, setStep] = useState<"preview" | "accept">("preview");

  const previewQuery = useQuery({
    queryKey: ["invitation-preview", invitationId, token],
    queryFn: () => getInvitationPreview(invitationId, token),
    enabled: hasParams,
    retry: false,
  });

  if (!hasParams) {
    return (
      <div className="w-full max-w-xl">
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-center text-sm text-red-600">
          {t("errors.missing")}
        </div>
      </div>
    );
  }

  if (previewQuery.isLoading) {
    return (
      <div className="w-full max-w-xl space-y-4">
        <div className="h-7 w-48 animate-pulse rounded-lg bg-gray-100 mx-auto" />
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-gray-100" />
          ))}
        </div>
        <div className="h-11 animate-pulse rounded-full bg-gray-100" />
      </div>
    );
  }

  if (previewQuery.isError || !previewQuery.data?.data) {
    return (
      <div className="w-full max-w-xl">
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-center text-sm text-red-600">
          {t(`errors.${getPreviewErrorKey(previewQuery.error)}`)}
        </div>
      </div>
    );
  }

  const preview = previewQuery.data.data;

  if (step === "accept") {
    return (
      <AcceptStep
        preview={preview}
        token={token}
        invitationId={invitationId}
        onBack={() => setStep("preview")}
      />
    );
  }

  return (
    <PreviewStep
      preview={preview}
      token={token}
      invitationId={invitationId}
      onAccept={() => setStep("accept")}
    />
  );
}
