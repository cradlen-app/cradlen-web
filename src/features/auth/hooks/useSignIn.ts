import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { SignInRequest } from "../types/sign-in.types";
import type { LoginResponse } from "../types/sign-up.types";

export function useSignIn() {
  return useMutation({
    mutationFn: (data: SignInRequest) =>
      apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}
