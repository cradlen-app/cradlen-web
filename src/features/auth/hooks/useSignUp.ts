import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  RegisterPersonalRequest,
  VerifyEmailRequest,
  RegisterOrganizationRequest,
  ResendOtpRequest,
  RegistrationTokenResponse,
  RegisterOrganizationResponse,
  LoginResponse,
} from "../types/sign-up.types";
import type { SignInRequest } from "../types/sign-in.types";

export function useRegisterPersonal() {
  return useMutation({
    mutationFn: (data: RegisterPersonalRequest) =>
      apiFetch<RegistrationTokenResponse>("/auth/register/personal", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (data: VerifyEmailRequest) =>
      apiFetch<RegistrationTokenResponse>("/auth/register/verify-email", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useRegisterOrganization() {
  return useMutation({
    mutationFn: (data: RegisterOrganizationRequest) =>
      apiFetch<RegisterOrganizationResponse>("/auth/register/organization", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: (data: ResendOtpRequest) =>
      apiFetch<RegistrationTokenResponse>("/auth/register/resend-otp", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useResumeRegistration() {
  return useMutation({
    mutationFn: (data: SignInRequest) =>
      apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}
