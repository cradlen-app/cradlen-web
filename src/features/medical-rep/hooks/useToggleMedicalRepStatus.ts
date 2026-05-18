"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { getApiErrorMessage } from "@/common/errors/error";
import { medicalRepQueryKeys } from "../lib/medical-rep.queryKeys";
import { toggleMedicalRepStatus } from "../lib/medical-rep.api";

export function useToggleMedicalRepStatus() {
  const queryClient = useQueryClient();
  const t = useTranslations("medicalRep.toast");
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "blocked" }) =>
      toggleMedicalRepStatus(id, status),
    onSuccess: async (_, { status }) => {
      await queryClient.invalidateQueries({ queryKey: medicalRepQueryKeys.all() });
      toast.success(status === "blocked" ? t("blocked") : t("unblocked"));
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t("error")));
    },
  });
}
