"use client";

import { Loader2, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useStaff } from "../hooks/useStaff";
import { useReactivateStaff } from "../hooks/useManageStaff";

/**
 * Lists staff who were deactivated (freed their seat — e.g. to fit a smaller
 * plan) with a Reactivate action. Renders nothing when there are none, so it
 * only appears once a member has been deactivated. Reactivation is gated by the
 * plan's staff limit server-side; the error surfaces as a toast.
 */
export function InactiveStaffPanel({
  organizationId,
  branchId,
}: {
  organizationId: string | undefined;
  branchId: string | undefined;
}) {
  const t = useTranslations("staff");
  const { data: inactive = [], isLoading } = useStaff(organizationId, branchId, {
    status: "inactive",
  });
  const reactivate = useReactivateStaff();

  if (isLoading || inactive.length === 0) return null;

  function onReactivate(staffId: string) {
    if (!organizationId || !branchId) return;
    reactivate.mutate(
      { organizationId, branchId, staffId },
      { onSuccess: () => toast.success(t("inactive.reactivated")) },
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white/50 p-4">
      <h3 className="text-sm font-medium text-brand-black">
        {t("inactive.title")}
      </h3>
      <p className="mt-1 text-xs text-gray-400">{t("inactive.description")}</p>
      <ul className="mt-3 space-y-2">
        {inactive.map((member) => (
          <li
            key={member.id}
            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-300 text-xs font-semibold text-white">
              {`${member.firstName.charAt(0)}${member.lastName.charAt(0)}`.toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-brand-black">
                {member.firstName} {member.lastName}
              </p>
              <p className="truncate text-xs text-gray-400">
                {member.roleName}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={reactivate.isPending}
              onClick={() => onReactivate(member.id)}
            >
              {reactivate.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RotateCcw className="size-3.5" />
              )}
              {t("inactive.reactivate")}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
