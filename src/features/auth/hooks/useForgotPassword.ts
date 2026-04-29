import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  ForgotPasswordResetRequest,
  ForgotPasswordResendRequest,
  ForgotPasswordStartRequest,
  ForgotPasswordSuccessResponse,
  ForgotPasswordVerifyRequest,
  ForgotPasswordVerifyResponse,
} from "../types/forgot-password.types";

export function useStartForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordStartRequest) =>
      apiFetch<ForgotPasswordSuccessResponse>("/auth/forgot-password/start", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useVerifyForgotPasswordOtp() {
  return useMutation({
    mutationFn: (data: ForgotPasswordVerifyRequest) =>
      apiFetch<ForgotPasswordVerifyResponse>("/auth/forgot-password/verify", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useResendForgotPasswordOtp() {
  return useMutation({
    mutationFn: (data: ForgotPasswordResendRequest) =>
      apiFetch<ForgotPasswordSuccessResponse>("/auth/forgot-password/resend", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useResetForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordResetRequest) =>
      apiFetch<ForgotPasswordSuccessResponse>("/auth/forgot-password/reset", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}
