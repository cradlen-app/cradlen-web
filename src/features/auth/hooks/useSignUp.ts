import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/infrastructure/http/api";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "sonner";
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
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? (error.messages[0] ?? "An error occurred")
          : "An error occurred";
      toast.error(message);
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (data: VerifyEmailRequest) =>
      apiFetch<RegistrationTokenResponse>("/auth/signup/verify", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? (error.messages[0] ?? "An error occurred")
          : "An error occurred";
      toast.error(message);
    },
  });
}

export function useRegisterOrganization() {
  return useMutation({
    mutationFn: (data: RegisterOrganizationRequest) =>
      apiFetch<SignupCompleteResponse>("/auth/signup/complete", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? (error.messages[0] ?? "An error occurred")
          : "An error occurred";
      toast.error(message);
    },
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: (data: ResendOtpRequest) =>
      apiFetch<{ success: true }>("/auth/signup/resend", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? (error.messages[0] ?? "An error occurred")
          : "An error occurred";
      toast.error(message);
    },
  });
}

export function useRegistrationStatus(email: string | null) {
  return useQuery({
    queryKey: queryKeys.registrationStatus(email ?? ""),
    enabled: !!email,
    retry: false,
    queryFn: () =>
      apiFetch<RegistrationStatusResponse>(
        `/auth/registration/status?email=${encodeURIComponent(email ?? "")}`,
      ),
  });
}
