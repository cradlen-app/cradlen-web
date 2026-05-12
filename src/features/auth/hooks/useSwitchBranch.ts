import { useMutation } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/infrastructure/http/api";
import { toast } from "sonner";

type SwitchBranchRequest = { branch_id: string };
type SwitchBranchResponse = {
  data: { branch_id: string | null };
  meta: Record<string, unknown>;
};

export function useSwitchBranch() {
  return useMutation({
    mutationFn: (data: SwitchBranchRequest) =>
      apiFetch<SwitchBranchResponse>("/auth/switch-branch", {
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
