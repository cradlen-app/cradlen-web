import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  RegisterPersonalRequest,
  RegistrationStatusResponse,
  RegistrationTokenResponse,
  VerifyEmailRequest,
  RegisterOrganizationRequest,
  ResendOtpRequest,
  SignupCompleteResponse,
} from "../types/sign-up.types";

export function useRegisterPersonal() {
  return useMutation({
    mutationFn: (data: RegisterPersonalRequest) =>
      apiFetch<RegistrationTokenResponse>("/auth/signup/start", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (data: VerifyEmailRequest) =>
      apiFetch<unknown>("/auth/signup/verify", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useRegisterOrganization() {
  return useMutation({
    mutationFn: (data: RegisterOrganizationRequest) =>
      apiFetch<SignupCompleteResponse>("/auth/signup/complete", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: (data: ResendOtpRequest) =>
      apiFetch<{ success: true }>("/auth/signup/resend", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useRegistrationStatus(email: string | null) {
  return useQuery({
    queryKey: ["registration-status", email],
    enabled: !!email,
    retry: false,
    queryFn: () =>
      apiFetch<RegistrationStatusResponse>(
        `/auth/registration/status?email=${encodeURIComponent(email ?? "")}`,
      ),
  });
}
