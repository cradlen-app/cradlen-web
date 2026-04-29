import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { LoginProfilesResponse, SignInRequest } from "../types/sign-in.types";

export function useSignIn() {
  return useMutation({
    mutationFn: (data: SignInRequest) =>
      apiFetch<LoginProfilesResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}
