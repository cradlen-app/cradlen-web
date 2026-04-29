import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  SelectProfileRequest,
  SelectProfileResponse,
} from "../types/sign-in.types";

export function useSelectProfile() {
  return useMutation({
    mutationFn: (data: SelectProfileRequest) =>
      apiFetch<SelectProfileResponse>("/auth/profiles/select", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}
