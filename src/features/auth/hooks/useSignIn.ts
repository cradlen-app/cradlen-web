import { useMutation } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api";
import { toast } from "sonner";
import type { LoginProfilesResponse, SignInRequest } from "../types/sign-in.types";

export function useSignIn() {
  return useMutation({
    mutationFn: (data: SignInRequest) =>
      apiFetch<LoginProfilesResponse>("/auth/login", {
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
