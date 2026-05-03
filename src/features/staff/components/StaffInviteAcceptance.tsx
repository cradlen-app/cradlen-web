"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/features/auth/store/authStore";
import { setPendingProfileSelection } from "@/features/auth/lib/profile-selection-session";
import { acceptStaffInvite } from "../lib/staff.api";

const DEFAULT_AUTH_REDIRECT = "/dashboard";

function getInviteErrorKey(error: unknown) {
  if (!(error instanceof ApiError)) return "serverError";
  if (error.status === 401) return "invalid";
  if (error.status === 409) return "accepted";
  if (error.status === 410) return "expired";
  return "serverError";
}

export function StaffInviteAcceptance() {
  const t = useTranslations("staff.invite");
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const token = searchParams.get("token") ?? "";
  const invitationId = searchParams.get("invitation") ?? searchParams.get("invite") ?? "";
  const hasParams = Boolean(token && invitationId);

  const acceptMutation = useMutation({
    mutationFn: () =>
      acceptStaffInvite({
        invitation_id: invitationId,
        token,
        password,
        ...(firstName.trim() && { first_name: firstName.trim() }),
        ...(lastName.trim() && { last_name: lastName.trim() }),
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

  const canSubmit = password.length >= 8 && hasParams && !acceptMutation.isPending;

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
        {/* Name */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-brand-black">{t("yourName")}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs text-gray-400">{t("firstName")}</label>
              <input
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={cn(
                  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-brand-black",
                  "outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20",
                )}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-gray-400">{t("lastName")}</label>
              <input
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={cn(
                  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-brand-black",
                  "outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20",
                )}
              />
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3">
            <p className="text-sm font-semibold text-brand-black">{t("createPassword")}</p>
            <p className="mt-0.5 text-xs text-gray-400">{t("createPasswordHint")}</p>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
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
