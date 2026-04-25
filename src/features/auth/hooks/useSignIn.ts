import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { SignInRequest, AuthTokens } from "../types/sign-in.types";

export function useSignIn() {
  return useMutation({
    mutationFn: (data: SignInRequest) =>
      apiFetch<AuthTokens>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}
