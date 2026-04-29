import type { RegistrationStep } from "../types/sign-up.types";

export function getSignupResumePath(step: RegistrationStep) {
  if (step === "VERIFY_OTP") return "/sign-up/verify";
  if (step === "COMPLETE_ONBOARDING") return "/sign-up/complete";
  if (step === "DONE") return "/sign-in";
  return "/sign-up";
}
