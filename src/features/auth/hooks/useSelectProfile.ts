import { useMutation } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api";
import { toast } from "sonner";
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
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? (error.messages[0] ?? "An error occurred")
          : "An error occurred";
      toast.error(message);
    },
  });
}
