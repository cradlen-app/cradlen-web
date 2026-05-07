import { useMutation } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api";
import { toast } from "sonner";
import type {
  ForgotPasswordResetRequest,
  ForgotPasswordStartRequest,
  ForgotPasswordVerifyRequest,
  ForgotPasswordSuccessResponse,
} from "../types/forgot-password.types";

export function useStartForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordStartRequest) =>
      apiFetch<ForgotPasswordSuccessResponse>("/auth/forgot-password/start", {
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

export function useVerifyForgotPasswordOtp() {
  return useMutation({
    mutationFn: (data: ForgotPasswordVerifyRequest) =>
      apiFetch<ForgotPasswordSuccessResponse>("/auth/forgot-password/verify", {
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

export function useResendForgotPasswordOtp() {
  return useMutation({
    mutationFn: () =>
      apiFetch<ForgotPasswordSuccessResponse>("/auth/forgot-password/resend", {
        method: "POST",
        body: "{}",
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

export function useResetForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordResetRequest) =>
      apiFetch<void>("/auth/forgot-password/reset", {
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
