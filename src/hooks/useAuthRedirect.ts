"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import {
  clearPendingSignupSession,
  getPendingSignupEmail,
} from "@/features/auth/lib/registration-session";
import { useRegistrationStatus } from "@/features/auth/hooks/useSignUp";
import type { RegistrationStep } from "@/features/auth/types/sign-up.types";

export type SignupRouteStep = RegistrationStep;

export type SignupStatusRedirectPath =
  | "/sign-up"
  | "/sign-up/verify"
  | "/sign-up/complete"
  | "/sign-in";

type UseAuthRedirectOptions = {
  currentStep: SignupRouteStep;
};

export function getRegistrationStatusRedirectPath(
  step: RegistrationStep,
  currentStep: SignupRouteStep,
): SignupStatusRedirectPath | null {
  if (step === currentStep) return null;
  if (step === "NONE") return currentStep === "NONE" ? null : "/sign-up";
  if (step === "VERIFY_OTP") return "/sign-up/verify";
  if (step === "COMPLETE_ONBOARDING") return "/sign-up/complete";
  return "/sign-in";
}

export function isExpiredRegistrationStatusError(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

export function useAuthRedirect({ currentStep }: UseAuthRedirectOptions) {
  const router = useRouter();
  const [email] = useState<string | null>(() => getPendingSignupEmail());
  const shouldCheckRegistrationStatus = !!email;
  const registrationStatus = useRegistrationStatus(
    shouldCheckRegistrationStatus ? email : null,
  );
  const nextPath = shouldCheckRegistrationStatus && registrationStatus.data
    ? getRegistrationStatusRedirectPath(registrationStatus.data.step, currentStep)
    : null;
  const hasExpiredStatus =
    shouldCheckRegistrationStatus &&
    isExpiredRegistrationStatusError(registrationStatus.error);

  useEffect(() => {
    if (!email) {
      if (currentStep !== "NONE") router.replace("/sign-up");
      return;
    }

    if (!shouldCheckRegistrationStatus) return;

    if (hasExpiredStatus) {
      clearPendingSignupSession();
      router.replace("/sign-in");
      return;
    }

    if (!registrationStatus.data) return;

    if (!nextPath) return;
    if (registrationStatus.data.step === "NONE" || registrationStatus.data.step === "DONE") {
      clearPendingSignupSession();
    }

    router.replace(nextPath);
  }, [
    currentStep,
    email,
    hasExpiredStatus,
    nextPath,
    registrationStatus.data,
    router,
    shouldCheckRegistrationStatus,
  ]);

  return {
    email,
    isChecking:
      (!email && currentStep !== "NONE") ||
      (shouldCheckRegistrationStatus &&
        (registrationStatus.isLoading || hasExpiredStatus || !!nextPath)),
  };
}
