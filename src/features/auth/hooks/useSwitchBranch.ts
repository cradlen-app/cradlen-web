import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

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
  });
}
