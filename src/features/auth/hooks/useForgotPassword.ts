import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  VerifyResetCodeRequest,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from "../types/forgot-password.types";

export function useSendResetCode() {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) =>
      apiFetch<ForgotPasswordResponse>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useVerifyResetCode() {
  return useMutation({
    mutationFn: (data: VerifyResetCodeRequest) =>
      apiFetch<ForgotPasswordResponse>("/auth/forgot-password/verify-code", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (data: ResetPasswordRequest) =>
      apiFetch<ResetPasswordResponse>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}
