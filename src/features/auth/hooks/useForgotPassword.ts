import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  ForgotPasswordResetRequest,
  ForgotPasswordResendRequest,
  ForgotPasswordStartRequest,
  ForgotPasswordVerifyRequest,
  ResetTokenResponse,
} from "../types/forgot-password.types";

export function useStartForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordStartRequest) =>
      apiFetch<ResetTokenResponse>("/auth/forgot-password/start", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useVerifyForgotPasswordOtp() {
  return useMutation({
    mutationFn: (data: ForgotPasswordVerifyRequest) =>
      apiFetch<ResetTokenResponse>("/auth/forgot-password/verify", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useResendForgotPasswordOtp() {
  return useMutation({
    mutationFn: (data: ForgotPasswordResendRequest) =>
      apiFetch<ResetTokenResponse>("/auth/forgot-password/resend", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useResetForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordResetRequest) =>
      apiFetch<void>("/auth/forgot-password/reset", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}
